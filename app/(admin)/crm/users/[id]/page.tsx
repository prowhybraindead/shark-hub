"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getUserDetail, freezeUser, updateUserTier, resetUserPin, updateUserProfile, resetUserPassword } from "@/lib/actions/crm"
import { formatCurrency, formatDate, getCategoryLabel, CATEGORY_LABELS } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import {
    ArrowLeft, Loader2, Snowflake, CheckCircle, KeyRound, User, CreditCard, ArrowUpDown, Copy, Pencil, ShieldAlert,
    Lock, Unlock, Utensils, ShoppingBag, Car, Play, Zap, ArrowLeftRight, CircleDollarSign,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ALL_TIERS = ["PRIORITY", "SILVER", "GOLD", "DIAMOND", "RUBY", "BUSINESS", "PREMIUM_BUSINESS"] as const

export default function UserDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [generatedPin, setGeneratedPin] = useState<string | null>(null)
    const [generatedPwd, setGeneratedPwd] = useState<string | null>(null)
    const [editOpen, setEditOpen] = useState(false)
    const [editName, setEditName] = useState("")
    const [editPhone, setEditPhone] = useState("")

    useEffect(() => {
        getUserDetail(id).then(d => { setData(d); setLoading(false) })
            .catch(() => setLoading(false))
    }, [id])

    async function handleFreeze() {
        if (!data) return
        setProcessing(true)
        try {
            await freezeUser(id, !data.user.isFrozen)
            setData((prev: any) => ({ ...prev, user: { ...prev.user, isFrozen: !prev.user.isFrozen } }))
            toast({ title: data.user.isFrozen ? "Đã mở khóa" : "Đã khóa tài khoản" })
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleTierChange(tier: string) {
        setProcessing(true)
        try {
            await updateUserTier(id, tier)
            setData((prev: any) => ({ ...prev, user: { ...prev.user, tier } }))
            toast({ title: `Đã đổi tier thành ${tier}` })
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleResetPin() {
        setProcessing(true)
        try {
            const pin = await resetUserPin(id)
            setGeneratedPin(pin)
            toast({ title: "Đã reset PIN thành công" })
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleEditProfile() {
        setProcessing(true)
        try {
            await updateUserProfile(id, { displayName: editName, phone: editPhone })
            setData((prev: any) => ({ ...prev, user: { ...prev.user, displayName: editName.trim() || prev.user.displayName, phone: editPhone.trim() || prev.user.phone } }))
            toast({ title: "Đã cập nhật hồ sơ" })
            setEditOpen(false)
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    async function handleResetPassword() {
        setProcessing(true)
        try {
            const pwd = await resetUserPassword(id)
            setGeneratedPwd(pwd)
            toast({ title: "Đã reset mật khẩu" })
        } catch (e: any) { toast({ title: "Lỗi", description: e.message, variant: "destructive" }) }
        finally { setProcessing(false) }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
    if (!data) return (
        <div className="text-center py-16 space-y-4">
            <p className="text-slate-400 text-lg">Không tìm thấy người dùng</p>
            <Button variant="outline" onClick={() => router.push("/crm/users")} className="border-white/10"><ArrowLeft className="w-4 h-4 mr-2" />Quay lại</Button>
        </div>
    )

    const u = data.user

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/crm/users")}><ArrowLeft className="w-5 h-5" /></Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {u.displayName}
                        <Badge className="text-[10px]">{u.tier || "PRIORITY"}</Badge>
                    </h1>
                    <p className="text-slate-500 text-sm">{u.email} · ID: {u.id}</p>
                </div>
            </div>

            {/* Profile + Actions Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Profile Card */}
                <Card className="bg-slate-900/60 border-white/10 text-slate-100 md:col-span-2">
                    <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" />Hồ sơ</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Tên</span><span className="font-medium">{u.displayName}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Email</span><span className="font-medium">{u.email}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Số dư</span><span className="font-semibold text-white">{formatCurrency(u.mainBalance || 0)}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">PIN Hash</span><span className="font-mono text-xs text-slate-600 truncate block max-w-[200px]">{u.pinCode || "N/A"}</span></div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Trạng thái</span>
                            <Badge variant={u.isFrozen ? "destructive" : "success"}>{u.isFrozen ? "Bị khóa" : "Hoạt động"}</Badge>
                        </div>
                        <div><span className="text-slate-500 block text-xs uppercase tracking-wider">Ngày tạo</span><span className="text-xs">{u.createdAt ? formatDate(u.createdAt) : "N/A"}</span></div>
                    </CardContent>
                </Card>

                {/* Action Panel */}
                <Card className="bg-slate-900/60 border-white/10 text-slate-100">
                    <CardHeader><CardTitle className="text-sm">Hành động</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Button onClick={handleFreeze} disabled={processing} variant="outline" size="sm"
                            className={`w-full border-white/10 text-xs ${u.isFrozen ? "text-green-400" : "text-red-400"}`}>
                            {u.isFrozen ? <><CheckCircle className="w-3 h-3 mr-1" />Mở khóa</> : <><Snowflake className="w-3 h-3 mr-1" />Khóa tài khoản</>}
                        </Button>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Đổi Tier</label>
                            <Select value={u.tier || "PRIORITY"} onValueChange={handleTierChange} disabled={processing}>
                                <SelectTrigger className="w-full h-8 bg-white/5 border-white/10 text-white text-xs mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10">
                                    {ALL_TIERS.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleResetPin} disabled={processing} variant="outline" size="sm"
                            className="w-full border-white/10 text-xs text-amber-400">
                            <KeyRound className="w-3 h-3 mr-1" />Reset PIN
                        </Button>
                        {generatedPin && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-amber-900/30 border border-amber-800/50 text-amber-200 text-sm">
                                <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-1">PIN mới (hiển thị 1 lần)</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-lg font-bold">{generatedPin}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(generatedPin); toast({ title: "Đã copy" }) }}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        <hr className="border-white/10" />

                        {/* Edit Profile */}
                        <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (v) { setEditName(u.displayName || ""); setEditPhone(u.phone || "") } }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full border-white/10 text-xs text-blue-400">
                                    <Pencil className="w-3 h-3 mr-1" />Sửa hồ sơ
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm">
                                <DialogHeader><DialogTitle>Sửa hồ sơ</DialogTitle></DialogHeader>
                                <div className="space-y-3">
                                    <div><Label>Tên</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" /></div>
                                    <div><Label>SĐT</Label><Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="mt-1 bg-white/5 border-white/10 text-white" placeholder="0901234567" /></div>
                                    <Button onClick={handleEditProfile} disabled={processing} className="w-full bg-blue-600 hover:bg-blue-700">Lưu</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Reset Password */}
                        <Button onClick={handleResetPassword} disabled={processing} variant="outline" size="sm"
                            className="w-full border-white/10 text-xs text-rose-400">
                            <ShieldAlert className="w-3 h-3 mr-1" />Reset mật khẩu
                        </Button>
                        {generatedPwd && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-rose-900/30 border border-rose-800/50 text-rose-200 text-sm">
                                <p className="text-[10px] uppercase tracking-wider text-rose-400 mb-1">Mật khẩu mới (hiển thị 1 lần)</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold">{generatedPwd}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(generatedPwd); toast({ title: "Đã copy" }) }}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs: Cards & Transactions */}
            <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="cards" className="data-[state=active]:bg-white/10 text-xs gap-1"><CreditCard className="w-3 h-3" />Thẻ ({data.cards.length})</TabsTrigger>
                    <TabsTrigger value="transactions" className="data-[state=active]:bg-white/10 text-xs gap-1"><ArrowUpDown className="w-3 h-3" />Giao dịch ({data.transactions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="cards" className="mt-4">
                    {data.cards.length === 0 ? <p className="text-slate-500 text-sm py-8 text-center">Chưa có thẻ nào.</p> : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {data.cards.map((c: any) => (
                                <Card key={c.id} className="bg-slate-900/60 border-white/10 text-slate-100">
                                    <CardContent className="p-4 text-sm space-y-2">
                                        <p className="font-semibold">{c.cardDesign?.name || c.cardId}</p>
                                        <p className="font-mono text-xs text-slate-400">{c.cardNumber}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">{c.issuer}</span>
                                            <Badge variant={c.isFrozen ? "destructive" : "success"} className="text-[9px]">{c.isFrozen ? "Đóng băng" : "Active"}</Badge>
                                        </div>
                                        <Button
                                            variant="outline" size="sm"
                                            disabled={processing}
                                            onClick={async () => {
                                                setProcessing(true)
                                                try {
                                                    const { toggleCardFreezeAdmin } = await import("@/lib/actions/crm")
                                                    await toggleCardFreezeAdmin(c.id, !c.isFrozen)
                                                    const refreshed = await getUserDetail(id)
                                                    setData(refreshed)
                                                    toast({ title: c.isFrozen ? "Đã mở khóa thẻ" : "Đã khóa thẻ" })
                                                } catch (err: any) {
                                                    toast({ title: "Lỗi", description: err.message, variant: "destructive" })
                                                } finally { setProcessing(false) }
                                            }}
                                            className={`w-full text-[10px] border-white/10 mt-1 ${c.isFrozen ? "text-green-400" : "text-red-400"
                                                }`}
                                        >
                                            {c.isFrozen ? <><Unlock className="w-3 h-3 mr-1" />Admin Mở khóa</> : <><Lock className="w-3 h-3 mr-1" />Admin Khóa thẻ</>}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="transactions" className="mt-4">
                    <div className="glass rounded-xl border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-slate-400 text-xs">Loại</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Danh mục</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Số tiền</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Phí</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Trạng thái</TableHead>
                                    <TableHead className="text-slate-400 text-xs">Thời gian</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.transactions.length === 0 && (
                                    <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">Chưa có giao dịch.</TableCell></TableRow>
                                )}
                                {data.transactions.map((tx: any) => (
                                    <TableRow key={tx.id || tx.transactionId} className="border-white/5 hover:bg-white/5">
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px]">{tx.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[10px] text-slate-400">{getCategoryLabel(tx.category)}</span>
                                        </TableCell>
                                        <TableCell className={`font-semibold text-sm ${tx.senderId === id ? "text-red-400" : "text-green-400"}`}>
                                            {tx.senderId === id ? "-" : "+"}{formatCurrency(tx.amount || 0)}
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">{formatCurrency(tx.fee || 0)}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.status === "COMPLETED" ? "success" : tx.status === "FAILED" ? "destructive" : "secondary"} className="text-[9px]">
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
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
