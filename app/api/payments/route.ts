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

    // Get company context for multi-tenant isolation
    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found or no company assigned' }, { status: 403 })
    }

    // Fetch all clients for the company
    const { data: clients, error: clientsError } = await supabase
      .from('fc_clients')
      .select('*')
      .eq('company_id', context.companyId)
      .order('name', { ascending: true })

    if (clientsError) throw clientsError

    // Fetch all jobs for these clients to calculate payment data
    const { data: jobs, error: jobsError } = await supabase
      .from('fc_jobs')
      .select('client_id, estimated_cost, actual_cost, payment_status, amount_paid')
      .eq('company_id', context.companyId)

    if (jobsError) throw jobsError

    // Calculate payment statistics for each client
    const clientsWithPayments = clients.map(client => {
      const clientJobs = jobs?.filter(job => job.client_id === client.id) || []

      const total_jobs = clientJobs.length
      const total_revenue = clientJobs.reduce((sum, job) => {
        return sum + (job.actual_cost || job.estimated_cost || 0)
      }, 0)

      const paid_amount = clientJobs.reduce((sum, job) => {
        return sum + (job.amount_paid || 0)
      }, 0)

      const pending_amount = total_revenue - paid_amount

      // Determine payment status
      let payment_status: 'paid' | 'partial' | 'unpaid'
      if (total_revenue === 0) {
        payment_status = 'unpaid'
      } else if (paid_amount === 0) {
        payment_status = 'unpaid'
      } else if (paid_amount >= total_revenue) {
        payment_status = 'paid'
      } else {
        payment_status = 'partial'
      }

      return {
        ...client,
        total_jobs,
        total_revenue,
        paid_amount,
        pending_amount,
        payment_status
      }
    })

    return NextResponse.json(clientsWithPayments)
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
