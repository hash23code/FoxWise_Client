'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Mail,
  MessageSquare,
  Settings,
  Building2
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
  { name: 'Secteurs', href: '/dashboard/sectors', icon: Building2 },
  { name: 'Employés', href: '/dashboard/employees', icon: Users },
  { name: 'Calendrier', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Paiements', href: '/dashboard/payments', icon: DollarSign },
  { name: 'Emails', href: '/dashboard/emails', icon: Mail },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-orange-600 to-red-600">
      <div className="flex h-16 items-center justify-center border-b border-white/20">
        <h1 className="text-2xl font-bold text-white">🦊 FoxWise Client</h1>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all
                ${isActive
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'text-white hover:bg-white/10'
                }
              `}
            >
              <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-orange-600' : 'text-white'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/20 p-4">
        <div className="flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10'
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Mon Compte</p>
            <p className="text-xs text-white/70">Manager</p>
          </div>
        </div>
      </div>
    </div>
  )
}
