"use client"
import { useEffect, useState } from "react"
import { getAllTransactions, refundTransaction } from "@/lib/actions/crm"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Loader2, Search, RotateCcw, AlertTriangle } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"

export default function LedgerPage() {
  const [txs, setTxs] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<any>(null)

  useEffect(() => {
    getAllTransactions().then(t => { setTxs(t); setFiltered(t); setLoading(false) })
  }, [])

  useEffect(() => {
    const q = query.toLowerCase()
    setFiltered(txs.filter(t => t.transactionId?.toLowerCase().includes(q) || t.type?.includes(q) ||
      t.senderEmail?.toLowerCase().includes(q) || t.receiverEmail?.toLowerCase().includes(q)))
  }, [query, txs])

  async function handleRefund() {
    if (!confirm) return
    setProcessing(confirm.transactionId)
    setConfirm(null)
    try {
      await refundTransaction(confirm.transactionId)
      setTxs(prev => prev.map(t => t.transactionId === confirm.transactionId ? { ...t, refundedByAdmin: true } : t))
      toast({ title: "Hoàn tiền thành công!", description: "Giao dịch đã được đảo ngược." })
    } catch (err: any) {
      toast({ title: "Hoàn tiền thất bại", description: err.message, variant: "destructive" })
    } finally { setProcessing(null) }
  }

  const TYPE_BADGE: Record<string, string> = { P2P: "default", PAYMENT: "secondary", DEPOSIT: "success", REFUND_TICKET: "warning" }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Global Ledger</h1>
        <p className="text-slate-400 mt-1">Bảng ghi giao dịch bất biến toàn hệ thống. Refund = Titanium Protocol.</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
        <Input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Tìm theo ID, email, loại..." className="pl-10 bg-white/5 border-white/10 text-white" />
      </div>
      <div className="glass rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-slate-400">ID</TableHead>
              <TableHead className="text-slate-400">Loại</TableHead>
              <TableHead className="text-slate-400">Số tiền</TableHead>
              <TableHead className="text-slate-400">Phí</TableHead>
              <TableHead className="text-slate-400">Thời gian</TableHead>
              <TableHead className="text-slate-400">Trạng thái</TableHead>
              <TableHead className="text-slate-400">Refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(tx => (
              <TableRow key={tx.transactionId} className="border-white/5 hover:bg-white/5">
                <TableCell className="font-mono text-xs text-slate-400">{tx.transactionId?.slice(0,12)}...</TableCell>
                <TableCell><Badge variant={(TYPE_BADGE[tx.type] as any) || "outline"}>{tx.type}</Badge></TableCell>
                <TableCell className="font-semibold">{formatCurrency(tx.amount)}</TableCell>
                <TableCell className="text-emerald-400 text-xs">{formatCurrency(tx.fee || 0)}</TableCell>
                <TableCell className="text-xs text-slate-500">{tx.timestamp ? formatDate(tx.timestamp) : "—"}</TableCell>
                <TableCell>
                  {tx.refundedByAdmin
                    ? <Badge variant="warning">Đã hoàn</Badge>
                    : <Badge variant="success">Hoàn tất</Badge>}
                </TableCell>
                <TableCell>
                  {!tx.refundedByAdmin && tx.type !== "REFUND_TICKET" && (
                    <Button size="sm" variant="outline"
                      disabled={processing === tx.transactionId}
                      onClick={() => setConfirm(tx)}
                      className="border-orange-500/30 text-orange-400 hover:text-orange-300 text-xs">
                      {processing === tx.transactionId ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RotateCcw className="w-3 h-3 mr-1" />Hoàn tiền</>}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirm} onOpenChange={o => !o && setConfirm(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-5 h-5" />Xác nhận Titanium Refund
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Đây là hành động không thể đảo ngược. Hệ thống sẽ tự động đảo ngược giao dịch và hoàn phí.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">ID</span><span className="font-mono text-xs">{confirm?.transactionId?.slice(0,16)}...</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Số tiền</span><span className="font-semibold">{formatCurrency(confirm?.amount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Loại</span><span>{confirm?.type}</span></div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setConfirm(null)} variant="outline" className="flex-1 border-white/10">Hủy</Button>
            <Button onClick={handleRefund} className="flex-1 bg-orange-600 hover:bg-orange-700">
              Xác nhận Hoàn tiền
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
