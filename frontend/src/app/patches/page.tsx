"use client"

import { useState } from "react"
import Link from "next/link"
import { Shield, LayoutDashboard, Server, Bug, Wrench, Clock, Bell, LogOut, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard" },
  { icon: Server,          label: "Endpoints",       href: "/endpoints" },
  { icon: Bug,             label: "Vulnerabilities", href: "/vulnerabilities" },
  { icon: Wrench,          label: "Patches",         href: "/patches" },
  { icon: Clock,           label: "Logs",            href: "/logs" },
  { icon: Bell,            label: "Alerts",          href: "/alerts" },
]

const patches = [
  { id:1, cve:"CVE-2021-44228", software:"Log4j",            version:"2.14.1", patch:"2.17.1", severity:"critical", status:"available",  endpoint:"app-server-01" },
  { id:2, cve:"CVE-2022-22965", software:"Spring Framework", version:"5.3.18", patch:"5.3.20", severity:"critical", status:"available",  endpoint:"app-server-01" },
  { id:3, cve:"CVE-2021-41773", software:"Apache",           version:"2.4.49", patch:"2.4.51", severity:"critical", status:"applied",    endpoint:"web-server-01" },
  { id:4, cve:"CVE-2023-38408", software:"OpenSSH",          version:"7.4",    patch:"9.6",    severity:"critical", status:"available",  endpoint:"db-server-01"  },
  { id:5, cve:"CVE-2014-0160",  software:"OpenSSL",          version:"1.1.1k", patch:"3.2.1",  severity:"critical", status:"available",  endpoint:"web-server-01" },
  { id:6, cve:"CVE-2021-35604", software:"MySQL",            version:"5.7.38", patch:"8.0.36", severity:"high",     status:"failed",     endpoint:"db-server-01"  },
]

const severityColor: Record<string, string> = {
  critical: "#FF3B3B",
  high:     "#FF8C00",
  medium:   "#FFD700",
  low:      "#00C853",
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  available: { color: "#2196F3", bg: "rgba(33,150,243,0.15)", label: "Available" },
  applied:   { color: "#00C853", bg: "rgba(0,200,83,0.15)",   label: "Applied"   },
  failed:    { color: "#FF3B3B", bg: "rgba(255,59,59,0.15)",  label: "Failed"    },
}

export default function PatchesPage() {
  const [applying, setApplying] = useState<number | null>(null)
  const [applied, setApplied]   = useState<number[]>([3])

  const handleApply = (id: number) => {
    setApplying(id)
    setTimeout(() => {
      setApplied(prev => [...prev, id])
      setApplying(null)
    }, 2000)
  }

  const stats = {
    available: patches.filter(p => !applied.includes(p.id) && p.status !== "failed").length,
    applied:   applied.length,
    failed:    patches.filter(p => p.status === "failed").length,
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
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", margin:"2px 8px", borderRadius:6, cursor:"pointer", background:label==="Patches"?"rgba(35,134,54,0.15)":"transparent", color:label==="Patches"?"#2EA043":"#8B949E", fontWeight:label==="Patches"?600:400, fontSize:14 }}>
                <Icon size={18} />
                {label}
                {label==="Alerts" && <span style={{ marginLeft:"auto", background:"#FF3B3B", color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700 }}>3</span>}
              </div>
            </Link>
          ))}
        </nav>
        <div style={{ padding:"16px 20px", borderTop:"1px solid #30363D" }}>
          <div style={{ fontSize:12, color:"#8B949E", marginBottom:8 }}>admin@patchguard.io</div>
          <button style={{ display:"flex", alignItems:"center", gap:8, color:"#8B949E", background:"none", border:"none", cursor:"pointer", fontSize:14 }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main style={{ flex:1, marginLeft:240, padding:32 }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Patches</h1>
          <p style={{ color:"#8B949E", marginTop:4, fontSize:14 }}>Available and applied security patches</p>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:28 }}>
          <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, padding:20, display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(33,150,243,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <RefreshCw size={22} color="#2196F3" />
            </div>
            <div>
              <div style={{ fontSize:28, fontWeight:700, color:"#2196F3" }}>{stats.available}</div>
              <div style={{ fontSize:13, color:"#8B949E" }}>Available</div>
            </div>
          </div>
          <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, padding:20, display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(0,200,83,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CheckCircle size={22} color="#00C853" />
            </div>
            <div>
              <div style={{ fontSize:28, fontWeight:700, color:"#00C853" }}>{stats.applied}</div>
              <div style={{ fontSize:13, color:"#8B949E" }}>Applied</div>
            </div>
          </div>
          <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, padding:20, display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,59,59,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <XCircle size={22} color="#FF3B3B" />
            </div>
            <div>
              <div style={{ fontSize:28, fontWeight:700, color:"#FF3B3B" }}>{stats.failed}</div>
              <div style={{ fontSize:13, color:"#8B949E" }}>Failed</div>
            </div>
          </div>
        </div>

        {/* Patches Table */}
        <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #30363D" }}>
                {["CVE ID","Software","Current","Patch","Severity","Endpoint","Status","Action"].map(h => (
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:12, color:"#8B949E", fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patches.map(({ id, cve, software, version, patch, severity, status, endpoint }) => {
                const isApplied = applied.includes(id)
                const cfg = statusConfig[isApplied ? "applied" : status]
                return (
                  <tr key={id} style={{ borderBottom:"1px solid #21262D" }}>
                    <td style={{ padding:"14px 16px", fontSize:13, fontFamily:"monospace", color:"#58A6FF" }}>{cve}</td>
                    <td style={{ padding:"14px 16px", fontSize:14, fontWeight:600 }}>{software}</td>
                    <td style={{ padding:"14px 16px", fontSize:13, fontFamily:"monospace", color:"#FF6B6B" }}>{version}</td>
                    <td style={{ padding:"14px 16px", fontSize:13, fontFamily:"monospace", color:"#00C853" }}>{patch}</td>
                    <td style={{ padding:"14px 16px" }}>
                      <span style={{ fontSize:12, padding:"3px 10px", borderRadius:10, background:`${severityColor[severity]}20`, color:severityColor[severity], border:`1px solid ${severityColor[severity]}40`, textTransform:"capitalize" }}>{severity}</span>
                    </td>
                    <td style={{ padding:"14px 16px", fontSize:13, color:"#8B949E" }}>{endpoint}</td>
                    <td style={{ padding:"14px 16px" }}>
                      <span style={{ fontSize:12, padding:"3px 10px", borderRadius:10, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}40` }}>{cfg.label}</span>
                    </td>
                    <td style={{ padding:"14px 16px" }}>
                      {isApplied ? (
                        <span style={{ fontSize:12, color:"#6E7681" }}>✓ Done</span>
                      ) : status === "failed" ? (
                        <button onClick={() => handleApply(id)} style={{ background:"rgba(255,59,59,0.15)", color:"#FF3B3B", border:"1px solid rgba(255,59,59,0.3)", borderRadius:6, padding:"6px 14px", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                          Retry
                        </button>
                      ) : (
                        <button onClick={() => handleApply(id)} style={{ background:applying===id?"rgba(33,150,243,0.15)":"rgba(35,134,54,0.15)", color:applying===id?"#2196F3":"#2EA043", border:`1px solid ${applying===id?"rgba(33,150,243,0.3)":"rgba(35,134,54,0.3)"}`, borderRadius:6, padding:"6px 14px", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                          {applying===id?"Applying...":"Apply"}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}