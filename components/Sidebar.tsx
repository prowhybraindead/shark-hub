"use client"
import { useRouter, usePathname } from "next/navigation"
import { logout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Building2, Receipt, CreditCard, AlertTriangle, LogOut, ShieldCheck, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "CRM – Users", href: "/crm/users" },
  { icon: Building2, label: "CRM – Merchants", href: "/crm/merchants" },
  { icon: Receipt, label: "Global Ledger", href: "/ledger" },
  { icon: AlertTriangle, label: "Fraud Radar", href: "/fraud" },
  { icon: CreditCard, label: "Card Studio", href: "/card-studio" },
  { icon: Bell, label: "Thông báo", href: "/notifications" },
]

export function Sidebar({ admin }: { admin: any }) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-full w-64 glass border-r border-white/10 flex flex-col z-30">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="font-bold text-sm">SharkHub</p>
            <p className="text-xs text-slate-500">The Pentagon</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">
            {admin?.role || "ADMIN"}
          </span>
          <span className="text-xs text-slate-600 truncate">{admin?.email}</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(item => (
          <button key={item.href} onClick={() => router.push(item.href)}
            className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              pathname.startsWith(item.href)
                ? "bg-purple-500/20 text-purple-400 font-medium"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}>
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <form action={logout}>
          <Button type="submit" variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-400 gap-3">
            <LogOut className="w-4 h-4" />Đăng xuất
          </Button>
        </form>
      </div>
    </aside>
  )
}
