'use client'

import { useEffect, useState, useRef } from 'react'
import { Send, Mic, Users, MessageSquare, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface ChatMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_color?: string
  content: string
  message_type: 'text' | 'voice'
  created_at: string
}

interface ChatRoom {
  id: string
  name: string
  type: string
  member_count?: number
}

export default function ChatPage() {
  const { user } = useUser()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id)
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedRoom.id)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedRoom])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/chat/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
        // Auto-select first room (usually company-wide chat)
        if (data.length > 0 && !selectedRoom) {
          setSelectedRoom(data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?room_id=${roomId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || !selectedRoom) return

    setSending(true)

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          content: message,
          message_type: 'text'
        })
      })

      if (res.ok) {
        setMessage('')
        await fetchMessages(selectedRoom.id)
      } else {
        const error = await res.json()
        alert('Error: ' + (error.error || 'Failed to send message'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    } finally {
      setSending(false)
    }
  }

  const handleVoiceRecord = () => {
    // Voice recording functionality to be implemented
    alert('Voice messaging coming soon! 🎤')
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">No Chat Rooms</h2>
          <p className="text-gray-400">Chat rooms will be created automatically for your company</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Rooms Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Team Chat</h1>
            <p className="text-gray-400 mt-1">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  selectedRoom?.id === room.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-600/20 border-2 border-purple-500/50'
                    : 'bg-gray-900 border-2 border-gray-800 hover:border-purple-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    room.type === 'company'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                  }`}>
                    {room.type === 'company' ? (
                      <Users className="w-6 h-6 text-white" />
                    ) : (
                      <MessageSquare className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{room.name}</div>
                    <div className="text-sm text-gray-400 capitalize">{room.type}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col bg-gray-900 border-2 border-gray-800 rounded-xl overflow-hidden h-full">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedRoom.name}</h2>
                    <p className="text-sm text-gray-400 mt-1 capitalize">{selectedRoom.type} chat</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">{selectedRoom.member_count || '...'} members</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-400">No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.sender_id === user?.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{
                            backgroundColor: msg.sender_color || '#6366F1',
                            boxShadow: `0 0 15px ${msg.sender_color || '#6366F1'}40`
                          }}
                        >
                          {msg.sender_name?.charAt(0).toUpperCase() || '?'}
                        </div>

                        {/* Message Content */}
                        <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-300">{msg.sender_name}</span>
                              <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                isOwnMessage
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                                  : 'bg-gray-800 text-gray-100'
                              }`}
                            >
                              {msg.message_type === 'text' ? (
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Mic className="w-4 h-4" />
                                  <span>Voice message</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-800">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage(e)
                        }
                      }}
                      placeholder="Type your message... (Shift+Enter for new line)"
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVoiceRecord}
                    className="p-4 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 hover:text-white transition-colors"
                    title="Voice message (coming soon)"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || sending}
                    className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {sending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">Select a room to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
