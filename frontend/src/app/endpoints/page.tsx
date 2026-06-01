"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, LayoutDashboard, Server, Bug, Wrench, Clock, Bell, LogOut, RefreshCw, Eye } from "lucide-react"
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

const statusColor: Record<string, string> = {
  critical: "#FF3B3B",
  warning:  "#FF8C00",
  healthy:  "#00C853",
}

export default function EndpointsPage() {
  const router = useRouter()
  const [endpoints, setEndpoints] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [scanning,  setScanning]  = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ""))
    fetchEndpoints()
    fetchUnread()
  }, [])

  const fetchUnread = async () => {
    try {
      const res = await api.get("/api/alerts")
      setUnreadCount((res.data.data || []).filter((a: any) => !a.is_read).length)
    } catch {}
  }

  const fetchEndpoints = async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/endpoints")
      setEndpoints(res.data.data || res.data || [])
    } catch (err) {
      toast.error("Failed to load endpoints")
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (id: string, name: string) => {
    setScanning(id)
    try {
      await api.post("/api/scan", { endpoint_id: id })
      toast.success(`Scan complete for ${name}`)
      fetchEndpoints()
    } catch (err) {
      toast.error(`Scan failed for ${name}`)
    } finally {
      setScanning(null)
    }
  }

  const handleScanAll = async () => {
    toast("Scanning all endpoints...", { icon: "🔍" })
    for (const ep of endpoints) {
      await handleScan(ep.id, ep.hostname)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

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
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", margin:"2px 8px", borderRadius:6, cursor:"pointer", background:label==="Endpoints"?"rgba(35,134,54,0.15)":"transparent", color:label==="Endpoints"?"#2EA043":"#8B949E", fontWeight:label==="Endpoints"?600:400, fontSize:14 }}>
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
            <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Endpoints</h1>
            <p style={{ color:"#8B949E", marginTop:4, fontSize:14 }}>Manage and scan all connected machines</p>
          </div>
          <button onClick={handleScanAll} style={{ display:"flex", alignItems:"center", gap:8, background:"#238636", color:"#fff", border:"none", borderRadius:6, padding:"10px 18px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
            <RefreshCw size={16} /> Scan All Endpoints
          </button>
        </div>

        {loading ? (
          <div style={{ color:"#8B949E", padding:40, textAlign:"center" }}>Loading endpoints...</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {endpoints.map((ep) => {
              const status = ep.status || "healthy"
              return (
                <div key={ep.id} style={{ background:"#161B22", border:`1px solid ${status==="critical"?"rgba(255,59,59,0.3)":"rgba(255,140,0,0.3)"}`, borderRadius:10, padding:24 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:statusColor[status], boxShadow:`0 0 6px ${statusColor[status]}` }} />
                      <span style={{ fontSize:16, fontWeight:700 }}>{ep.hostname}</span>
                    </div>
                    <span style={{ fontSize:11, padding:"3px 10px", borderRadius:10, background:`${statusColor[status]}20`, color:statusColor[status], border:`1px solid ${statusColor[status]}40`, textTransform:"capitalize" }}>{status}</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span style={{ color:"#8B949E" }}>IP Address</span><span style={{ fontFamily:"monospace", color:"#58A6FF" }}>{ep.ip_address}</span></div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span style={{ color:"#8B949E" }}>OS</span><span>{ep.os}</span></div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}><span style={{ color:"#8B949E" }}>Last Scanned</span><span style={{ color:"#6E7681" }}>{ep.last_scanned ? new Date(ep.last_scanned).toLocaleString() : "Never"}</span></div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"transparent", border:"1px solid #30363D", color:"#E6EDF3", borderRadius:6, padding:"8px 12px", fontSize:13, cursor:"pointer" }}>
                      <Eye size={14} /> View Details
                    </button>
                    <button onClick={() => handleScan(ep.id, ep.hostname)} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"#238636", border:"none", color:"#fff", borderRadius:6, padding:"8px 12px", fontSize:13, cursor:"pointer", fontWeight:600 }}>
                      <RefreshCw size={14} />
                      {scanning===ep.id ? "Scanning..." : "Scan Now"}
                    </button>
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