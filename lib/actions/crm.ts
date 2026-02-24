"use server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { serializeFirestoreData } from "@/lib/utils"

async function requireAdmin() {
  const cookieStore = cookies()
  const session = cookieStore.get("session")?.value
  if (!session) throw new Error("Unauthorized: No session cookie found")

  let decoded
  try {
    decoded = await getAdminAuth().verifySessionCookie(session, true)
  } catch {
    throw new Error("Unauthorized: Invalid or expired session")
  }

  // Verify the user is actually in the admin_users collection
  console.log("🔥 ĐANG TÌM UID NÀY:", decoded.uid);
  const adminDoc = await getAdminDb().collection("admin_users").doc(decoded.uid).get()
  if (!adminDoc.exists) throw new Error("Forbidden: User is not an admin")

  return decoded
}

// ── Users ──────────────────────────────────────────────────────────────────────
export async function getAllUsers() {
  await requireAdmin()
  const snap = await getAdminDb().collection("users").orderBy("createdAt", "desc").limit(100).get()
  return snap.docs.map(d => serializeFirestoreData({ id: d.id, ...d.data() }))
}

export async function freezeUser(userId: string, freeze: boolean) {
  await requireAdmin()
  await getAdminDb().collection("users").doc(userId).update({ isFrozen: freeze })
}

export async function toggleCardFreezeAdmin(cardDocId: string, freeze: boolean) {
  await requireAdmin()
  await getAdminDb().collection("cards").doc(cardDocId).update({ isFrozen: freeze })
}

// ── Merchants ─────────────────────────────────────────────────────────────────
export async function getAllMerchants() {
  await requireAdmin()
  const snap = await getAdminDb().collection("merchants").orderBy("createdAt", "desc").limit(100).get()
  return snap.docs.map(d => serializeFirestoreData({ id: d.id, ...d.data() }))
}

export async function freezeMerchant(merchantId: string, freeze: boolean) {
  await requireAdmin()
  await getAdminDb().collection("merchants").doc(merchantId).update({ isFrozen: freeze })
}

export async function updateMerchantPlan(merchantId: string, plan: "FREE" | "PRO" | "ENTERPRISE") {
  await requireAdmin()
  await getAdminDb().collection("merchants").doc(merchantId).update({
    currentPlan: plan, planUpdatedAt: FieldValue.serverTimestamp(),
  })
}

export async function updateUserTier(userId: string, tier: string) {
  await requireAdmin()
  await getAdminDb().collection("users").doc(userId).update({ tier })
}

export async function updateMerchantTier(merchantId: string, tier: string) {
  await requireAdmin()
  await getAdminDb().collection("merchants").doc(merchantId).update({ tier })
}

// ── Business Wallet Provisioning ──────────────────────────────────────────────
import * as crypto from "crypto"

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin + (process.env.PIN_SALT || "sharkfintech")).digest("hex")
}

export async function provisionBusinessWallet(data: {
  email: string; displayName: string; pinCode: string; tier: "BUSINESS" | "PREMIUM_BUSINESS"
}) {
  await requireAdmin()
  const adminAuth = getAdminAuth()
  const adminDb = getAdminDb()

  // 1) Get or create Firebase Auth user
  let uid: string
  try {
    const existing = await adminAuth.getUserByEmail(data.email)
    uid = existing.uid
  } catch {
    // User doesn't exist in Auth, create them
    const created = await adminAuth.createUser({ email: data.email, displayName: data.displayName })
    uid = created.uid
  }

  // 2) Check if they already have a stare-wallet account
  const userDoc = await adminDb.collection("users").doc(uid).get()
  if (userDoc.exists) {
    const existing = userDoc.data()
    // If they're already a B2C user, don't silently overwrite
    const existingTier = existing?.tier || "PRIORITY"
    if (!["BUSINESS", "PREMIUM_BUSINESS"].includes(existingTier)) {
      throw new Error(`Email này đã được sử dụng cho tài khoản B2C (${existingTier}). Hãy nâng cấp tier thay vì tạo mới.`)
    }
    // Update existing B2B account
    await adminDb.collection("users").doc(uid).update({
      displayName: data.displayName.trim(),
      pinCode: hashPin(data.pinCode),
      tier: data.tier,
    })
    return uid
  }

  // 3) Create new user document
  await adminDb.collection("users").doc(uid).set({
    uid,
    email: data.email,
    displayName: data.displayName.trim(),
    pinCode: hashPin(data.pinCode),
    mainBalance: 0,
    isFrozen: false,
    tier: data.tier,
    createdAt: FieldValue.serverTimestamp(),
  })

  return uid
}

// ── Transactions & Refunds ─────────────────────────────────────────────────────
export async function getAllTransactions(limitCount = 100) {
  await requireAdmin()
  const snap = await getAdminDb().collection("transactions")
    .orderBy("timestamp", "desc").limit(limitCount).get()
  return snap.docs.map(d => serializeFirestoreData({ id: d.id, ...d.data() }))
}

export async function refundTransaction(transactionId: string) {
  await requireAdmin()
  const db = getAdminDb()
  const txDoc = await db.collection("transactions").doc(transactionId).get()
  if (!txDoc.exists) throw new Error("Transaction not found")
  const tx = txDoc.data()!
  if (tx.refundedByAdmin) throw new Error("Already refunded")
  if (tx.status !== "COMPLETED") throw new Error("Can only refund completed transactions")

  const refundId = uuidv4()

  await db.runTransaction(async (t) => {
    if (tx.type === "P2P") {
      // Return full amount to sender, deduct netAmount from receiver
      const senderRef = db.collection("users").doc(tx.senderId)
      const receiverRef = db.collection("users").doc(tx.receiverId)
      const receiverSnap = await t.get(receiverRef)
      if (!receiverSnap.exists) throw new Error("Receiver not found")
      if ((receiverSnap.data()!.mainBalance || 0) < tx.netAmount) throw new Error("Receiver has insufficient balance for refund")
      t.update(senderRef, { mainBalance: FieldValue.increment(tx.amount) })
      t.update(receiverRef, { mainBalance: FieldValue.increment(-tx.netAmount) })
    } else if (tx.type === "PAYMENT") {
      // Return amount to user, deduct netAmount from merchant
      const userRef = db.collection("users").doc(tx.senderId)
      const merchantRef = db.collection("merchants").doc(tx.receiverId)
      const merchantSnap = await t.get(merchantRef)
      if (!merchantSnap.exists) throw new Error("Merchant not found")
      if ((merchantSnap.data()!.balance || 0) < tx.netAmount) throw new Error("Merchant has insufficient balance for refund")
      t.update(userRef, { mainBalance: FieldValue.increment(tx.amount) })
      t.update(merchantRef, { balance: FieldValue.increment(-tx.netAmount) })
    }

    // Mark original as refunded
    t.update(txDoc.ref, { refundedByAdmin: true, refundedAt: FieldValue.serverTimestamp() })

    // Create audit log
    t.set(db.collection("transactions").doc(refundId), {
      transactionId: refundId, type: "REFUND_TICKET",
      originalTxId: transactionId, amount: tx.amount,
      netAmount: tx.amount, fee: 0,
      senderId: tx.receiverId, receiverId: tx.senderId,
      status: "COMPLETED", refundedByAdmin: false,
      timestamp: FieldValue.serverTimestamp(),
    })
  })
  return refundId
}

// ── Card Templates ─────────────────────────────────────────────────────────────
export async function createCardTemplate(data: {
  name: string; issuer: string; backgroundType: "GRADIENT" | "IMAGE";
  backgroundValue: string; textTheme: "LIGHT" | "DARK";
}) {
  const decoded = await requireAdmin()
  const templateId = uuidv4()
  await getAdminDb().collection("card_templates").doc(templateId).set({
    templateId, ...data, status: "DRAFT",
    createdBy: decoded.uid, createdAt: FieldValue.serverTimestamp(),
  })
  return templateId
}

export async function publishCardTemplate(templateId: string, publish: boolean) {
  await requireAdmin()
  await getAdminDb().collection("card_templates").doc(templateId).update({
    status: publish ? "PUBLISHED" : "DRAFT"
  })
}

export async function getAllCardTemplates() {
  await requireAdmin()
  const snap = await getAdminDb().collection("card_templates").orderBy("createdAt", "desc").get()
  return snap.docs.map(d => serializeFirestoreData({ id: d.id, ...d.data() }))
}

// ── Dashboard Stats ────────────────────────────────────────────────────────────
export async function getGlobalStats() {
  await requireAdmin()
  const db = getAdminDb()
  const [users, merchants, txs] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("merchants").count().get(),
    db.collection("transactions").where("status", "==", "COMPLETED")
      .orderBy("timestamp", "desc").limit(200).get(),
  ])
  const totalVolume = txs.docs.reduce((s, d) => s + (d.data().amount || 0), 0)
  const totalFees = txs.docs.reduce((s, d) => s + (d.data().fee || 0), 0)
  return {
    totalUsers: users.data().count,
    totalMerchants: merchants.data().count,
    totalVolume,
    totalFees,
    recentTxs: serializeFirestoreData(txs.docs.slice(0, 20).map(d => d.data())),
  }
}

// ── Detail Views ──────────────────────────────────────────────────────────────
export async function getUserDetail(userId: string) {
  await requireAdmin()
  const db = getAdminDb()
  const userDoc = await db.collection("users").doc(userId).get()
  if (!userDoc.exists) return null

  const [cardsSnap, sentSnap, rcvdSnap] = await Promise.all([
    db.collection("cards").where("userId", "==", userId).get(),
    db.collection("transactions").where("senderId", "==", userId).orderBy("timestamp", "desc").limit(50).get(),
    db.collection("transactions").where("receiverId", "==", userId).orderBy("timestamp", "desc").limit(50).get(),
  ])

  const txMap = new Map<string, any>()
  sentSnap.docs.forEach(d => txMap.set(d.id, { id: d.id, ...d.data() }))
  rcvdSnap.docs.forEach(d => txMap.set(d.id, { id: d.id, ...d.data() }))
  const allTxs = Array.from(txMap.values()).sort((a, b) =>
    (b.timestamp?._seconds || 0) - (a.timestamp?._seconds || 0)
  )

  return serializeFirestoreData({
    user: { id: userDoc.id, ...userDoc.data() },
    cards: cardsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    transactions: allTxs,
  })
}

export async function resetUserPin(userId: string) {
  await requireAdmin()
  const newPin = Math.floor(100000 + Math.random() * 900000).toString()
  const hashed = hashPin(newPin)
  await getAdminDb().collection("users").doc(userId).update({ pinCode: hashed })
  return newPin // Admin sees this once to relay to user
}

export async function getMerchantDetail(merchantId: string) {
  await requireAdmin()
  const db = getAdminDb()
  const merchDoc = await db.collection("merchants").doc(merchantId).get()
  if (!merchDoc.exists) return null

  const [linksSnap, txSnap] = await Promise.all([
    db.collection("payment_links").where("merchantId", "==", merchantId).orderBy("createdAt", "desc").limit(50).get(),
    db.collection("transactions").where("receiverId", "==", merchantId).orderBy("timestamp", "desc").limit(50).get(),
  ])

  return serializeFirestoreData({
    merchant: { id: merchDoc.id, ...merchDoc.data() },
    paymentLinks: linksSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    transactions: txSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  })
}

// ── Advanced Support ──────────────────────────────────────────────────────────
export async function updateUserProfile(userId: string, updates: { displayName?: string; phone?: string }) {
  const decoded = await requireAdmin()
  const clean: any = {}
  if (updates.displayName?.trim()) clean.displayName = updates.displayName.trim()
  if (updates.phone?.trim()) clean.phone = updates.phone.trim()
  if (Object.keys(clean).length === 0) throw new Error("Không có thay đổi")
  await getAdminDb().collection("users").doc(userId).update(clean)
}

export async function updateMerchantProfile(merchantId: string, updates: { businessName?: string; phone?: string; sector?: string }) {
  await requireAdmin()
  const clean: any = {}
  if (updates.businessName?.trim()) clean.businessName = updates.businessName.trim()
  if (updates.phone?.trim()) clean.phone = updates.phone.trim()
  if (updates.sector?.trim()) clean.sector = updates.sector.trim()
  if (Object.keys(clean).length === 0) throw new Error("Không có thay đổi")
  await getAdminDb().collection("merchants").doc(merchantId).update(clean)
}

export async function resetUserPassword(userId: string) {
  const decoded = await requireAdmin()
  const newPassword = crypto.randomBytes(6).toString("hex") // 12-char random password
  await getAdminAuth().updateUser(userId, { password: newPassword })
  // Audit log
  await getAdminDb().collection("admin_audit_logs").add({
    action: "RESET_PASSWORD", targetUserId: userId,
    performedBy: decoded.uid, timestamp: FieldValue.serverTimestamp(),
  })
  return newPassword
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export async function createUpgradeInvoice(data: {
  merchantId: string; amount: number; targetPlan: "FREE" | "PRO" | "ENTERPRISE"
}) {
  const decoded = await requireAdmin()
  const db = getAdminDb()
  const invoiceId = uuidv4()

  await db.collection("invoices").doc(invoiceId).set({
    invoiceId, merchantId: data.merchantId,
    amount: data.amount, targetPlan: data.targetPlan,
    status: "UNPAID", createdBy: decoded.uid,
    createdAt: FieldValue.serverTimestamp(),
  })

  // Notify merchant
  await db.collection("merchants").doc(data.merchantId)
    .collection("notifications").add({
      type: "UPGRADE_INVOICE", invoiceId,
      message: `Bạn có hóa đơn nâng cấp gói ${data.targetPlan} — ${data.amount.toLocaleString()} VND`,
      read: false, createdAt: FieldValue.serverTimestamp(),
    })

  return invoiceId
}

export async function getInvoicesForMerchant(merchantId: string) {
  await requireAdmin()
  const snap = await getAdminDb().collection("invoices")
    .where("merchantId", "==", merchantId).orderBy("createdAt", "desc").get()
  return snap.docs.map(d => serializeFirestoreData({ id: d.id, ...d.data() }))
}

export async function approveInvoice(invoiceId: string) {
  const decoded = await requireAdmin()
  const db = getAdminDb()
  const invoiceDoc = await db.collection("invoices").doc(invoiceId).get()
  if (!invoiceDoc.exists) throw new Error("Invoice không tồn tại")
  const invoice = invoiceDoc.data()!
  if (invoice.status !== "PAID") throw new Error("Invoice chưa được thanh toán")

  await db.runTransaction(async (t) => {
    // Mark COMPLETED
    t.update(invoiceDoc.ref, { status: "COMPLETED", approvedBy: decoded.uid, approvedAt: FieldValue.serverTimestamp() })
    // Upgrade merchant plan
    t.update(db.collection("merchants").doc(invoice.merchantId), {
      currentPlan: invoice.targetPlan, planUpdatedAt: FieldValue.serverTimestamp(),
    })
  })

  // Notify merchant of success
  await db.collection("merchants").doc(invoice.merchantId)
    .collection("notifications").add({
      type: "PLAN_UPGRADED", invoiceId,
      message: `Gói dịch vụ đã được nâng cấp thành ${invoice.targetPlan}!`,
      read: false, createdAt: FieldValue.serverTimestamp(),
    })
}

// ── Edit Invoice (UNPAID only) ────────────────────────────────────────────────
export async function editInvoice(invoiceId: string, newAmount: number, newTargetPlan: string) {
  await requireAdmin()
  const db = getAdminDb()
  const ref = db.collection("invoices").doc(invoiceId)
  const doc = await ref.get()
  if (!doc.exists) throw new Error("Invoice không tồn tại")
  if (doc.data()!.status !== "UNPAID") throw new Error("Chỉ sửa được hóa đơn chưa thanh toán")
  if (newAmount <= 0) throw new Error("Số tiền không hợp lệ")
  await ref.update({
    amount: newAmount,
    targetPlan: newTargetPlan,
    updatedAt: FieldValue.serverTimestamp(),
  })
}

// ── Cancel Invoice (UNPAID only) ──────────────────────────────────────────────
export async function cancelInvoice(invoiceId: string) {
  await requireAdmin()
  const db = getAdminDb()
  const ref = db.collection("invoices").doc(invoiceId)
  const doc = await ref.get()
  if (!doc.exists) throw new Error("Invoice không tồn tại")
  if (doc.data()!.status !== "UNPAID") throw new Error("Chỉ hủy được hóa đơn chưa thanh toán")
  await ref.update({ status: "CANCELED", canceledAt: FieldValue.serverTimestamp() })
}

// ── Suspend Invoice (PAID only) ───────────────────────────────────────────────
export async function suspendInvoice(invoiceId: string) {
  await requireAdmin()
  const db = getAdminDb()
  const ref = db.collection("invoices").doc(invoiceId)
  const doc = await ref.get()
  if (!doc.exists) throw new Error("Invoice không tồn tại")
  if (doc.data()!.status !== "PAID") throw new Error("Chỉ đình chỉ được hóa đơn đã thanh toán")
  await ref.update({ status: "SUSPENDED", suspendedAt: FieldValue.serverTimestamp() })
}

// ── Refund Invoice (Atomic Batch — Bulletproof Treasury Logic) ────────────────
export async function refundInvoice(invoiceId: string, merchantId?: string, _amount?: number) {
  await requireAdmin()
  const db = getAdminDb()

  // 1. Read invoice — single source of truth for amount and payer
  const invoiceRef = db.collection("invoices").doc(invoiceId)
  const invoiceSnap = await invoiceRef.get()
  if (!invoiceSnap.exists) throw new Error("Hóa đơn không tồn tại")
  const invoiceData = invoiceSnap.data()!

  if (invoiceData.status !== "PAID" && invoiceData.status !== "SUSPENDED") {
    throw new Error("Chỉ hoàn tiền được hóa đơn đã thanh toán hoặc đình chỉ")
  }

  const refundAmount = Number(invoiceData.amount)
  if (!refundAmount || refundAmount <= 0) throw new Error("Số tiền hoàn không hợp lệ")

  // The user who actually paid this invoice
  const payerId = invoiceData.paidBy || invoiceData.userId || merchantId
  if (!payerId) throw new Error("Không xác định được người thanh toán")

  const payerRef = db.collection("users").doc(payerId)

  // 2. Atomic batch: all succeed or all fail
  const batch = db.batch()

  // a) Credit payer's balance using atomic increment
  batch.update(payerRef, { mainBalance: FieldValue.increment(refundAmount) })

  // b) Log refund transaction
  const txRef = db.collection("transactions").doc(uuidv4())
  batch.set(txRef, {
    transactionId: txRef.id,
    type: "REFUND",
    senderId: "SYSTEM",
    receiverId: payerId,
    amount: refundAmount,
    netAmount: refundAmount,
    fee: 0,
    status: "COMPLETED",
    description: `Hoàn tiền hóa đơn ${invoiceId.slice(0, 8)}...`,
    category: "TRANSFER",
    timestamp: FieldValue.serverTimestamp(),
  })

  // c) Update invoice status
  batch.update(invoiceRef, {
    status: "REFUNDED",
    refundedAt: FieldValue.serverTimestamp(),
    refundAmount,
  })

  await batch.commit()

  // 3. Notify merchant (non-critical, outside batch)
  const mId = invoiceData.merchantId || merchantId
  if (mId) {
    await db.collection("merchants").doc(mId)
      .collection("notifications").add({
        type: "INVOICE_REFUNDED", invoiceId,
        message: `Hóa đơn ${invoiceId.slice(0, 8)}... đã được hoàn tiền ${refundAmount.toLocaleString("vi-VN")}₫`,
        read: false, createdAt: FieldValue.serverTimestamp(),
      })
  }
}
