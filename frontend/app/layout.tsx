import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'MedNoteCleaner | Clinical Command Center',
  description: 'Advanced clinical note cleaning and structured data extraction',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased flex h-screen overflow-hidden bg-slate-950 text-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950 px-8 py-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
