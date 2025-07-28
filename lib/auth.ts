import { createBucketClient } from '@cosmicjs/sdk'
import { User, LoginCredentials, RegisterData } from '@/types'
import { hashPassword, verifyPassword, validatePasswordStrength } from './password'
import { signToken } from '@/utils/jwt'

const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
})

export async function authenticateUser(credentials: LoginCredentials): Promise<{
  success: boolean
  user?: User
  token?: string
  error?: string
}> {
  try {
    const { email, password } = credentials

    // Find user by email in Cosmic CMS
    const { objects } = await cosmic.objects
      .find({ 
        type: 'streamers',
        'metadata.email': email
      })
      .props(['id', 'title', 'slug', 'metadata', 'created_at', 'modified_at'])
      .depth(1)

    if (!objects || objects.length === 0) {
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }

    const user = objects[0] as User

    // Check account status
    if (user.metadata.account_status?.key === 'banned') {
      return {
        success: false,
        error: 'Your account has been banned. Please contact support.'
      }
    }

    if (user.metadata.account_status?.key === 'suspended') {
      return {
        success: false,
        error: 'Your account is suspended. Please contact support.'
      }
    }

    if (user.metadata.account_status?.key === 'pending') {
      return {
        success: false,
        error: 'Your account is pending approval. Please wait for activation.'
      }
    }

    // Verify password (assuming password_hash is stored in metadata)
    const storedPasswordHash = user.metadata.password_hash
    if (!storedPasswordHash) {
      return {
        success: false,
        error: 'Account setup incomplete. Please contact support.'
      }
    }

    const isPasswordValid = await verifyPassword(password, storedPasswordHash)
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid email or password'
      }
    }

    // Generate JWT token
    const token = signToken(user)

    // Remove sensitive data from user object
    const safeUser = {
      ...user,
      metadata: {
        ...user.metadata,
        password_hash: undefined
      }
    }

    return {
      success: true,
      user: safeUser,
      token
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed. Please try again.'
    }
  }
}

export async function registerUser(data: RegisterData): Promise<{
  success: boolean
  user?: User
  token?: string
  error?: string
}> {
  try {
    const { username, email, password, bio } = data

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.errors.join(', ')
      }
    }

    // Check if email already exists
    const { objects: existingUsers } = await cosmic.objects
      .find({ 
        type: 'streamers',
        'metadata.email': email
      })
      .props(['id'])

    if (existingUsers && existingUsers.length > 0) {
      return {
        success: false,
        error: 'An account with this email already exists'
      }
    }

    // Check if username already exists
    const { objects: existingUsernames } = await cosmic.objects
      .find({ 
        type: 'streamers',
        'metadata.username': username
      })
      .props(['id'])

    if (existingUsernames && existingUsernames.length > 0) {
      return {
        success: false,
        error: 'This username is already taken'
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate unique stream key
    const streamKey = `sk_live_${generateRandomString(16)}`

    // Create user in Cosmic CMS
    const { object } = await cosmic.objects.insertOne({
      title: username,
      type: 'streamers',
      status: 'published',
      metadata: {
        username,
        email,
        password_hash: passwordHash,
        bio: bio || '',
        is_live: false,
        personal_stream_key: streamKey,
        follower_count: 0,
        total_views: 0,
        account_status: 'active', // Set as active by default
        social_links: {}
      }
    })

    const newUser = object as User

    // Generate JWT token
    const token = signToken(newUser)

    // Remove sensitive data from user object
    const safeUser = {
      ...newUser,
      metadata: {
        ...newUser.metadata,
        password_hash: undefined
      }
    }

    return {
      success: true,
      user: safeUser,
      token
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: 'Registration failed. Please try again.'
    }
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { object } = await cosmic.objects
      .findOne({ id: userId })
      .props(['id', 'title', 'slug', 'metadata', 'created_at', 'modified_at'])
      .depth(1)

    if (!object || object.type !== 'streamers') {
      return null
    }

    // Remove sensitive data
    const safeUser = {
      ...object,
      metadata: {
        ...object.metadata,
        password_hash: undefined
      }
    } as User

    return safeUser
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    return null
  }
}

export async function updateUser(userId: string, updates: Partial<User['metadata']>): Promise<{
  success: boolean
  user?: User
  error?: string
}> {
  try {
    // Remove sensitive fields that shouldn't be updated this way
    const { password_hash, email, personal_stream_key, ...safeUpdates } = updates as any

    const { object } = await cosmic.objects.updateOne(userId, {
      metadata: safeUpdates
    })

    const updatedUser = {
      ...object,
      metadata: {
        ...object.metadata,
        password_hash: undefined
      }
    } as User

    return {
      success: true,
      user: updatedUser
    }
  } catch (error) {
    console.error('Error updating user:', error)
    return {
      success: false,
      error: 'Failed to update user profile'
    }
  }
}

export async function updateUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Get current user with password hash
    const { object } = await cosmic.objects
      .findOne({ id: userId })
      .props(['id', 'metadata'])

    if (!object) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Verify current password
    const currentPasswordHash = object.metadata.password_hash
    if (!currentPasswordHash) {
      return {
        success: false,
        error: 'Account setup incomplete'
      }
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, currentPasswordHash)
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: 'Current password is incorrect'
      }
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.errors.join(', ')
      }
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password in Cosmic CMS
    await cosmic.objects.updateOne(userId, {
      metadata: {
        password_hash: newPasswordHash
      }
    })

    return {
      success: true
    }
  } catch (error) {
    console.error('Error updating password:', error)
    return {
      success: false,
      error: 'Failed to update password'
    }
  }
}

function generateRandomString(length: number): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}