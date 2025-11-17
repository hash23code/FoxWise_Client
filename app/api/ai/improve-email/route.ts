// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// This endpoint uses OpenAI to improve email text
// You'll need to add OPENAI_API_KEY to environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, type } = body

    if (!text || !type) {
      return NextResponse.json({ error: 'Text and type are required' }, { status: 400 })
    }

    if (!['subject', 'body'].includes(type)) {
      return NextResponse.json({ error: 'Type must be "subject" or "body"' }, { status: 400 })
    }

    // If OpenAI is configured, use it to improve the text
    if (OPENAI_API_KEY) {
      try {
        const prompt = type === 'subject'
          ? `Improve this email subject line to be more professional, engaging, and clear. Keep it concise (under 60 characters). Return ONLY the improved subject line, no quotes or explanations:\n\n${text}`
          : `Improve this email body to be more professional, clear, and engaging while maintaining the original message and intent. Fix any grammar or spelling errors. Return ONLY the improved email body, no additional explanations:\n\n${text}`

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional email writing assistant. You improve email text to be more professional and engaging while preserving the original intent.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: type === 'subject' ? 50 : 500
          })
        })

        if (!response.ok) {
          throw new Error('OpenAI API failed')
        }

        const data = await response.json()
        const improved = data.choices[0]?.message?.content?.trim() || text

        return NextResponse.json({
          success: true,
          improved
        })
      } catch (error) {
        console.error('OpenAI API error:', error)
        return NextResponse.json({
          error: 'Failed to improve text via AI. Please check OpenAI configuration.',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    } else {
      // OpenAI not configured - return a simple improvement
      // In production, you would prompt user to configure OpenAI
      const simpleImproved = type === 'subject'
        ? text.charAt(0).toUpperCase() + text.slice(1) + (text.endsWith('.') || text.endsWith('!') || text.endsWith('?') ? '' : '.')
        : text.split('\n').map((line: string) => line.charAt(0).toUpperCase() + line.slice(1)).join('\n\n')

      return NextResponse.json({
        success: true,
        improved: simpleImproved,
        warning: 'OpenAI not configured. Please set OPENAI_API_KEY environment variable for AI-powered improvements.'
      })
    }
  } catch (error) {
    console.error('Improve email error:', error)
    return NextResponse.json({
      error: 'Failed to improve text',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
