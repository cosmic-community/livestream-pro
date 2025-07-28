import RegisterForm from '@/components/RegisterForm'
import { AuthProvider } from '@/hooks/useAuth'

export const metadata = {
  title: 'Create Account - LiveStream Pro',
  description: 'Create your streamer account',
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <RegisterForm />
      </div>
    </AuthProvider>
  )
}