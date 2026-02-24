"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { Loader2, Bell, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export default function AdminNotificationsPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, "admin_notifications"), orderBy("createdAt", "desc"))
        const unsub = onSnapshot(q, (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() })))
            setLoading(false)
        }, (error) => {
            console.error("🔥 Firebase Snapshot Error (admin_notifications):", error)
            setLoading(false)
        })
        return () => unsub()
    }, [])

    async function handleClick(n: any) {
        if (!n.read) await updateDoc(n.ref, { read: true })
        if (n.type === "INVOICE_PAID" && n.invoiceId) {
            // Navigate back to the merchant's invoice list (no direct route, just mark read)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-purple-400" />
                <h1 className="text-2xl font-bold">Admin Notifications</h1>
                <Badge variant="outline" className="text-xs">{notifications.filter(n => !n.read).length} mới</Badge>
            </div>
            {notifications.length === 0 && <p className="text-slate-500 text-sm py-8 text-center">Không có thông báo.</p>}
            <div className="space-y-3">
                {notifications.map((n, i) => (
                    <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <Card className={`border-white/10 cursor-pointer transition-all hover:bg-white/5 ${n.read ? "bg-slate-900/40" : "bg-slate-900/80 border-purple-500/30"}`}
                            onClick={() => handleClick(n)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-100">{n.message}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-[9px]">{n.type}</Badge>
                                        {!n.read && <Badge className="text-[9px] bg-purple-600">Mới</Badge>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
