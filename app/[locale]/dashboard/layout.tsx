import { ConditionalLayout } from "@/components/layout/conditional-layout"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ConditionalLayout>{children}</ConditionalLayout>
}
