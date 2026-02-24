import { redirect } from "next/navigation"
import { getAdminUser } from "@/lib/actions/auth"
import { Sidebar } from "@/components/Sidebar"
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser()
  if (!admin) redirect("/login")
  return (
    <div className="flex">
      <Sidebar admin={admin} />
      <main className="flex-1 ml-64 min-h-screen p-8">{children}</main>
    </div>
  )
}
