"use client"
import { useEffect, useState } from "react"
import { getAllTransactions } from "@/lib/actions/crm"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react"

const FRAUD_THRESHOLD = 50_000_000  // 50 million VND

export default function FraudRadarPage() {
  const [suspicious, setSuspicious] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllTransactions(200).then(txs => {
      // Flag: amount > threshold, or 3+ txs same sender within short time
      const flagged = txs.filter(tx => {
        if (tx.amount >= FRAUD_THRESHOLD) return true
        return false
      })
      // Also detect rapid repeat senders
      const senderCount: Record<string, number> = {}
      txs.forEach(tx => { senderCount[tx.senderId] = (senderCount[tx.senderId] || 0) + 1 })
      const rapidSenders = new Set(Object.entries(senderCount).filter(([, c]) => c >= 5).map(([id]) => id))
      const withRapid = txs.filter(tx => rapidSenders.has(tx.senderId) && !flagged.find(f => f.transactionId === tx.transactionId))
      setSuspicious([...flagged.map(t => ({ ...t, reason: "Số tiền bất thường" })), ...withRapid.slice(0, 10).map(t => ({ ...t, reason: "Giao dịch lặp lại" }))])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Fraud Radar</h1>
          <p className="text-slate-400 mt-1">{suspicious.length} giao dịch đáng ngờ được phát hiện</p>
        </div>
      </div>

      {suspicious.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Không phát hiện hoạt động bất thường</p>
        </div>
      ) : (
        <div className="glass rounded-xl border border-red-500/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-red-500/20 hover:bg-transparent">
                <TableHead className="text-slate-400">ID Giao dịch</TableHead>
                <TableHead className="text-slate-400">Loại</TableHead>
                <TableHead className="text-slate-400">Số tiền</TableHead>
                <TableHead className="text-slate-400">Thời gian</TableHead>
                <TableHead className="text-slate-400">Lý do đánh dấu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suspicious.map(tx => (
                <TableRow key={tx.transactionId} className="border-red-500/10 hover:bg-red-500/5">
                  <TableCell className="font-mono text-xs text-slate-400">{tx.transactionId?.slice(0,12)}...</TableCell>
                  <TableCell><Badge variant="secondary">{tx.type}</Badge></TableCell>
                  <TableCell className="font-bold text-red-400">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell className="text-xs text-slate-500">{tx.timestamp ? formatDate(tx.timestamp) : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertTriangle className="w-4 h-4" />{tx.reason}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
