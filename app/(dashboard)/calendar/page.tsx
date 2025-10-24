'use client'

import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, User, Briefcase, Filter, List, Grid } from 'lucide-react'
import type { CalendarEvent, Employee } from '@/types'

type ViewMode = 'month' | 'list'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployee])

  const fetchData = async () => {
    try {
      const employeesRes = await fetch('/api/employees')
      if (employeesRes.ok) {
        setEmployees(await employeesRes.json())
      }

      // Fetch calendar events
      const url = selectedEmployee === 'all'
        ? '/api/calendar'
        : `/api/calendar?assigned_to=${selectedEmployee}`

      const eventsRes = await fetch(url)
      if (eventsRes.ok) {
        setEvents(await eventsRes.json())
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calendar utilities
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return events.filter(event => {
      const eventDate = new Date(event.start_time)
      return eventDate.getDate() === day &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear()
    })
  }

  const getEventColor = (event: CalendarEvent) => {
    if (event.event_type === 'job') {
      if (event.job?.status === 'completed') return 'bg-green-500/20 text-green-400'
      if (event.job?.priority === 'urgent') return 'bg-red-500/20 text-red-400'
      if (event.job?.priority === 'high') return 'bg-orange-500/20 text-orange-400'
      return 'bg-blue-500/20 text-blue-400'
    }
    return 'bg-purple-500/20 text-purple-400'
  }

  const renderCalendarDays = () => {
    const days = []
    const totalDays = daysInMonth(currentDate)
    const firstDay = firstDayOfMonth(currentDate)

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square p-2" />)
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const dayEvents = getEventsForDay(day)
      const isToday = day === new Date().getDate() &&
                     currentDate.getMonth() === new Date().getMonth() &&
                     currentDate.getFullYear() === new Date().getFullYear()

      days.push(
        <div
          key={day}
          className={`aspect-square p-2 border border-gray-800 rounded-lg ${
            isToday ? 'bg-orange-500/10 border-orange-500/50' : ''
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${
            isToday ? 'text-orange-400' : 'text-white'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs px-2 py-1 rounded truncate ${getEventColor(event)}`}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-400 px-2">
                +{dayEvents.length - 2} plus
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendrier</h1>
          <p className="text-gray-400 mt-1">{events.length} événement{events.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tous les employés</option>
            {employees.filter(e => e.role === 'employee').map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name || employee.email}
              </option>
            ))}
          </select>

          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('month')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'month' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendarDays()}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).map(event => {
            const employee = employees.find(e => e.id === event.assigned_to)
            return (
              <div
                key={event.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEventColor(event)}`}>
                        {event.event_type === 'job' ? 'Job' : 'Événement'}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-gray-400 text-sm mb-3">{event.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(event.start_time).toLocaleDateString('fr-FR')}</span>
                        <span>{new Date(event.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {employee && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{employee.full_name || employee.email}</span>
                        </div>
                      )}

                      {event.client && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{event.client.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {events.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">Aucun événement</h2>
              <p className="text-gray-400">
                Les jobs assignés apparaîtront automatiquement ici
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
