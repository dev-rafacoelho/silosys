import Sidebar from "@/components/Sidebar"

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 min-h-screen overflow-auto"
        style={{ backgroundColor: "#F7F7F7" }}
      >
        {children}
      </main>
    </div>
  )
}
