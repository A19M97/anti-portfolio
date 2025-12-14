import { ConditionalLayout } from "@/components/layout/conditional-layout"

export default function SimulationsLayout({ children }: { children: React.ReactNode }) {
  return <ConditionalLayout>{children}</ConditionalLayout>
}
