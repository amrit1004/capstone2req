import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Tags,
  CheckCircle,
  Search,
  Users,
  BarChart3,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Dna
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tagging', icon: Tags, label: 'Taxonomy Tagging' },
  { path: '/review', icon: CheckCircle, label: 'Review & Correct' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/personas', icon: Users, label: 'Personas' },
  { path: '/metrics', icon: BarChart3, label: 'Metrics' },
]

function Sidebar({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-50 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Dna className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-slate-900 dark:text-white">Medical Insights</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI Engine</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`
            }
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${!sidebarOpen && 'mx-auto'}`} />
            {sidebarOpen && (
              <span className="font-medium text-sm animate-fade-in">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 dark:border-slate-700">
        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
        >
          {darkMode ? (
            <Sun className={`w-5 h-5 flex-shrink-0 ${!sidebarOpen && 'mx-auto'}`} />
          ) : (
            <Moon className={`w-5 h-5 flex-shrink-0 ${!sidebarOpen && 'mx-auto'}`} />
          )}
          {sidebarOpen && (
            <span className="font-medium text-sm animate-fade-in">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200 mt-1"
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">Collapse</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5 mx-auto" />
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
