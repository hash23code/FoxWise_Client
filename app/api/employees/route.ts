import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getCompanyContext } from '@/lib/company-context'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get all employees for the company
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Get specific employee - ensure it's from the same company
      const { data, error } = await supabase
        .from('fc_users')
        .select('*')
        .eq('id', id)
        .eq('company_id', context.companyId)
        .single()

      if (error) throw error
      return NextResponse.json(data)
    } else {
      // Get all employees in the company
      const { data, error } = await supabase
        .from('fc_users')
        .select('*')
        .eq('company_id', context.companyId)
        .order('full_name', { ascending: true })

      if (error) throw error
      return NextResponse.json(data || [])
    }
  } catch (error) {
    console.error('Employees GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new employee (manager only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    // Only managers can create employees
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can create employees' }, { status: 403 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('fc_users')
      .insert([{
        clerk_user_id: body.clerk_user_id || 'temp_' + Date.now(), // Temporary ID until Clerk integration
        email: body.email,
        full_name: body.full_name,
        role: body.role || 'employee',
        company_id: context.companyId, // Automatically assign to manager's company
        invited_by: userId,
        invited_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Employee POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update employee (manager only)
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    // Only managers can update employees
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can update employees' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('fc_users')
      .update({
        email: body.email,
        full_name: body.full_name,
        role: body.role
      })
      .eq('id', id)
      .eq('company_id', context.companyId) // Ensure same company
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Employee PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete employee (manager only)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    // Only managers can delete employees
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can delete employees' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('fc_users')
      .delete()
      .eq('id', id)
      .eq('company_id', context.companyId) // Ensure same company

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Employee DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
