import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { StatsGrid } from '../plans/StatsGrid'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* <Sidebar /> */}

      <div className="flex-1 flex flex-col">
        <Header />

        {/* Separación Header → Stats */}
        <section className="mt-4 bg-white border-b">
          <div className="px-6 py-6">
            <StatsGrid />
          </div>
        </section>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
