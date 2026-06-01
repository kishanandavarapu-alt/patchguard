import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Server, Bug, Wrench, AlertTriangle } from "lucide-react"

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color: "blue" | "red" | "green" | "orange"
}

const colorClasses = {
  blue: "text-[#58A6FF]",
  red: "text-[#FF3B3B]",
  green: "text-[#3FB950]",
  orange: "text-[#FF8C00]",
}

const bgColorClasses = {
  blue: "bg-[#58A6FF]/10",
  red: "bg-[#FF3B3B]/10",
  green: "bg-[#3FB950]/10",
  orange: "bg-[#FF8C00]/10",
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn("text-3xl font-bold", colorClasses[color])}>{value}</p>
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", bgColorClasses[color])}>
            <div className={colorClasses[color]}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatCards() {
  const stats = [
    {
      title: "Endpoints Scanned",
      value: 3,
      icon: <Server className="h-6 w-6" />,
      color: "blue" as const,
    },
    {
      title: "Critical CVEs",
      value: 4,
      icon: <Bug className="h-6 w-6" />,
      color: "red" as const,
    },
    {
      title: "Patches Applied",
      value: 1,
      icon: <Wrench className="h-6 w-6" />,
      color: "green" as const,
    },
    {
      title: "Pending Alerts",
      value: 3,
      icon: <AlertTriangle className="h-6 w-6" />,
      color: "orange" as const,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}
