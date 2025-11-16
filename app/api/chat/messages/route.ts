import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getCompanyContext } from '@/lib/company-context'

// GET - Fetch messages for a chat room
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
    const room_id = searchParams.get('room_id')

    if (!room_id) {
      return NextResponse.json({ error: 'room_id is required' }, { status: 400 })
    }

    // Verify user is a member of this room
    const { data: membership } = await supabase
      .from('fc_chat_room_members')
      .select('*')
      .eq('room_id', room_id)
      .eq('user_id', userId)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('fc_chat_messages')
      .select('*')
      .eq('room_id', room_id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error

    // Enrich messages with sender information
    const messagesWithSenders = await Promise.all(
      (messages || []).map(async (msg) => {
        const { data: sender } = await supabase
          .from('fc_users')
          .select('full_name, email, color')
          .eq('clerk_user_id', msg.sender_id)
          .single()

        return {
          ...msg,
          sender_name: sender?.full_name || sender?.email || 'Unknown',
          sender_color: sender?.color
        }
      })
    )

    return NextResponse.json(messagesWithSenders)
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Send a message to a chat room
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { room_id, content, message_type } = body

    if (!room_id || !content) {
      return NextResponse.json({ error: 'room_id and content are required' }, { status: 400 })
    }

    // Verify user is a member of this room
    const { data: membership } = await supabase
      .from('fc_chat_room_members')
      .select('*')
      .eq('room_id', room_id)
      .eq('user_id', userId)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 })
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('fc_chat_messages')
      .insert([{
        room_id,
        sender_id: userId,
        content,
        message_type: message_type || 'text',
        is_deleted: false
      }])
      .select()
      .single()

    if (error) throw error

    // Get sender information
    const { data: sender } = await supabase
      .from('fc_users')
      .select('full_name, email, color')
      .eq('clerk_user_id', userId)
      .single()

    const enrichedMessage = {
      ...message,
      sender_name: sender?.full_name || sender?.email || 'Unknown',
      sender_color: sender?.color
    }

    return NextResponse.json(enrichedMessage, { status: 201 })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
