// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getCompanyContext } from '@/lib/company-context'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get company context
    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    // Get activities for this company
    const { data, error } = await supabase
      .from('fc_activities')
      .select('*')
      .eq('company_id', context.companyId)
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Activities GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can create activities' }, { status: 403 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('fc_activities')
      .insert([{
        user_id: userId,
        company_id: context.companyId,
        name: body.name,
        description: body.description,
        default_cost: body.default_cost,
        color: body.color || '#F97316',
        icon: body.icon
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Activities POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can update activities' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase
      .from('fc_activities')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', context.companyId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Activities PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can delete activities' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Activity ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fc_activities')
      .delete()
      .eq('id', id)
      .eq('company_id', context.companyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Activities DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
