import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import AIChatbot from '@/components/AIChatbot'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-gray-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <AIChatbot />
    </div>
  )
}
