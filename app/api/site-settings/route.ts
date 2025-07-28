import { NextRequest, NextResponse } from 'next/server'
import { getSiteSettings, updateSiteSettings } from '@/lib/cosmic'
import { ApiResponse } from '@/types'

export async function GET() {
  try {
    const settings = await getSiteSettings()
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'Site settings not found',
        message: 'No site settings configured'
      } as ApiResponse, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: settings
    } as ApiResponse)

  } catch (error: unknown) {
    console.error('Error fetching site settings:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch site settings'
    } as ApiResponse, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { settingsId, metadata } = body

    if (!settingsId) {
      return NextResponse.json({
        success: false,
        error: 'Settings ID is required',
        message: 'Please provide a valid settings ID'
      } as ApiResponse, { status: 400 })
    }

    if (!metadata || typeof metadata !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid metadata',
        message: 'Please provide valid settings metadata'
      } as ApiResponse, { status: 400 })
    }

    const updatedSettings = await updateSiteSettings(settingsId, metadata)

    return NextResponse.json({
      success: true,
      data: updatedSettings
    } as ApiResponse)

  } catch (error: unknown) {
    console.error('Error updating site settings:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update site settings'
    } as ApiResponse, { status: 500 })
  }
}