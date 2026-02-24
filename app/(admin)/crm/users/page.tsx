"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getAllUsers, freezeUser, updateUserTier, provisionBusinessWallet } from "@/lib/actions/crm"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Loader2, Search, Snowflake, CheckCircle, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const USER_TIERS = ["PRIORITY", "SILVER", "GOLD", "DIAMOND", "RUBY", "BUSINESS", "PREMIUM_BUSINESS"] as const
const TIER_COLORS: Record<string, string> = {
  PRIORITY: "secondary", SILVER: "outline", GOLD: "default", DIAMOND: "default", RUBY: "destructive",
  BUSINESS: "default", PREMIUM_BUSINESS: "success",
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  // Provisioning form state
  const [provOpen, setProvOpen] = useState(false)
  const [provLoading, setProvLoading] = useState(false)
  const [provEmail, setProvEmail] = useState("")
  const [provName, setProvName] = useState("")
  const [provPin, setProvPin] = useState("")
  const [provTier, setProvTier] = useState<"BUSINESS" | "PREMIUM_BUSINESS">("BUSINESS")

  useEffect(() => {
    getAllUsers().then(u => { setUsers(u); setFiltered(u); setLoading(false) })
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(users.filter(u => u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q)))
  }, [query, users])

  async function handleFreeze(userId: string, freeze: boolean) {
    setProcessing(userId)
    try {
      await freezeUser(userId, freeze)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isFrozen: freeze } : u))
      toast({ title: freeze ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản" })
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setProcessing(null) }
  }

  async function handleTierChange(userId: string, tier: string) {
    setProcessing(userId + "tier")
    try {
      await updateUserTier(userId, tier)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier } : u))
      toast({ title: `Đã cập nhật tier thành ${tier}` })
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setProcessing(null) }
  }

  async function handleProvision() {
    if (!provEmail.trim() || !provName.trim() || provPin.length < 4) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền đầy đủ (PIN tối thiểu 4 ký tự).", variant: "destructive" })
      return
    }
    setProvLoading(true)
    try {
      await provisionBusinessWallet({ email: provEmail.trim(), displayName: provName.trim(), pinCode: provPin, tier: provTier })
      toast({ title: "Tạo Business Wallet thành công!" })
      setProvOpen(false)
      setProvEmail(""); setProvName(""); setProvPin("")
      // Refresh list
      const updated = await getAllUsers()
      setUsers(updated); setFiltered(updated)
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setProvLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM – Users</h1>
          <p className="text-slate-400 mt-1">{users.length} người dùng trong hệ thống</p>
        </div>
        <Dialog open={provOpen} onOpenChange={setProvOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" />Tạo Business Wallet</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
            <DialogHeader><DialogTitle>Tạo tài khoản Business Wallet</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Email</Label>
                <Input value={provEmail} onChange={e => setProvEmail(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white" placeholder="client@company.com" /></div>
              <div><Label>Tên hiển thị</Label>
                <Input value={provName} onChange={e => setProvName(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Công ty ABC" /></div>
              <div><Label>Mã PIN (tối thiểu 4 ký tự)</Label>
                <Input type="password" value={provPin} onChange={e => setProvPin(e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white" placeholder="••••••" maxLength={6} /></div>
              <div><Label>Tier</Label>
                <Select value={provTier} onValueChange={v => setProvTier(v as any)}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="BUSINESS" className="text-white">BUSINESS</SelectItem>
                    <SelectItem value="PREMIUM_BUSINESS" className="text-white">PREMIUM_BUSINESS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleProvision} disabled={provLoading} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {provLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Tạo Business Wallet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
        <Input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Tìm theo email, tên..." className="pl-10 bg-white/5 border-white/10 text-white" />
      </div>
      <div className="glass rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-slate-400">Người dùng</TableHead>
              <TableHead className="text-slate-400">Số dư</TableHead>
              <TableHead className="text-slate-400">Trạng thái</TableHead>
              <TableHead className="text-slate-400">Hạng</TableHead>
              <TableHead className="text-slate-400">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(user => (
              <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                <TableCell>
                  <p className="font-medium text-blue-400 cursor-pointer hover:underline"
                    onClick={() => router.push(`/crm/users/${user.id}`)}>{user.displayName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </TableCell>
                <TableCell className="font-semibold">{formatCurrency(user.mainBalance || 0)}</TableCell>
                <TableCell>
                  <Badge variant={user.isFrozen ? "destructive" : "success"}>
                    {user.isFrozen ? "Bị khóa" : "Hoạt động"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select value={user.tier || "PRIORITY"} onValueChange={v => handleTierChange(user.id, v)}
                    disabled={processing === user.id + "tier"}>
                    <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {USER_TIERS.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline"
                    disabled={processing === user.id}
                    onClick={() => handleFreeze(user.id, !user.isFrozen)}
                    className={`border-white/10 text-xs ${user.isFrozen ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300"}`}>
                    {processing === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                      user.isFrozen ? <><CheckCircle className="w-3 h-3 mr-1" />Mở khóa</> : <><Snowflake className="w-3 h-3 mr-1" />Khóa</>}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
