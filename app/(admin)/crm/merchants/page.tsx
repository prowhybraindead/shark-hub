"use client"
import { useEffect, useState } from "react"
import { getAllMerchants, freezeMerchant, updateMerchantPlan, updateMerchantTier } from "@/lib/actions/crm"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2, Search, Snowflake, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

const PLANS = ["FREE", "PRO", "ENTERPRISE"] as const
const PLAN_COLORS: Record<string, string> = { FREE: "secondary", PRO: "default", ENTERPRISE: "success" }
const MERCHANT_TIERS = ["BUSINESS", "PREMIUM_BUSINESS"] as const

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    getAllMerchants().then(m => { setMerchants(m); setFiltered(m); setLoading(false) })
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(merchants.filter(m => m.email?.toLowerCase().includes(q) || m.businessName?.toLowerCase().includes(q)))
  }, [query, merchants])

  async function handleFreeze(id: string, freeze: boolean) {
    setProcessing(id)
    try {
      await freezeMerchant(id, freeze)
      setMerchants(prev => prev.map(m => m.id === id ? { ...m, isFrozen: freeze } : m))
      toast({ title: freeze ? "Đã đình chỉ merchant" : "Đã kích hoạt merchant" })
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setProcessing(null) }
  }

  async function handlePlanChange(id: string, plan: "FREE" | "PRO" | "ENTERPRISE") {
    setProcessing(id + plan)
    try {
      await updateMerchantPlan(id, plan)
      setMerchants(prev => prev.map(m => m.id === id ? { ...m, currentPlan: plan } : m))
      toast({ title: `Đã chuyển lên gói ${plan}` })
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setProcessing(null) }
  }

  async function handleTierChange(id: string, tier: string) {
    setProcessing(id + "tier")
    try {
      await updateMerchantTier(id, tier)
      setMerchants(prev => prev.map(m => m.id === id ? { ...m, tier } : m))
      toast({ title: `Đã cập nhật tier thành ${tier}` })
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setProcessing(null) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM – Merchants</h1>
        <p className="text-slate-400 mt-1">{merchants.length} doanh nghiệp trong hệ thống</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
        <Input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Tìm theo email, tên doanh nghiệp..." className="pl-10 bg-white/5 border-white/10 text-white" />
      </div>
      <div className="glass rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-slate-400">Doanh nghiệp</TableHead>
              <TableHead className="text-slate-400">Số dư</TableHead>
              <TableHead className="text-slate-400">Gói</TableHead>
              <TableHead className="text-slate-400">Hạng</TableHead>
              <TableHead className="text-slate-400">Trạng thái</TableHead>
              <TableHead className="text-slate-400">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(m => (
              <TableRow key={m.id} className="border-white/5 hover:bg-white/5">
                <TableCell>
                  <p className="font-medium text-blue-400 cursor-pointer hover:underline"
                    onClick={() => window.location.href = `/crm/merchants/${m.id}`}>{m.businessName}</p>
                  <p className="text-xs text-slate-500">{m.email} · {m.sector}</p>
                </TableCell>
                <TableCell className="font-semibold">{formatCurrency(m.balance || 0)}</TableCell>
                <TableCell>
                  <Select value={m.currentPlan} onValueChange={v => handlePlanChange(m.id, v as any)}
                    disabled={processing === m.id + m.currentPlan}>
                    <SelectTrigger className="w-32 h-8 bg-white/5 border-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {PLANS.map(p => <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={m.tier || "BUSINESS"} onValueChange={v => handleTierChange(m.id, v)}
                    disabled={processing === m.id + "tier"}>
                    <SelectTrigger className="w-40 h-8 bg-white/5 border-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {MERCHANT_TIERS.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={m.isFrozen ? "destructive" : "success"}>
                    {m.isFrozen ? "Đình chỉ" : "Hoạt động"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" disabled={processing === m.id}
                    onClick={() => handleFreeze(m.id, !m.isFrozen)}
                    className={`border-white/10 text-xs ${m.isFrozen ? "text-green-400" : "text-red-400"}`}>
                    {processing === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                      m.isFrozen ? <><CheckCircle className="w-3 h-3 mr-1" />Kích hoạt</> : <><Snowflake className="w-3 h-3 mr-1" />Đình chỉ</>}
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
