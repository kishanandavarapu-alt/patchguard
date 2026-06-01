"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopNavProps {
  title?: string
  userEmail?: string
}

export function TopNav({ title = "PatchGuard", userEmail = "admin@patchguard.io" }: TopNavProps) {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-border bg-background">
      <div className="flex h-full items-center justify-between px-6">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{userEmail}</span>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
