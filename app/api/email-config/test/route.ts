// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyContext } from '@/lib/company-context'
import nodemailer from 'nodemailer'

/**
 * POST /api/email-config/test
 * Teste la configuration SMTP en envoyant un email de test
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
    if (!smtp_host || !smtp_port || !smtp_user || !smtp_password) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    try {
      // Créer un transporteur nodemailer
      const transporter = nodemailer.createTransport({
        host: smtp_host,
        port: smtp_port,
        secure: smtp_port === 465, // true for 465, false for other ports
        auth: {
          user: smtp_user,
          pass: smtp_password,
        },
        // Pour Gmail, on peut avoir besoin de ça
        ...(provider === 'gmail' && {
          service: 'gmail',
        }),
      })

      // Vérifier la connexion
      await transporter.verify()

      // Envoyer un email de test
      const testEmail = await transporter.sendMail({
        from: from_email || smtp_user,
        to: smtp_user, // Envoyer à soi-même
        subject: '✅ FoxWise - Test de configuration email',
        text: `Bonjour,

Ce message confirme que votre configuration email fonctionne correctement!

Vous pouvez maintenant envoyer des factures et des campagnes depuis FoxWise.

Détails de configuration:
- Provider: ${provider}
- Serveur SMTP: ${smtp_host}:${smtp_port}
- Email: ${smtp_user}

L'équipe FoxWise 🦊`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0;">✅ Configuration Email Réussie!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #374151;">Bonjour,</p>

              <p style="font-size: 16px; color: #374151;">
                Ce message confirme que votre configuration email fonctionne correctement!
              </p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                <p style="margin: 0; color: #059669; font-weight: bold;">✓ Vous pouvez maintenant envoyer des factures et des campagnes depuis FoxWise.</p>
              </div>

              <h3 style="color: #374151; margin-top: 30px;">Détails de configuration:</h3>
              <ul style="color: #6b7280;">
                <li>Provider: <strong>${provider}</strong></li>
                <li>Serveur SMTP: <strong>${smtp_host}:${smtp_port}</strong></li>
                <li>Email: <strong>${smtp_user}</strong></li>
              </ul>

              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                L'équipe FoxWise 🦊
              </p>
            </div>
          </div>
        `,
      })

      // Marquer comme vérifié dans la base de données
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabase.rpc('fc_mark_email_credential_tested', {
        p_company_id: context.companyId,
        p_success: true,
        p_error: null
      })

      return NextResponse.json({
        success: true,
        message: `Email de test envoyé avec succès à ${smtp_user}`,
        messageId: testEmail.messageId
      })

    } catch (smtpError: any) {
      console.error('SMTP test error:', smtpError)

      // Marquer comme échoué dans la base de données
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabase.rpc('fc_mark_email_credential_tested', {
        p_company_id: context.companyId,
        p_success: false,
        p_error: smtpError.message
      })

      // Messages d'erreur en français
      let errorMessage = 'Erreur de connexion SMTP'

      if (smtpError.code === 'EAUTH') {
        errorMessage = 'Email ou mot de passe incorrect. Pour Gmail, utilisez un "Mot de passe d\'application".'
      } else if (smtpError.code === 'ECONNECTION') {
        errorMessage = 'Impossible de se connecter au serveur SMTP. Vérifiez le serveur et le port.'
      } else if (smtpError.code === 'ETIMEDOUT') {
        errorMessage = 'Délai de connexion dépassé. Vérifiez votre connexion internet.'
      } else if (smtpError.message) {
        errorMessage = smtpError.message
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Email test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Server error'
    }, { status: 500 })
  }
}
