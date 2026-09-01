import React, { useState, useEffect } from 'react'
import { BarChart3, Target, CheckCircle, Edit3, TrendingUp } from 'lucide-react'
import { Card, MetricCard, Badge } from '../components/Card'
import { getMetrics } from '../api'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

function Metrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const res = await getMetrics()
      setMetrics(res.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const precision = metrics?.precision || 0
  const gaugeData = [
    { name: 'Precision', value: precision },
    { name: 'Remaining', value: 100 - precision },
  ]
  const gaugeColors = ['#6366f1', '#1e293b']

  const getPrecisionColor = () => {
    if (precision >= 80) return 'text-emerald-500'
    if (precision >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Accuracy Metrics</h1>
        <p className="text-slate-500 dark:text-slate-400">Track AI tagging performance based on human review</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="Total Tagged"
          value={metrics?.total_tagged || 0}
          icon={Target}
          color="primary"
        />
        <MetricCard
          label="Verified"
          value={metrics?.total_verified || 0}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          label="Corrections"
          value={metrics?.total_corrections || 0}
          icon={Edit3}
          color="orange"
        />
        <Card hover>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Precision</p>
              <p className={`text-3xl font-bold ${getPrecisionColor()}`}>
                {precision.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Precision Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Precision Score</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={gaugeColors[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-40px' }}>
              <div className="text-center">
                <span className={`text-4xl font-bold ${getPrecisionColor()}`}>{precision.toFixed(1)}%</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">Accuracy</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-500">{"< 60%"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-slate-500">60-80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-500">{"> 80%"}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Formula</h3>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 mb-6">
            <p className="text-center text-lg font-mono text-slate-700 dark:text-slate-300">
              Precision = <span className="text-primary-500">(Verified - Corrections)</span> / Verified × 100%
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Verified Tags</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tags reviewed by humans</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Edit3 className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Corrections</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tags modified during review</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Precision</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">% of correct AI predictions</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Analysis Notes */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Analysis Notes</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">Document patterns in AI errors for your deliverable report</p>
        <textarea
          placeholder="e.g., The AI tends to confuse SI-02 and SI-04 when insights mention both access barriers and competitive differentiation..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
          rows={4}
        />
      </Card>
    </div>
  )
}

export default Metrics
