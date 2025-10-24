"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Mail,
  MessageSquare,
  Settings,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "Clients",
      href: "/clients",
      icon: Users,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      name: "Jobs",
      href: "/jobs",
      icon: Briefcase,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      name: "Activités",
      href: "/activities",
      icon: Briefcase,
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      name: "Secteurs",
      href: "/sectors",
      icon: Building2,
      gradient: "from-orange-500 to-red-500"
    },
    {
      name: "Employés",
      href: "/employees",
      icon: Users,
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      name: "Calendrier",
      href: "/calendar",
      icon: Calendar,
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      name: "Paiements",
      href: "/payments",
      icon: DollarSign,
      gradient: "from-teal-500 to-cyan-500"
    },
    {
      name: "Emails",
      href: "/emails",
      icon: Mail,
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      name: "Chat",
      href: "/chat",
      icon: MessageSquare,
      gradient: "from-pink-500 to-purple-500"
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
      gradient: "from-gray-500 to-slate-500"
    },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <Link href="/" className="p-4 sm:p-6 border-b border-gray-800 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
        <Image
          src="/logo.png"
          alt="FoxWise Client"
          width={140}
          height={140}
          className="object-contain"
          priority
        />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.name}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Link href={item.href}>
                <div
                  className={`
                    flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">{item.name}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 sm:p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
          <UserButton afterSignOutUrl="/sign-in" />
          <span className="text-sm text-gray-400">Mon Compte</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 border border-gray-700 text-white hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Desktop Sidebar - Always visible on large screens */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-black border-r border-gray-800 flex-col"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar - Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-gray-900 via-gray-900 to-black border-r border-gray-700 flex flex-col z-50 shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
