"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Shield, LayoutDashboard, Server, Bug,
  Wrench, Clock, Bell, LogOut,
  AlertTriangle, CheckCircle, XCircle
} from "lucide-react"
import api from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",      href: "/dashboard" },
  { icon: Server,          label: "Endpoints",       href: "/endpoints" },
  { icon: Bug,             label: "Vulnerabilities", href: "/vulnerabilities" },
  { icon: Wrench,          label: "Patches",         href: "/patches" },
  { icon: Clock,           label: "Logs",            href: "/logs" },
  { icon: Bell,            label: "Alerts",          href: "/alerts" },
]

export default function DashboardPage() {
  const router = useRouter()
  const [active, setActive] = useState("Dashboard")
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)

  const [statCards, setStatCards] = useState([
    { label: "Endpoints Scanned", value: "—", color: "#2196F3" },
    { label: "Critical CVEs",     value: "—", color: "#FF3B3B" },
    { label: "Patches Applied",   value: "—", color: "#00C853" },
    { label: "Pending Alerts",    value: "—", color: "#FF8C00" },
  ])

  const [severityData, setSeverityData] = useState([
    { label: "Critical", count: 0, color: "#FF3B3B" },
    { label: "High",     count: 0, color: "#FF8C00" },
    { label: "Medium",   count: 0, color: "#FFD700" },
    { label: "Low",      count: 0, color: "#00C853" },
  ])

  const [recentActivity, setRecentActivity] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    try {
      const [vulnRes, logsRes, alertsRes] = await Promise.all([
        api.get("/api/vulnerabilities?limit=200"),
        api.get("/api/logs?limit=5"),
        api.get("/api/alerts"),
      ])

      const vulns = vulnRes.data.data || []
      const logs  = logsRes.data.data  || []
      const alerts = alertsRes.data.data || []

      // Severity counts
      const counts = { critical: 0, high: 0, medium: 0, low: 0 }
      vulns.forEach((v: any) => {
        const s = v.severity?.toLowerCase()
        if (s in counts) counts[s as keyof typeof counts]++
      })

      setSeverityData([
        { label: "Critical", count: counts.critical, color: "#FF3B3B" },
        { label: "High",     count: counts.high,     color: "#FF8C00" },
        { label: "Medium",   count: counts.medium,   color: "#FFD700" },
        { label: "Low",      count: counts.low,      color: "#00C853" },
      ])

      // Patches applied from logs
      const patchesApplied = logs.filter((l: any) => l.status === "success").length
      const unread = alerts.filter((a: any) => !a.is_read && !a.acknowledged).length
      setUnreadCount(unread)

      setStatCards([
        { label: "Endpoints Scanned", value: "3",                         color: "#2196F3" },
        { label: "Critical CVEs",     value: String(counts.critical),     color: "#FF3B3B" },
        { label: "Patches Applied",   value: String(patchesApplied),      color: "#00C853" },
        { label: "Pending Alerts",    value: String(unread),              color: "#FF8C00" },
      ])

      // Recent activity from logs
      const activity = logs.slice(0, 5).map((l: any) => ({
        cve:      l.cve_id,
        endpoint: l.endpoints?.name || l.endpoint_id,
        status:   l.status,
        time:     new Date(l.deployed_at || l.created_at).toLocaleString(),
      }))
      setRecentActivity(activity)

    } catch (err) {
      console.error("Dashboard fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "")
    })
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const maxCount = Math.max(...severityData.map(s => s.count), 1)

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
              <div onClick={() => setActive(label)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", margin:"2px 8px", borderRadius:6, cursor:"pointer", background:active===label?"rgba(35,134,54,0.15)":"transparent", color:active===label?"#2EA043":"#8B949E", fontWeight:active===label?600:400, fontSize:14 }}>
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
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Dashboard Overview</h1>
          <p style={{ color:"#8B949E", marginTop:4, fontSize:14 }}>Monitor your security posture across all endpoints</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
          {statCards.map(({ label, value, color }) => (
            <div key={label} style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, padding:20 }}>
              <div style={{ fontSize:13, color:"#8B949E", marginBottom:8 }}>{label}</div>
              <div style={{ fontSize:36, fontWeight:700, color }}>
                {loading ? <span style={{ fontSize:20, color:"#30363D" }}>Loading...</span> : value}
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Activity */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:20 }}>
          <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, padding:24 }}>
            <h2 style={{ fontSize:16, fontWeight:600, marginBottom:20, marginTop:0 }}>Vulnerabilities by Severity</h2>
            <div style={{ display:"flex", alignItems:"flex-end", gap:24, height:160 }}>
              {severityData.map(({ label, count, color }) => (
                <div key={label} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, flex:1 }}>
                  <span style={{ fontSize:18, fontWeight:700, color }}>{count}</span>
                  <div style={{ width:"100%", background:"rgba(255,255,255,0.05)", borderRadius:6, height:120, display:"flex", alignItems:"flex-end" }}>
                    <div style={{ width:"100%", borderRadius:6, height:count===0?4:`${(count/maxCount)*100}%`, background:color }} />
                  </div>
                  <span style={{ fontSize:12, color:"#8B949E" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:10, padding:24 }}>
            <h2 style={{ fontSize:16, fontWeight:600, marginBottom:20, marginTop:0 }}>Recent Activity</h2>
            {loading ? (
              <div style={{ color:"#8B949E", fontSize:13 }}>Loading...</div>
            ) : recentActivity.length === 0 ? (
              <div style={{ color:"#8B949E", fontSize:13 }}>No activity yet</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {recentActivity.map((item, i) => (
                  <div key={i} style={{ paddingBottom:16, borderBottom:"1px solid #21262D" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:"#58A6FF", fontFamily:"monospace" }}>{item.cve}</span>
                      {item.status==="success"     && <CheckCircle  size={16} color="#00C853" />}
                      {item.status==="failed"      && <XCircle      size={16} color="#FF3B3B" />}
                      {item.status==="rolled_back" && <AlertTriangle size={16} color="#FFD700" />}
                    </div>
                    <div style={{ fontSize:12, color:"#8B949E" }}>{item.endpoint}</div>
                    <div style={{ fontSize:11, color:"#6E7681", marginTop:4 }}>{item.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}