import DashboardHeader from "@/components/DashboardHeader"
import Sidebar from "@/components/Sidebar"

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 min-h-screen overflow-auto flex flex-col"
        style={{ backgroundColor: "#F7F9F3" }}
      >
        <DashboardHeader />
        <div className="flex-1 flex flex-col">{children}</div>
      </main>
    </div>
  )
}
