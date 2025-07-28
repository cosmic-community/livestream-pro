'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function RegisterForm() {
  const { register, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordStrength.length > 0) {
      setError('Please fix password requirements')
      return
    }

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      bio: formData.bio || undefined,
    })
    
    if (!result.success) {
      setError(result.error || 'Registration failed')
    } else {
      // Redirect will be handled by middleware or useAuth
      window.location.href = '/dashboard'
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Validate password strength on password change
    if (name === 'password') {
      validatePasswordStrength(value)
    }
  }

  const validatePasswordStrength = (password: string) => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('At least 8 characters')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('One number')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('One special character')
    }

    setPasswordStrength(errors)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-muted/30 rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Create Account</h2>
          <p className="text-muted-foreground">Join the livestreaming platform</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Choose a unique username"
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
            />
            <p className="text-xs text-muted-foreground mt-1">
              3-30 characters, letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Create a strong password"
              minLength={8}
            />
            {passwordStrength.length > 0 && (
              <div className="mt-2 text-xs">
                <p className="text-muted-foreground mb-1">Password must include:</p>
                <ul className="space-y-1">
                  {passwordStrength.map((requirement, index) => (
                    <li key={index} className="text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Confirm your password"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
            )}
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="Tell viewers about yourself..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || passwordStrength.length > 0}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-blue-400 hover:text-blue-300 font-medium underline"
            >
              Sign in here
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link 
            href="/" 
            className="text-muted-foreground hover:text-foreground text-sm underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}