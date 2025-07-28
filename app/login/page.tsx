import LoginForm from '@/components/LoginForm'
import { AuthProvider } from '@/hooks/useAuth'

export const metadata = {
  title: 'Sign In - LiveStream Pro',
  description: 'Sign in to your streamer account',
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <LoginForm />
      </div>
    </AuthProvider>
  )
}