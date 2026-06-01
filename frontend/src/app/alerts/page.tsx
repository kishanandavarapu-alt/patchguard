"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, LayoutDashboard, Server, Bug, Wrench, Clock, Bell, LogOut, AlertTriangle, CheckCircle } from "lucide-react"
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

const severityColor: Record<string, string> = {
  critical: "#FF3B3B",
  high:     "#FF8C00",
  medium:   "#FFD700",
  low:      "#00C853",
}

export default function AlertsPage() {
  const router = useRouter()
  const [alerts,    setAlerts]    = useState<any[]>([])
  const [filter,    setFilter]    = useState("all")
  const [loading,   setLoading]   = useState(true)
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ""))
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/alerts")
      setAlerts(res.data.data || [])
    } catch {
      toast.error("Failed to load alerts")
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id: string) => {
    try {
      await api.patch(`/api/alerts/${id}/acknowledge`)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true, acknowledged: true } : a))
      toast.success("Alert marked as read")
    } catch {
      toast.error("Failed to update alert")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const unreadCount = alerts.filter(a => !a.is_read && !a.acknowledged).length

  const filtered = alerts.filter(a => {
    if (filter === "unread")   return !a.is_read && !a.acknowledged
    if (filter === "critical") return a.severity === "critical"
    return true
  })

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
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", margin:"2px 8px", borderRadius:6, cursor:"pointer", background:label==="Alerts"?"rgba(35,134,54,0.15)":"transparent", color:label==="Alerts"?"#2EA043":"#8B949E", fontWeight:label==="Alerts"?600:400, fontSize:14 }}>
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
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Alerts</h1>
            {unreadCount > 0 && <span style={{ background:"rgba(255,59,59,0.15)", color:"#FF3B3B", border:"1px solid rgba(255,59,59,0.3)", borderRadius:10, padding:"2px 10px", fontSize:13, fontWeight:700 }}>{unreadCount} unread</span>}
          </div>
        </div>

        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          {["all","unread","critical"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:"8px 16px", borderRadius:6, border:"1px solid", borderColor:filter===f?"#238636":"#30363D", background:filter===f?"rgba(35,134,54,0.15)":"transparent", color:filter===f?"#2EA043":"#8B949E", fontSize:13, cursor:"pointer", fontWeight:filter===f?600:400, textTransform:"capitalize" }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color:"#8B949E", padding:40, textAlign:"center" }}>Loading alerts...</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {filtered.length === 0 ? (
              <div style={{ color:"#8B949E", padding:40, textAlign:"center" }}>No alerts found</div>
            ) : filtered.map((a) => {
              const sev  = a.severity?.toLowerCase() || "high"
              const read = a.is_read || a.acknowledged
              return (
                <div key={a.id} style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, padding:20, borderLeft:`4px solid ${read?"#30363D":severityColor[sev]}`, opacity:read?0.7:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                    <div style={{ display:"flex", gap:14, flex:1 }}>
                      <div style={{ width:40, height:40, borderRadius:"50%", background:`${severityColor[sev]}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <AlertTriangle size={20} color={severityColor[sev]} />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                          <span style={{ fontSize:14, fontWeight:700, fontFamily:"monospace", color:"#58A6FF" }}>{a.cve_id}</span>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:`${severityColor[sev]}20`, color:severityColor[sev], border:`1px solid ${severityColor[sev]}40`, textTransform:"capitalize" }}>{sev}</span>
                          {read && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"rgba(255,255,255,0.05)", color:"#6E7681" }}>Read</span>}
                        </div>
                        <p style={{ fontSize:13, color:"#8B949E", margin:0, lineHeight:1.5 }}>{a.message}</p>
                        <div style={{ fontSize:12, color:"#6E7681", marginTop:6 }}>
                          {new Date(a.sent_at || a.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {!read && (
                      <button onClick={() => markRead(a.id)} style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"1px solid #30363D", color:"#8B949E", borderRadius:6, padding:"6px 12px", fontSize:12, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
                        <CheckCircle size={14} /> Mark as Read
                      </button>
                    )}
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