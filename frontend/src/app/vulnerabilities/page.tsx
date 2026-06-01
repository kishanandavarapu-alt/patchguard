"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, LayoutDashboard, Server, Bug, Wrench, Clock, Bell, LogOut, Search, X } from "lucide-react"
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

export default function VulnerabilitiesPage() {
  const router = useRouter()
  const [filter,    setFilter]    = useState("all")
  const [search,    setSearch]    = useState("")
  const [modal,     setModal]     = useState<any | null>(null)
  const [rollback,  setRollback]  = useState(true)
  const [vulns,     setVulns]     = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ""))
    fetchVulns()
    fetchUnread()
  }, [])

  const fetchUnread = async () => {
    try {
      const res = await api.get("/api/alerts")
      const alerts = res.data.data || []
      setUnreadCount(alerts.filter((a: any) => !a.is_read).length)
    } catch {}
  }

  const fetchVulns = async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/vulnerabilities?limit=200")
      setVulns(res.data.data || [])
    } catch (err) {
      toast.error("Failed to load vulnerabilities")
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    if (!modal) return
    setDeploying(true)
    try {
      const res = await api.post("/api/patch/deploy", {
        endpoint_id:     modal.endpoint_id,
        cve_id:          modal.cve_id,
        rollback_enabled: rollback,
      })
      if (res.data.success) {
        toast.success(`Patch deployed for ${modal.cve_id}`)
        setVulns(prev => prev.map(v => v.id === modal.id ? { ...v, status: "patched" } : v))
      } else {
        toast.error(`Deployment failed for ${modal.cve_id}`)
      }
    } catch (err) {
      toast.error("Deploy request failed")
    } finally {
      setDeploying(false)
      setModal(null)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const filtered = vulns.filter(v => {
    const matchFilter = filter === "all" || v.severity?.toLowerCase() === filter
    const matchSearch = v.cve_id?.toLowerCase().includes(search.toLowerCase()) ||
                        v.software?.name?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
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
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", margin:"2px 8px", borderRadius:6, cursor:"pointer", background:label==="Vulnerabilities"?"rgba(35,134,54,0.15)":"transparent", color:label==="Vulnerabilities"?"#2EA043":"#8B949E", fontWeight:label==="Vulnerabilities"?600:400, fontSize:14 }}>
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
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Vulnerabilities</h1>
            <span style={{ background:"rgba(255,59,59,0.15)", color:"#FF3B3B", border:"1px solid rgba(255,59,59,0.3)", borderRadius:10, padding:"2px 10px", fontSize:13, fontWeight:700 }}>{vulns.length} total</span>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, gap:16 }}>
          <div style={{ display:"flex", gap:8 }}>
            {["all","critical","high","medium","low"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding:"7px 14px", borderRadius:6, border:"1px solid", borderColor:filter===f?"#238636":"#30363D", background:filter===f?"rgba(35,134,54,0.15)":"transparent", color:filter===f?"#2EA043":"#8B949E", fontSize:13, cursor:"pointer", fontWeight:filter===f?600:400, textTransform:"capitalize" }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#161B22", border:"1px solid #30363D", borderRadius:6, padding:"8px 12px", minWidth:260 }}>
            <Search size={16} color="#8B949E" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search CVE ID or software..." style={{ background:"none", border:"none", outline:"none", color:"#E6EDF3", fontSize:13, width:"100%" }} />
          </div>
        </div>

        <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, overflow:"hidden" }}>
          {loading ? (
            <div style={{ padding:40, textAlign:"center", color:"#8B949E" }}>Loading vulnerabilities...</div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid #30363D" }}>
                  {["Software","Version","CVE ID","CVSS","Severity","Status","Action"].map(h => (
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:12, color:"#8B949E", fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const sev = v.severity?.toLowerCase() || "low"
                  const isPatched = v.status === "patched"
                  return (
                    <tr key={v.id} style={{ borderBottom:"1px solid #21262D" }}>
                      <td style={{ padding:"14px 16px", fontSize:14, fontWeight:600 }}>{v.software?.name || "—"}</td>
                      <td style={{ padding:"14px 16px", fontSize:13, fontFamily:"monospace", color:"#8B949E" }}>{v.software?.installed_version || "—"}</td>
                      <td style={{ padding:"14px 16px", fontSize:13, fontFamily:"monospace", color:"#58A6FF" }}>{v.cve_id}</td>
                      <td style={{ padding:"14px 16px", fontSize:14, fontWeight:700, color:severityColor[sev] }}>{v.cvss_score ?? "—"}</td>
                      <td style={{ padding:"14px 16px" }}>
                        <span style={{ fontSize:12, padding:"3px 10px", borderRadius:10, background:`${severityColor[sev]}20`, color:severityColor[sev], border:`1px solid ${severityColor[sev]}40`, textTransform:"capitalize" }}>{sev}</span>
                      </td>
                      <td style={{ padding:"14px 16px" }}>
                        <span style={{ fontSize:12, padding:"3px 10px", borderRadius:10, background:isPatched?"rgba(0,200,83,0.15)":"rgba(255,59,59,0.1)", color:isPatched?"#00C853":"#FF6B6B", border:`1px solid ${isPatched?"rgba(0,200,83,0.3)":"rgba(255,59,59,0.2)"}` }}>
                          {isPatched ? "✓ Patched" : "Unpatched"}
                        </span>
                      </td>
                      <td style={{ padding:"14px 16px" }}>
                        {isPatched ? (
                          <span style={{ fontSize:12, color:"#6E7681" }}>—</span>
                        ) : (
                          <button onClick={() => setModal(v)} style={{ background:`${severityColor[sev]}20`, color:severityColor[sev], border:`1px solid ${severityColor[sev]}40`, borderRadius:6, padding:"6px 14px", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                            Deploy
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:12, padding:28, width:420 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Deploy Patch</h2>
              <button onClick={() => setModal(null)} style={{ background:"none", border:"none", color:"#8B949E", cursor:"pointer" }}><X size={20} /></button>
            </div>
            <div style={{ background:"#0D1117", borderRadius:8, padding:16, marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                <span style={{ color:"#8B949E" }}>CVE ID</span>
                <span style={{ fontFamily:"monospace", color:"#58A6FF" }}>{modal.cve_id}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                <span style={{ color:"#8B949E" }}>Software</span>
                <span>{modal.software?.name} v{modal.software?.installed_version}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                <span style={{ color:"#8B949E" }}>CVSS Score</span>
                <span style={{ color:severityColor[modal.severity?.toLowerCase()], fontWeight:700 }}>{modal.cvss_score}</span>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Enable Rollback</div>
                <div style={{ fontSize:12, color:"#8B949E" }}>Auto-rollback if patch fails</div>
              </div>
              <div onClick={() => setRollback(!rollback)} style={{ width:44, height:24, borderRadius:12, background:rollback?"#238636":"#30363D", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
                <div style={{ width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left:rollback?23:3, transition:"left 0.2s" }} />
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setModal(null)} style={{ flex:1, padding:"10px", background:"transparent", border:"1px solid #30363D", color:"#E6EDF3", borderRadius:6, cursor:"pointer", fontSize:14 }}>Cancel</button>
              <button onClick={handleDeploy} disabled={deploying} style={{ flex:1, padding:"10px", background:"#238636", border:"none", color:"#fff", borderRadius:6, cursor:"pointer", fontSize:14, fontWeight:600, opacity:deploying?0.7:1 }}>
                {deploying ? "Deploying..." : "Confirm Deploy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}