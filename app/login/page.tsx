"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { adminLogin } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2, ShieldCheck, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await result.user.getIdToken()
      const res = await adminLogin(idToken)
      if (res.error === "access_denied") {
        toast({ title: "Truy cập bị từ chối", description: "Tài khoản này không có quyền truy cập SharkHub.", variant: "destructive" })
        return
      }
      router.push(res.redirect)
    } catch (err: any) {
      toast({ title: "Lỗi đăng nhập", description: "Email hoặc mật khẩu quản trị viên không hợp lệ.", variant: "destructive" })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4 relative">
            <ShieldCheck className="w-10 h-10 text-purple-400" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            SharkHub
          </h1>
          <p className="text-slate-400 mt-2 text-sm">The Pentagon — Restricted Access</p>
        </div>

        <div className="glass rounded-2xl p-8 space-y-5">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-xs">
            ⚠️ Chỉ dành cho nhân viên Shark Fintech Inc. được cấp quyền.
          </div>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="email" className="text-slate-300">Email Quản trị viên</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  placeholder="admin@sharkfintech.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-300">Mật khẩu</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  placeholder="••••••••" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 h-12 font-semibold">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác thực & Đăng nhập
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
