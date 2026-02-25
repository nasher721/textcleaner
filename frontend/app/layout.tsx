import './globals.css'
import Nav from '../components/Nav'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body><Nav /><main className="p-4 max-w-6xl mx-auto">{children}</main></body></html>
}
