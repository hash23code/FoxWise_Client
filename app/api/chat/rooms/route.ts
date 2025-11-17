// @ts-nocheck
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { getCompanyContext } from '@/lib/company-context'

// GET - Fetch chat rooms for the user's company
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

    // Fetch rooms where user is a member
    const { data: memberRooms, error: memberError } = await supabase
      .from('fc_chat_room_members')
      .select('room_id')
      .eq('user_id', userId)

    if (memberError) throw memberError

    const roomIds = memberRooms?.map(m => m.room_id) || []

    if (roomIds.length === 0) {
      return NextResponse.json([])
    }

    // Fetch room details
    const { data: rooms, error: roomsError } = await supabase
      .from('fc_chat_rooms')
      .select('*')
      .in('id', roomIds)
      .eq('company_id', context.companyId)
      .order('created_at', { ascending: true })

    if (roomsError) throw roomsError

    // Get member count for each room
    const roomsWithCounts = await Promise.all(
      (rooms || []).map(async (room) => {
        const { count } = await supabase
          .from('fc_chat_room_members')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id)

        return {
          ...room,
          member_count: count || 0
        }
      })
    )

    return NextResponse.json(roomsWithCounts)
  } catch (error) {
    console.error('Chat rooms GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
