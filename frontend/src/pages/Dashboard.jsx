import React, { useState, useEffect } from 'react'
import { LayoutDashboard, FileText, Tags, CheckCircle, Clock } from 'lucide-react'
import { Card, MetricCard, Badge } from '../components/Card'
import { getSummary, getInsights } from '../api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [summaryRes, insightsRes] = await Promise.all([
        getSummary(),
        getInsights()
      ])
      setSummary(summaryRes.data)
      setInsights(insightsRes.data.insights || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const pieData = summary?.si_distribution
    ? Object.entries(summary.si_distribution).map(([name, value]) => ({ name: name.slice(0, 30), value }))
    : []

  const areaData = insights.reduce((acc, insight) => {
    const area = insight.therapeutic_area
    acc[area] = (acc[area] || 0) + 1
    return acc
  }, {})
  const barData = Object.entries(areaData).map(([name, count]) => ({ name, count }))


  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">Overview of your medical insights and AI tagging progress</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          label="Total Insights"
          value={summary?.total_insights || 0}
          icon={FileText}
          color="primary"
        />
        <MetricCard
          label="Tagged"
          value={summary?.tagged_insights || 0}
          icon={Tags}
          color="blue"
        />
        <MetricCard
          label="Verified"
          value={summary?.verified_tags || 0}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          label="Pending Review"
          value={summary?.unverified_tags || 0}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Distribution by Strategic Imperative
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              No tags generated yet
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Insights by Therapeutic Area
          </h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              No insights loaded
            </div>
          )}
        </Card>
      </div>

      {/* Recent Insights Table */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Insights</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Therapeutic Area</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Disease</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Country</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {insights.slice(0, 10).map((insight, idx) => (
                <tr key={insight.insight_id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{insight.insight_id}</td>
                  <td className="py-3 px-4">
                    <Badge variant="primary">{insight.therapeutic_area}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">{insight.disease_state}</td>
                  <td className="py-3 px-4">
                    <Badge variant="default">{insight.country_code}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                    {insight.created_date?.split(' ')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
