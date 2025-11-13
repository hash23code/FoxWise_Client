import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// GET - Get all employee locations
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('fc_employee_locations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Geolocation GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update employee location
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, heading, speed, accuracy } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Upsert employee location (insert or update if exists)
    const { data, error } = await supabase
      .from('fc_employee_locations')
      .upsert(
        {
          clerk_user_id: userId,
          user_id: userId,
          latitude,
          longitude,
          heading: heading || null,
          speed: speed || null,
          accuracy: accuracy || null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'clerk_user_id'
        }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Geolocation POST error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
