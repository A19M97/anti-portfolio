"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useLogout } from "@/hooks/useLogout"
import { type ComponentProps } from "react"

interface LogoutButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  showIcon?: boolean
  showLabel?: boolean
}

export function LogoutButton({
  showIcon = true,
  showLabel = true,
  variant = "outline",
  size = "sm",
  ...props
}: LogoutButtonProps) {
  const handleLogout = useLogout();


  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      {...props}
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {showLabel && <span className={showIcon ? "ml-2" : ""}>
        Logout
      </span>}
    </Button>
  )
}
