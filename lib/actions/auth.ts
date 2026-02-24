"use server"
import { cookies } from "next/headers"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { redirect } from "next/navigation"

const ALLOWED_ROLES = ["ROOT", "SUPER_ADMIN", "MANAGER"]

export async function adminLogin(idToken: string): Promise<{ redirect: string; error?: string }> {
  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    const decoded = await adminAuth.verifyIdToken(idToken)

    // Check admin_users collection (primary method)
    const adminDoc = await adminDb.collection("admin_users").doc(decoded.uid).get()
    if (!adminDoc.exists) return { redirect: "/login", error: "access_denied" }
    const adminData = adminDoc.data()!
    if (!ALLOWED_ROLES.includes(adminData.role)) return { redirect: "/login", error: "access_denied" }

    const expiresIn = 60 * 60 * 24 * 7 * 1000
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    cookies().set("session", sessionCookie, {
      maxAge: expiresIn / 1000, httpOnly: true,
      secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/",
    })
    return { redirect: "/dashboard" }
  } catch {
    return { redirect: "/login", error: "auth_failed" }
  }
}

export async function logout() {
  "use server"
  cookies().delete("session")
  redirect("/login")
}

export async function getAdminUser() {
  const session = cookies().get("session")?.value
  if (!session) return null
  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true)
    const doc = await getAdminDb().collection("admin_users").doc(decoded.uid).get()
    if (!doc.exists) return null
    return { uid: decoded.uid, ...doc.data() }
  } catch { return null }
}
