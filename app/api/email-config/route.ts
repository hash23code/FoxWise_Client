// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyContext } from '@/lib/company-context'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key pour appeler les fonctions RPC
)

/**
 * GET /api/email-config
 * Récupère la configuration email de l'entreprise
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 })
    }

    // Récupérer la configuration email (sans le mot de passe déchiffré pour la sécurité)
    const { data, error } = await supabase
      .from('fc_email_credentials')
      .select('id, provider, smtp_host, smtp_port, smtp_user, from_email, from_name, is_verified')
      .eq('company_id', context.companyId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching email config:', error)
      return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ configured: false })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Email config GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/**
 * POST /api/email-config
 * Sauvegarde la configuration email de l'entreprise
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const context = await getCompanyContext(userId)
    if (!context) {
      return NextResponse.json({ error: 'User not found' }, { status: 403 })
    }

    // Seulement les managers peuvent modifier
    if (context.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can configure email' }, { status: 403 })
    }

    const body = await request.json()
    const {
      provider,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      from_email,
      from_name
    } = body

    // Validation
    if (!smtp_user || !smtp_password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!provider || !smtp_host || !smtp_port) {
      return NextResponse.json({ error: 'Provider, host and port are required' }, { status: 400 })
    }

    // Appeler la fonction Supabase qui chiffre le mot de passe
    const { data, error } = await supabase.rpc('fc_save_email_credential', {
      p_company_id: context.companyId,
      p_provider: provider,
      p_smtp_host: smtp_host,
      p_smtp_port: smtp_port,
      p_smtp_user: smtp_user,
      p_smtp_password: smtp_password, // Sera chiffré par la fonction
      p_from_email: from_email || smtp_user,
      p_from_name: from_name || ''
    })

    if (error) {
      console.error('Error saving email config:', error)
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully'
    })
  } catch (error) {
    console.error('Email config POST error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
