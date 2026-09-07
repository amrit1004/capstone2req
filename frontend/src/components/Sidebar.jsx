import { NavLink, useNavigate } from 'react-router-dom'
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
  Dna,
  BrainCircuit,
  LogOut,
  User
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tagging', icon: Tags, label: 'Taxonomy Tagging' },
  { path: '/review', icon: CheckCircle, label: 'Review & Correct' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/personas', icon: Users, label: 'Personas' },
  { path: '/rag', icon: BrainCircuit, label: 'RAG Assistant' },
  { path: '/metrics', icon: BarChart3, label: 'Metrics' },
]

function Sidebar({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleLabel = (role) => {
    const labels = {
      clinician: 'Clinician',
      medical_scientist: 'Med Scientist',
      commercial: 'Commercial',
      admin: 'Admin'
    }
    return labels[role] || role
  }

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
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 hover:translate-x-1'
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
        {/* User info */}
        {user && sidebarOpen && (
          <div className="mb-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {getRoleLabel(user.role)}
                  {user.is_evaluator && ' | Evaluator'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 hover:translate-x-1"
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

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 hover:translate-x-1"
        >
          <LogOut className={`w-5 h-5 flex-shrink-0 ${!sidebarOpen && 'mx-auto'}`} />
          {sidebarOpen && (
            <span className="font-medium text-sm animate-fade-in">Logout</span>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all duration-300 mt-1"
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
