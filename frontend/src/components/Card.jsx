import React from 'react'

export function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-all duration-300 ${
        hover ? 'hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 hover:border-primary-300 dark:hover:border-primary-600 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function MetricCard({ label, value, icon: Icon, trend, color = 'primary' }) {
  const colorClasses = {
    primary: 'from-primary-500 to-purple-600',
    green: 'from-emerald-500 to-teal-600',
    orange: 'from-orange-500 to-amber-600',
    blue: 'from-blue-500 to-cyan-600',
  }

  return (
    <Card hover className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {value}
          </p>
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  )
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, loading = false, className = '' }) {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-1 hover:from-primary-600 hover:to-purple-700 active:translate-y-0 active:shadow-md',
    secondary: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:shadow-lg hover:-translate-y-0.5 border border-transparent hover:border-slate-300 dark:hover:border-slate-500',
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-primary-600 dark:hover:text-primary-400',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-1 hover:from-red-600 hover:to-rose-700',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 hover:from-emerald-600 hover:to-teal-700',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
