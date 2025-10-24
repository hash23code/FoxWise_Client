import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get calendar events
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assigned_to = searchParams.get('assigned_to')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    let query = supabase
      .from('fc_calendar_events')
      .select(`
        *,
        client:fc_clients(id, name, email, phone),
        job:fc_jobs(id, title, status, priority)
      `)
      .order('start_time', { ascending: true })

    // Filter by assigned employee if provided
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to)
    }

    // Filter by date range if provided
    if (start_date && end_date) {
      query = query
        .gte('start_time', start_date)
        .lte('end_time', end_date)
    }

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Calendar GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create calendar event
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('fc_calendar_events')
      .insert([{
        user_id: userId,
        assigned_to: body.assigned_to || null,
        title: body.title,
        description: body.description || null,
        start_time: body.start_time,
        end_time: body.end_time,
        client_id: body.client_id || null,
        job_id: body.job_id || null,
        event_type: body.event_type || 'other'
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Calendar POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update calendar event
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('fc_calendar_events')
      .update({
        assigned_to: body.assigned_to,
        title: body.title,
        description: body.description,
        start_time: body.start_time,
        end_time: body.end_time,
        client_id: body.client_id,
        job_id: body.job_id,
        event_type: body.event_type
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Calendar PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete calendar event
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fc_calendar_events')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
