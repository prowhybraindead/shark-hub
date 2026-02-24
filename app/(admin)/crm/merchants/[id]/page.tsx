"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    getMerchantDetail, freezeMerchant, updateMerchantPlan, updateMerchantTier,
    updateMerchantProfile, createUpgradeInvoice, getInvoicesForMerchant,
    approveInvoice, editInvoice, cancelInvoice, suspendInvoice, refundInvoice,
} from "@/lib/actions/crm"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Snowflake, CheckCircle, Building2, Link2, ArrowUpDown, Pencil, Receipt, Plus, Check, RefreshCw, XCircle, Pause, Undo2 } from "lucide-react"

const PLANS = ["FREE", "PRO", "ENTERPRISE"] as const
const MERCHANT_TIERS = ["BUSINESS", "PREMIUM_BUSINESS"] as const

export default function MerchantDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [invoices, setInvoices] = useState<any[]>([])

    // Edit profile state
    const [editOpen, setEditOpen] = useState(false)
    const [editName, setEditName] = useState("")
    const [editPhone, setEditPhone] = useState("")
    const [editSector, setEditSector] = useState("")

    // Invoice creation state
    const [invOpen, setInvOpen] = useState(false)
    const [invAmount, setInvAmount] = useState("")
    const [invPlan, setInvPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("PRO")

    // Edit invoice state
    const [editInvOpen, setEditInvOpen] = useState(false)
    const [editInvId, setEditInvId] = useState("")
    const [editInvAmount, setEditInvAmount] = useState("")
    const [editInvPlan, setEditInvPlan] = useState<"FREE" | "PRO" | "ENTERPRISE">("PRO")

    useEffect(() => {
        getMerchantDetail(id).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
        getInvoicesForMerchant(id).then(setInvoices).catch(() => { })
    }, [id])

    async function handleFreeze() {
        if (!data) return
        setProcessing(true)
        try {
            await freezeMerchant(id, !data.merchant.isFrozen)
            setData((prev: any) => ({ ...prev, merchant: { ...prev.merchant, isFrozen: !prev.merchant.isFrozen } }))
            toast({ title: data.merchant.isFrozen ? "Đã mở khóa" : "Đã đình chỉ" })
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handlePlanChange(plan: string) {
        setProcessing(true)
        try {
            await updateMerchantPlan(id, plan as any)
            setData((prev: any) => ({ ...prev, merchant: { ...prev.merchant, currentPlan: plan } }))
            toast({ title: `Đã đổi gói thành ${plan}` })
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleTierChange(tier: string) {
        setProcessing(true)
        try {
            await updateMerchantTier(id, tier)
            setData((prev: any) => ({ ...prev, merchant: { ...prev.merchant, tier } }))
            toast({ title: `Đã đổi tier thành ${tier}` })
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleEditProfile() {
        setProcessing(true)
        try {
            await updateMerchantProfile(id, { businessName: editName, phone: editPhone, sector: editSector })
            setData((prev: any) => ({ ...prev, merchant: { ...prev.merchant, businessName: editName.trim() || prev.merchant.businessName, phone: editPhone.trim() || prev.merchant.phone, sector: editSector.trim() || prev.merchant.sector } }))
            toast({ title: "Đã cập nhật hồ sơ" })
            setEditOpen(false)
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleCreateInvoice() {
        const amt = parseInt(invAmount)
        if (!amt || amt <= 0) { toast({ title: "Số tiền không hợp lệ", variant: "destructive" }); return }
        setProcessing(true)
        try {
            await createUpgradeInvoice({ merchantId: id, amount: amt, targetPlan: invPlan })
            toast({ title: "Đã tạo hóa đơn nâng cấp!" })
            setInvOpen(false); setInvAmount("")
            const updated = await getInvoicesForMerchant(id)
            setInvoices(updated)
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleApproveInvoice(invoiceId: string) {
        setProcessing(true)
        try {
            await approveInvoice(invoiceId)
            toast({ title: "Đã duyệt hóa đơn và nâng cấp gói!" })
            const updated = await getInvoicesForMerchant(id)
            setInvoices(updated)
            // Also refresh merchant data (plan changed)
            const refreshed = await getMerchantDetail(id)
            setData(refreshed)
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function refreshInvoices() {
        const updated = await getInvoicesForMerchant(id)
        setInvoices(updated)
        const refreshed = await getMerchantDetail(id)
        setData(refreshed)
    }

    async function handleCancelInvoice(invoiceId: string) {
        setProcessing(true)
        try {
            await cancelInvoice(invoiceId)
            toast({ title: "Đã hủy hóa đơn" })
            await refreshInvoices()
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleSuspendInvoice(invoiceId: string) {
        setProcessing(true)
        try {
            await suspendInvoice(invoiceId)
            toast({ title: "Đã đình chỉ hóa đơn" })
            await refreshInvoices()
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleRefundInvoice(invoiceId: string, merchantUid: string, amount: number) {
        setProcessing(true)
        try {
            await refundInvoice(invoiceId, merchantUid, amount)
            toast({ title: "Đã hoàn tiền thành công!" })
            await refreshInvoices()
        } catch (e: any) { toast({ title: "Lỗi hoàn tiền", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleEditInvoice() {
        const amt = parseInt(editInvAmount)
        if (!amt || amt <= 0) { toast({ title: "Số tiền không hợp lệ", variant: "destructive" }); return }
        setProcessing(true)
        try {
            await editInvoice(editInvId, amt, editInvPlan)
            toast({ title: "Đã cập nhật hóa đơn" })
            setEditInvOpen(false)
            await refreshInvoices()
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
    if (!data) return (
        <div className="text-center py-16 space-y-4">
            <p className="text-slate-400 text-lg">Không tìm thấy doanh nghiệp</p>
            <Button variant="outline" onClick={() => router.push("/crm/merchants")} className="border-white/10"><ArrowLeft className="w-4 h-4 mr-2" />Quay lại</Button>
        </div>
    )

    const m = data.merchant

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/crm/merchants")}><ArrowLeft className="w-5 h-5" /></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {m.businessName}
                        <Badge className="text-[10px]">{m.currentPlan}</Badge>
                        <Badge variant="outline" className="text-[10px]">{m.tier || "BUSINESS"}</Badge>
                    </h1>
                    <p className="text-slate-500 text-sm">{m.email} · {m.sector} · ID: {m.id}</p>
                </div>
            </div>

            {/* Profile + Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900/60 border-white/10 text-slate-100 md:col-span-2">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4" />Hồ sơ doanh nghiệp</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Tên DN</span><span className="font-medium">{m.businessName}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Ngành</span><span className="font-medium">{m.sector}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Email</span><span className="font-medium">{m.email}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Số dư</span><span className="font-semibold text-white">{formatCurrency(m.balance || 0)}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Trạng thái</span>
                            <Badge variant={m.isFrozen ? "destructive" : "success"}>{m.isFrozen ? "Đình chỉ" : "Hoạt động"}</Badge>
                        </div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">API Key</span><span className="font-mono text-xs text-slate-600 truncate block max-w-[200px]">{m.apiKey || "N/A"}</span></div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-white/10 text-slate-100">
                    <CardHeader><CardTitle className="text-sm">Hành động</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Button onClick={handleFreeze} disabled={processing} variant="outline" size="sm"
                            className={`w-full border-white/10 text-xs ${m.isFrozen ? "text-green-400" : "text-red-400"}`}>
                            {m.isFrozen ? <><CheckCircle className="w-3 h-3 mr-1" />Mở khóa</> : <><Snowflake className="w-3 h-3 mr-1" />Đình chỉ</>}
                        </Button>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Đổi Gói</label>
                            <Select value={m.currentPlan} onValueChange={handlePlanChange} disabled={processing}>
                                <SelectTrigger className="w-full h-8 bg-white/5 border-white/10 text-white text-xs mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10">
                                    {PLANS.map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Đổi Tier</label>
                            <Select value={m.tier || "BUSINESS"} onValueChange={handleTierChange} disabled={processing}>
                                <SelectTrigger className="w-full h-8 bg-white/5 border-white/10 text-white text-xs mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10">
                                    {MERCHANT_TIERS.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <hr className="border-white/10" />

                        {/* Edit Profile */}
                        <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (v) { setEditName(m.businessName || ""); setEditPhone(m.phone || ""); setEditSector(m.sector || "") } }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full border-white/10 text-xs text-blue-400">
                                    <Pencil className="w-3 h-3 mr-1" />Sửa hồ sơ
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm">
                                <DialogHeader><DialogTitle>Sửa hồ sơ doanh nghiệp</DialogTitle><DialogDescription className="hidden">Create a new invoice</DialogDescription></DialogHeader>
                                <div className="space-y-3">
                                    <div><Label>Tên DN</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" /></div>
                                    <div><Label>SĐT</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" /></div>
                                    <div><Label>Ngành</Label><Input value={editSector} onChange={e => setEditSector(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" /></div>
                                    <Button onClick={handleEditProfile} disabled={processing} className="w-full bg-blue-600 hover:bg-blue-700">Lưu</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="invoices" className="w-full">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="invoices" className="data-[state=active]:bg-white/10 text-xs gap-1"><Receipt className="w-3 h-3" />Hóa đơn ({invoices.length})</TabsTrigger>
                    <TabsTrigger value="links" className="data-[state=active]:bg-white/10 text-xs gap-1"><Link2 className="w-3 h-3" />Payment Links ({data.paymentLinks.length})</TabsTrigger>
                    <TabsTrigger value="transactions" className="data-[state=active]:bg-white/10 text-xs gap-1"><ArrowUpDown className="w-3 h-3" />Giao dịch ({data.transactions.length})</TabsTrigger>
                </TabsList>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="mt-4 space-y-4">
                    <Dialog open={invOpen} onOpenChange={setInvOpen}>
                        <div className="flex items-center gap-2">
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Tạo hóa đơn nâng cấp</Button>
                            </DialogTrigger>
                            <Button size="sm" variant="outline" className="border-white/10" onClick={refreshInvoices}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm">
                            <DialogHeader><DialogTitle>Tạo hóa đơn nâng cấp</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                                <div><Label>Gói đích</Label>
                                    <Select value={invPlan} onValueChange={v => setInvPlan(v as any)}>
                                        <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10">
                                            {PLANS.map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Số tiền (VND)</Label>
                                    <Input type="number" value={invAmount} onChange={e => setInvAmount(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="500000" />
                                </div>
                                <Button onClick={handleCreateInvoice} disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700">Tạo hóa đơn</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="glass rounded-xl border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-slate-400 text-xs">ID</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Gói đích</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Số tiền</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Trạng thái</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">Chưa có hóa đơn.</TableCell></TableRow>
                                )}
                                {invoices.map((inv: any) => (
                                    <TableRow key={inv.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell className="font-mono text-xs text-slate-400">{inv.invoiceId?.slice(0, 8)}...</TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px]">{inv.targetPlan}</Badge></TableCell>
                                        <TableCell className="font-semibold text-sm">{formatCurrency(inv.amount || 0)}</TableCell>
                                        <TableCell>
                                            <Badge variant={inv.status === "COMPLETED" ? "success" : inv.status === "PAID" ? "default" : "secondary"} className="text-[9px]">
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="space-x-1">
                                            {inv.status === "UNPAID" && (
                                                <>
                                                    <Button size="sm" variant="outline" disabled={processing}
                                                        onClick={() => { setEditInvId(inv.invoiceId); setEditInvAmount(String(inv.amount)); setEditInvPlan(inv.targetPlan); setEditInvOpen(true) }}
                                                        className="border-white/10 text-xs text-blue-400">
                                                        <Pencil className="w-3 h-3 mr-1" />Sửa
                                                    </Button>
                                                    <Button size="sm" variant="outline" disabled={processing}
                                                        onClick={() => handleCancelInvoice(inv.invoiceId)}
                                                        className="border-white/10 text-xs text-red-400">
                                                        <XCircle className="w-3 h-3 mr-1" />Hủy
                                                    </Button>
                                                </>
                                            )}
                                            {inv.status === "PAID" && (
                                                <>
                                                    <Button size="sm" variant="outline" disabled={processing}
                                                        onClick={() => handleApproveInvoice(inv.invoiceId)}
                                                        className="border-white/10 text-xs text-green-400">
                                                        <Check className="w-3 h-3 mr-1" />Duyệt
                                                    </Button>
                                                    <Button size="sm" variant="outline" disabled={processing}
                                                        onClick={() => handleSuspendInvoice(inv.invoiceId)}
                                                        className="border-white/10 text-xs text-yellow-400">
                                                        <Pause className="w-3 h-3 mr-1" />Đình chỉ
                                                    </Button>
                                                </>
                                            )}
                                            {inv.status === "SUSPENDED" && (
                                                <Button size="sm" variant="outline" disabled={processing}
                                                    onClick={() => handleRefundInvoice(inv.invoiceId, m.userId || id, inv.amount)}
                                                    className="border-white/10 text-xs text-purple-400">
                                                    <Undo2 className="w-3 h-3 mr-1" />Hoàn tiền
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Edit Invoice Dialog */}
                    <Dialog open={editInvOpen} onOpenChange={setEditInvOpen}>
                        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm">
                            <DialogHeader><DialogTitle>Sửa hóa đơn</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                                <div><Label>Gói đích</Label>
                                    <Select value={editInvPlan} onValueChange={v => setEditInvPlan(v as any)}>
                                        <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10">
                                            {PLANS.map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div><Label>Số tiền (VND)</Label>
                                    <Input type="number" value={editInvAmount} onChange={e => setEditInvAmount(e.target.value)}
                                        className="mt-1 bg-white/5 border-white/10 text-white" placeholder="500000" />
                                </div>
                                <Button onClick={handleEditInvoice} disabled={processing} className="w-full bg-blue-600 hover:bg-blue-700">Lưu thay đổi</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* Payment Links Tab */}
                <TabsContent value="links" className="mt-4">
                    <div className="glass rounded-xl border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-slate-400 text-xs">Mô tả</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Số tiền</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Trạng thái</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Ngày tạo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.paymentLinks.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-8">Chưa có link thanh toán.</TableCell></TableRow>
                                )}
                                {data.paymentLinks.map((l: any) => (
                                    <TableRow key={l.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell className="text-sm">{l.description || l.linkId || "—"}</TableCell>
                                        <TableCell className="font-semibold text-sm">{formatCurrency(l.amount || 0)}</TableCell>
                                        <TableCell><Badge variant={l.status === "PAID" ? "success" : "secondary"} className="text-[9px]">{l.status}</Badge></TableCell>
                                        <TableCell className="text-xs text-slate-400">{l.createdAt ? formatDate(l.createdAt) : "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="mt-4">
                    <div className="glass rounded-xl border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-slate-400 text-xs">Loại</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Số tiền</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Phí</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Trạng thái</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Thời gian</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.transactions.length === 0 && (
                                    <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">Chưa có giao dịch.</TableCell></TableRow>
                                )}
                                {data.transactions.map((tx: any) => (
                                    <TableRow key={tx.id || tx.transactionId} className="border-white/5 hover:bg-white/5">
                                        <TableCell><Badge variant="outline" className="text-[10px]">{tx.type}</Badge></TableCell>
                                        <TableCell className="font-semibold text-sm text-green-400">+{formatCurrency(tx.netAmount || 0)}</TableCell>
                                        <TableCell className="text-xs text-slate-500">{formatCurrency(tx.fee || 0)}</TableCell>
                                        <TableCell><Badge variant={tx.status === "COMPLETED" ? "success" : tx.status === "FAILED" ? "destructive" : "secondary"} className="text-[9px]">{tx.status}</Badge></TableCell>
                                        <TableCell className="text-xs text-slate-400">{tx.timestamp ? formatDate(tx.timestamp) : "—"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
