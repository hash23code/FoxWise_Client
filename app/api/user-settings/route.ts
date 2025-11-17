import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyContext } from '@/lib/company-context'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Load user settings
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user settings
    const { data, error } = await supabase
      .from('fc_user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching user settings:', error)
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }

    // Return settings or default values
    return NextResponse.json(data || {
      language: 'en',
      timezone: 'America/Toronto',
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
        jobReminders: true,
        clientUpdates: true
      }
    })
  } catch (error) {
    console.error('User settings GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Save user settings
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    const body = await request.json()
    const { language, timezone, theme, notifications } = body

    // Check if settings exist
    const { data: existing } = await supabase
      .from('fc_user_settings')
      .select('id')
      .eq('user_id', userId)
      .single()

    let result

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('fc_user_settings')
        .update({
          language,
          timezone,
          theme,
          notifications,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user settings:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
      }

      result = data
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('fc_user_settings')
        .insert({
          user_id: userId,
          company_id: context.companyId,
          language,
          timezone,
          theme,
          notifications
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user settings:', error)
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      settings: result
    })
  } catch (error) {
    console.error('User settings POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
