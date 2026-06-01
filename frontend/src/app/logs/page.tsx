"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, LayoutDashboard, Server, Bug, Wrench, Clock, Bell, LogOut, Download, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import api from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard" },
  { icon: Server,          label: "Endpoints",       href: "/endpoints" },
  { icon: Bug,             label: "Vulnerabilities", href: "/vulnerabilities" },
  { icon: Wrench,          label: "Patches",         href: "/patches" },
  { icon: Clock,           label: "Logs",            href: "/logs" },
  { icon: Bell,            label: "Alerts",          href: "/alerts" },
]

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  success:     { color: "#00C853", bg: "rgba(0,200,83,0.15)",  icon: CheckCircle,   label: "Success" },
  failed:      { color: "#FF3B3B", bg: "rgba(255,59,59,0.15)", icon: XCircle,       label: "Failed" },
  rolled_back: { color: "#FFD700", bg: "rgba(255,215,0,0.15)", icon: AlertTriangle, label: "Rolled Back" },
}

export default function LogsPage() {
  const router = useRouter()
  const [filter,    setFilter]    = useState("all")
  const [logs,      setLogs]      = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ""))
    fetchLogs()
    fetchUnread()
  }, [])

  const fetchUnread = async () => {
    try {
      const res = await api.get("/api/alerts")
      setUnreadCount((res.data.data || []).filter((a: any) => !a.is_read).length)
    } catch {}
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/logs?limit=100")
      setLogs(res.data.data || [])
    } catch {
      toast.error("Failed to load logs")
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const headers = ["ID","Endpoint","CVE ID","Action","Status","Triggered By","Date"]
    const rows = logs.map(l => [
      l.id,
      l.endpoints?.name || l.endpoint_id,
      l.cve_id,
      l.action,
      l.status,
      l.triggered_by || "admin",
      new Date(l.deployed_at || l.created_at).toLocaleString(),
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `patchguard-logs-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported!")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const filtered = filter === "all" ? logs : logs.filter(l => l.status === filter)

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0D1117", color:"#E6EDF3", fontFamily:"Inter,system-ui,sans-serif" }}>
      <aside style={{ width:240, background:"#161B22", borderRight:"1px solid #30363D", display:"flex", flexDirection:"column", padding:"24px 0", flexShrink:0, position:"fixed", height:"100vh" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 20px 24px", borderBottom:"1px solid #30363D" }}>
          <Shield size={28} color="#238636" />
          <span style={{ fontSize:18, fontWeight:700 }}>PatchGuard</span>
        </div>
        <nav style={{ marginTop:16, flex:1 }}>
          {navItems.map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href} style={{ textDecoration:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", margin:"2px 8px", borderRadius:6, cursor:"pointer", background:label==="Logs"?"rgba(35,134,54,0.15)":"transparent", color:label==="Logs"?"#2EA043":"#8B949E", fontWeight:label==="Logs"?600:400, fontSize:14 }}>
                <Icon size={18} />
                {label}
                {label==="Alerts" && unreadCount > 0 && <span style={{ marginLeft:"auto", background:"#FF3B3B", color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700 }}>{unreadCount}</span>}
              </div>
            </Link>
          ))}
        </nav>
        <div style={{ padding:"16px 20px", borderTop:"1px solid #30363D" }}>
          <div style={{ fontSize:12, color:"#8B949E", marginBottom:8 }}>{userEmail}</div>
          <button onClick={handleLogout} style={{ display:"flex", alignItems:"center", gap:8, color:"#8B949E", background:"none", border:"none", cursor:"pointer", fontSize:14 }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main style={{ flex:1, marginLeft:240, padding:32 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Patch Logs</h1>
            <p style={{ color:"#8B949E", marginTop:4, fontSize:14 }}>Full audit trail of all patch actions</p>
          </div>
          <button onClick={handleExportCSV} style={{ display:"flex", alignItems:"center", gap:8, background:"transparent", color:"#E6EDF3", border:"1px solid #30363D", borderRadius:6, padding:"10px 18px", fontSize:14, cursor:"pointer" }}>
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          {["all","success","failed","rolled_back"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:"8px 16px", borderRadius:6, border:"1px solid", borderColor:filter===f?"#238636":"#30363D", background:filter===f?"rgba(35,134,54,0.15)":"transparent", color:filter===f?"#2EA043":"#8B949E", fontSize:13, cursor:"pointer", fontWeight:filter===f?600:400, textTransform:"capitalize" }}>
              {f.replace("_"," ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color:"#8B949E", padding:40, textAlign:"center" }}>Loading logs...</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {filtered.length === 0 ? (
              <div style={{ color:"#8B949E", padding:40, textAlign:"center" }}>No logs found</div>
            ) : filtered.map((l) => {
              const cfg  = statusConfig[l.status] || statusConfig.failed
              const Icon = cfg.icon
              return (
                <div key={l.id} style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, padding:20, display:"flex", alignItems:"center", gap:20 }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:cfg.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon size={20} color={cfg.color} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                      <span style={{ fontSize:14, fontWeight:700, fontFamily:"monospace", color:"#58A6FF" }}>{l.cve_id}</span>
                      <span style={{ fontSize:12, padding:"2px 10px", borderRadius:10, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}40` }}>{cfg.label}</span>
                    </div>
                    <div style={{ display:"flex", gap:20, fontSize:13, color:"#8B949E" }}>
                      <span>🖥️ {l.endpoints?.name || l.endpoint_id}</span>
                      <span>⚡ {l.action}</span>
                      <span>👤 {l.triggered_by || "admin"}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:"#6E7681", flexShrink:0 }}>
                    {new Date(l.deployed_at || l.created_at).toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}