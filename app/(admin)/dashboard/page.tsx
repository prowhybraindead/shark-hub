"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getGlobalStats } from "@/lib/actions/crm"
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Users, Building2, DollarSign, TrendingUp, Loader2 } from "lucide-react"

export default function HubDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGlobalStats().then(s => { setStats(s); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>

  const chartData = (() => {
    const map = new Map<string, number>()
    ;(stats?.recentTxs || []).forEach((tx: any) => {
      const d = tx.timestamp?.toDate?.() ? tx.timestamp.toDate() : new Date()
      const key = `${d.getMonth()+1}/${d.getDate()}`
      map.set(key, (map.get(key) || 0) + tx.amount)
    })
    return Array.from(map.entries()).slice(-7).map(([date, volume]) => ({ date, volume }))
  })()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Global Dashboard</h1>
        <p className="text-slate-400 mt-1">Tổng quan toàn hệ sinh thái Shark Fintech</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Tổng Users", value: formatNumber(stats?.totalUsers || 0), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
          { title: "Tổng Merchants", value: formatNumber(stats?.totalMerchants || 0), icon: Building2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { title: "Tổng Volume", value: formatCurrency(stats?.totalVolume || 0), icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-500/10" },
          { title: "Doanh thu Platform", value: formatCurrency(stats?.totalFees || 0), icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-slate-900/50 border-white/10 text-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{s.title}</p>
                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-slate-900/50 border-white/10 text-white">
        <CardHeader><CardTitle className="text-white">Cashflow (7 ngày gần đây)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} tickFormatter={v => `${(v/1_000_000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                formatter={(v: any) => [formatCurrency(v), "Volume"]} />
              <Area type="monotone" dataKey="volume" stroke="#a855f7" fill="url(#colorVol)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-white/10 text-white">
        <CardHeader><CardTitle className="text-white">Giao dịch gần nhất</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(stats?.recentTxs || []).slice(0, 10).map((tx: any) => (
              <div key={tx.transactionId} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm font-medium">{tx.type} — {tx.transactionId?.slice(0, 8)}...</p>
                  <p className="text-xs text-slate-500">{tx.timestamp ? formatDate(tx.timestamp) : "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{formatCurrency(tx.amount)}</p>
                  <p className="text-xs text-emerald-400">+{formatCurrency(tx.fee)} fee</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
