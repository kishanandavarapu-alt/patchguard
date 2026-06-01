import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  cveId: string
  status: "applied" | "pending" | "failed"
  timeAgo: string
}

const activities: Activity[] = [
  {
    id: "1",
    cveId: "CVE-2024-1234",
    status: "applied",
    timeAgo: "2 hours ago",
  },
  {
    id: "2",
    cveId: "CVE-2024-5678",
    status: "pending",
    timeAgo: "4 hours ago",
  },
  {
    id: "3",
    cveId: "CVE-2024-9012",
    status: "failed",
    timeAgo: "6 hours ago",
  },
]

const statusStyles = {
  applied: "bg-[#3FB950]/10 text-[#3FB950] border-[#3FB950]/20",
  pending: "bg-[#FF8C00]/10 text-[#FF8C00] border-[#FF8C00]/20",
  failed: "bg-[#FF3B3B]/10 text-[#FF3B3B] border-[#FF3B3B]/20",
}

export function RecentActivity() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-4"
            >
              <div className="space-y-1">
                <p className="font-mono text-sm font-medium text-foreground">
                  {activity.cveId}
                </p>
                <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
              </div>
              <Badge
                variant="outline"
                className={cn("capitalize", statusStyles[activity.status])}
              >
                {activity.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
