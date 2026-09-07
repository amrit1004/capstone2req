import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus, Stethoscope, FlaskConical, Briefcase, Shield, CheckCircle } from 'lucide-react'
import { Card, Button, Badge } from '../components/Card'
import { login as loginApi, register as registerApi } from '../api'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { id: 'clinician', label: 'Clinician', icon: Stethoscope, description: 'Patient care focus' },
  { id: 'medical_scientist', label: 'Medical Scientist', icon: FlaskConical, description: 'Scientific evidence focus' },
  { id: 'commercial', label: 'Commercial', icon: Briefcase, description: 'Market positioning focus' },
  { id: 'admin', label: 'Admin', icon: Shield, description: 'Full access to all features' },
]

function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('clinician')
  const [isEvaluator, setIsEvaluator] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const res = await loginApi({ email, password })
        login(res.data.user)
        navigate('/')
      } else {
        await registerApi({ name, email, password, role, is_evaluator: isEvaluator })
        // Auto login after register
        const res = await loginApi({ email, password })
        login(res.data.user)
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Medical Insights</h1>
          <p className="text-slate-400 mt-1">AI-Driven Analysis Engine</p>
        </div>

        <Card className="bg-slate-800/50 backdrop-blur border-slate-700">
          {/* Tabs */}
          <div className="flex mb-6 bg-slate-700/50 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                isLogin ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                !isLogin ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-700/50 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Enter password"
              />
            </div>

            {!isLogin && (
              <>
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select Your Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => {
                      const Icon = r.icon
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            role === r.id
                              ? 'border-primary-500 bg-primary-500/20'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-1 ${role === r.id ? 'text-primary-400' : 'text-slate-400'}`} />
                          <p className={`text-sm font-medium ${role === r.id ? 'text-white' : 'text-slate-300'}`}>
                            {r.label}
                          </p>
                          <p className="text-xs text-slate-500">{r.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Evaluator Checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-600 cursor-pointer hover:border-slate-500 transition-all">
                  <input
                    type="checkbox"
                    checked={isEvaluator}
                    onChange={(e) => setIsEvaluator(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-500 text-primary-500 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      I am an Evaluator
                    </p>
                    <p className="text-xs text-slate-400">Can approve and correct AI-generated tags</p>
                  </div>
                </label>
              </>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Login
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-slate-500 text-sm mt-6">
          Medical Insights Engine - Capstone Project
        </p>
      </div>
    </div>
  )
}

export default Login
