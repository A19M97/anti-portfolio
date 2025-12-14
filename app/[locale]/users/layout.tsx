import { ConditionalLayout } from "@/components/layout/conditional-layout"

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <ConditionalLayout>{children}</ConditionalLayout>
}
