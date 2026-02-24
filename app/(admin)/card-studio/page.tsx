"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getAllCardTemplates, createCardTemplate, publishCardTemplate } from "@/lib/actions/crm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { Plus, Eye, EyeOff, Loader2, CreditCard, CheckCircle, Upload } from "lucide-react"
import { VirtualCardLogo, BankLogo } from "@/components/VirtualCardLogo"

const PRESETS = [
  { name: "Ocean Blue", value: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #0ea5e9 100%)", theme: "LIGHT" },
  { name: "Emerald Night", value: "linear-gradient(135deg, #052e16 0%, #065f46 50%, #10b981 100%)", theme: "LIGHT" },
  { name: "Purple Storm", value: "linear-gradient(135deg, #3b0764 0%, #7c3aed 50%, #a78bfa 100%)", theme: "LIGHT" },
  { name: "Sunset Gold", value: "linear-gradient(135deg, #78350f 0%, #d97706 50%, #fbbf24 100%)", theme: "DARK" },
  { name: "Rose Quartz", value: "linear-gradient(135deg, #881337 0%, #e11d48 50%, #fb7185 100%)", theme: "LIGHT" },
  { name: "Midnight", value: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)", theme: "LIGHT" },
]

export default function CardStudioPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [issuer, setIssuer] = useState("VISA")
  const [bgType, setBgType] = useState<"GRADIENT" | "IMAGE">("GRADIENT")
  const [bgValue, setBgValue] = useState(PRESETS[0].value)
  const [textTheme, setTextTheme] = useState<"LIGHT" | "DARK">("LIGHT")
  const [customGradient, setCustomGradient] = useState("")
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { console.log("❌ No file selected"); return }
    console.log("🚀 Starting upload for file:", file.name, "Size:", file.size, "Type:", file.type)

    if (!file.type.startsWith("image/")) {
      console.log("❌ Not an image file:", file.type)
      toast({ title: "File không hợp lệ", description: "Chỉ chấp nhận file ảnh.", variant: "destructive" })
      return
    }

    // Validate resolution & aspect ratio
    const img = new Image()
    img.src = URL.createObjectURL(file)
    await new Promise<void>((resolve) => { img.onload = () => resolve() })
    console.log("📐 Image dimensions:", img.width, "x", img.height)

    if (img.width < 1000 || img.height < 630) {
      console.log("❌ Resolution too low:", img.width, "x", img.height)
      toast({ title: "Độ phân giải quá thấp", description: `Tối thiểu 1000x630px. Ảnh của bạn: ${img.width}x${img.height}px`, variant: "destructive" })
      return
    }
    const ratio = img.width / img.height
    console.log("📐 Aspect ratio:", ratio.toFixed(3))
    if (ratio < 1.5 || ratio > 1.65) {
      console.log("❌ Aspect ratio invalid:", ratio.toFixed(3))
      toast({ title: "Tỉ lệ không hợp lệ", description: `Yêu cầu ~1.586:1 (1.5–1.65). Hiện tại: ${ratio.toFixed(3)}`, variant: "destructive" })
      return
    }

    setUploading(true)
    const cloudName = "dtnqish40"
    const uploadPreset = "shark-fintech"
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)

    try {
      console.log("📡 Sending request to Cloudinary...")
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      console.log("📦 Cloudinary Response Status:", response.status, "Data:", data)

      if (response.ok && data.secure_url) {
        console.log("✅ UPLOAD SUCCESS! URL:", data.secure_url)
        setBgType("IMAGE")
        setBgValue(data.secure_url)
        setCustomGradient("")
        toast({ title: "Tải ảnh lên Cloudinary thành công!" })
      } else {
        console.error("❌ Cloudinary Error Detail:", data.error?.message || "Unknown error")
        toast({ title: "Lỗi upload", description: data.error?.message || "Không thể upload", variant: "destructive" })
      }
    } catch (error: any) {
      console.error("🔥 Network/System Error:", error)
      toast({ title: "Lỗi kết nối", description: error.message, variant: "destructive" })
    } finally {
      setUploading(false)
      console.log("🏁 Upload process finished.")
    }
  }

  useEffect(() => {
    getAllCardTemplates().then(t => { setTemplates(t); setLoading(false) })
  }, [])

  async function handleCreate() {
    if (!name.trim()) { toast({ title: "Nhập tên thẻ", variant: "destructive" }); return }
    setCreating(true)
    try {
      await createCardTemplate({ name, issuer, backgroundType: bgType, backgroundValue: customGradient || bgValue, textTheme })
      const updated = await getAllCardTemplates()
      setTemplates(updated)
      setOpen(false)
      setName(""); setCustomGradient("")
      toast({ title: "Tạo template thành công!" })
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setCreating(false) }
  }

  async function handlePublish(id: string, publish: boolean) {
    setPublishing(id)
    try {
      await publishCardTemplate(id, publish)
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: publish ? "PUBLISHED" : "DRAFT" } : t))
      toast({ title: publish ? "Đã publish!" : "Đã chuyển về Draft" })
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" })
    } finally { setPublishing(null) }
  }

  const preview = customGradient || bgValue

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Card Studio</h1>
          <p className="text-slate-400 mt-1">Thiết kế và quản lý mẫu thẻ cho StareWallet</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-2" />Tạo mẫu thẻ mới</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
            <DialogHeader><DialogTitle>Card Studio – Tạo mẫu thẻ</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              {/* Preview */}
              <div className="space-y-3">
                <p className="text-sm text-slate-400 font-medium">Preview</p>
                <div className="rounded-2xl h-40 overflow-hidden relative"
                  style={{ background: preview }}>
                  <div className={`absolute inset-0 p-4 flex flex-col justify-between ${textTheme === "LIGHT" ? "text-white" : "text-slate-900"}`}>
                    <div className="flex justify-between items-start">
                      <BankLogo textTheme={textTheme as "LIGHT" | "DARK"} />
                      <VirtualCardLogo issuer={issuer} textTheme={textTheme as "LIGHT" | "DARK"} />
                    </div>
                    <div>
                      <p className="font-mono text-sm opacity-70">**** **** **** 1234</p>
                      <p className="text-sm font-semibold mt-1">{name || "Card Name"}</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Form */}
              <div className="space-y-3">
                <div><Label>Tên thẻ</Label>
                  <Input value={name} onChange={e => setName(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white" placeholder="Premium Blue" /></div>
                <div><Label>Issuer</Label>
                  <Select value={issuer} onValueChange={setIssuer}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select Issuer" /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="VISA" className="text-white">Visa</SelectItem>
                      <SelectItem value="MASTERCARD" className="text-white">Mastercard</SelectItem>
                      <SelectItem value="DISCOVER" className="text-white">Discover</SelectItem>
                      <SelectItem value="JCB" className="text-white">JCB</SelectItem>
                      <SelectItem value="UNIONPAY" className="text-white">UnionPay</SelectItem>
                      <SelectItem value="AMEX" className="text-white">Amex</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div><Label>Text Theme</Label>
                  <Select value={textTheme} onValueChange={v => setTextTheme(v as any)}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="LIGHT" className="text-white">Light (Chữ trắng)</SelectItem>
                      <SelectItem value="DARK" className="text-white">Dark (Chữ đen)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Gradient Presets */}
            <div>
              <p className="text-sm text-slate-400 mb-2">Gradient Presets</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => { setBgValue(p.value); setTextTheme(p.theme as any); setCustomGradient("") }}
                    className={`h-10 rounded-lg text-xs font-medium transition-all ${bgValue === p.value && !customGradient ? "ring-2 ring-white" : ""}`}
                    style={{ background: p.value, color: p.theme === "LIGHT" ? "white" : "#1e293b" }}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div><Label>Custom CSS Gradient (tùy chọn)</Label>
              <Input value={customGradient} onChange={e => setCustomGradient(e.target.value)}
                className="mt-1 bg-white/5 border-white/10 text-white font-mono text-xs"
                placeholder="linear-gradient(135deg, #ff0000, #0000ff)" /></div>

            <div><Label>Hoặc tải ảnh nền tùy chỉnh (tối thiểu 1000×630px, tỉ lệ ~1.586:1)</Label>
              <div className="mt-1 flex items-center gap-2">
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg glass border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Đang tải..." : "Chọn ảnh"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                {bgType === "IMAGE" && <span className="text-green-400 text-xs">✓ Đã chọn ảnh</span>}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={creating} className="w-full bg-purple-600 hover:bg-purple-700">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Tạo Template
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ rotateX: -3, rotateY: 5, scale: 1.02, transition: { duration: 0.2 } }}
              style={{ perspective: 800, transformStyle: "preserve-3d" }}
              className="glass rounded-2xl overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:shadow-purple-500/10 hover:border-white/20 transition-shadow">
              <div className="h-32 relative" style={{ background: t.backgroundType === "IMAGE" ? `url(${t.backgroundValue}) center/cover` : t.backgroundValue }}>
                <div className={`absolute inset-0 p-4 flex flex-col justify-between ${t.textTheme === "LIGHT" ? "text-white" : "text-slate-900"}`}>
                  <div className="flex justify-between items-start">
                    <BankLogo textTheme={t.textTheme} />
                    <VirtualCardLogo issuer={t.issuer} textTheme={t.textTheme} />
                  </div>
                  <p className="text-sm font-semibold">{t.name}</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <Badge variant={t.status === "PUBLISHED" ? "success" : "secondary"}>
                  {t.status === "PUBLISHED" ? "Published" : "Draft"}
                </Badge>
                <Button size="sm" variant="outline"
                  disabled={publishing === t.id}
                  onClick={() => handlePublish(t.id, t.status !== "PUBLISHED")}
                  className={`border-white/10 text-xs ${t.status === "PUBLISHED" ? "text-red-400" : "text-green-400"}`}>
                  {publishing === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                    t.status === "PUBLISHED" ? <><EyeOff className="w-3 h-3 mr-1" />Unpublish</> : <><Eye className="w-3 h-3 mr-1" />Publish</>}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
