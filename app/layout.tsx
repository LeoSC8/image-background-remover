import './globals.css'
import AuthProvider from './components/AuthProvider'

export const metadata = {
  title: 'Image Background Remover',
  description: '一键去除图片背景',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
