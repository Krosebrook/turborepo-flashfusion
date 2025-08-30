import './globals.css'

export const metadata = {
  title: 'FlashFusion',
  description: 'Enterprise-grade AI-powered application development platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}