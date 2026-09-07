import React, { useState, useEffect, useMemo } from 'react'
import { Users, Stethoscope, FlaskConical, Briefcase, Sparkles, Search, Shield } from 'lucide-react'
import { Card, Badge, Button } from '../components/Card'
import { getInsights, getPersonaSummaries, generatePersonaSummaries, generateAllPersonas } from '../api'
import { useAuth } from '../context/AuthContext'

const personaConfig = {
  clinician: { icon: Stethoscope, color: 'from-emerald-500 to-teal-600', label: 'Clinician' },
  medical_scientist: { icon: FlaskConical, color: 'from-primary-500 to-purple-600', label: 'Medical Scientist' },
  commercial: { icon: Briefcase, color: 'from-orange-500 to-amber-600', label: 'Commercial' },
}

function Personas() {
  const { user, role } = useAuth()

  // Filter personas based on user role (admin sees all)
  const visiblePersonas = useMemo(() => {
    if (role === 'admin') {
      return Object.entries(personaConfig)
    }
    // Show only user's role persona
    if (role && personaConfig[role]) {
      return [[role, personaConfig[role]]]
    }
    return Object.entries(personaConfig)
  }, [role])
  const [insights, setInsights] = useState([])
  const [selectedInsight, setSelectedInsight] = useState('')
  const [summaries, setSummaries] = useState(null)
  const [originalText, setOriginalText] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [batchLimit, setBatchLimit] = useState('')
  const [skipGenerated, setSkipGenerated] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [insightPage, setInsightPage] = useState(0)
  const insightsPerPage = 20

  // Sort insights by ID and filter by search query
  const allFilteredInsights = useMemo(() => {
    let sorted = [...insights].sort((a, b) =>
      a.insight_id.localeCompare(b.insight_id)
    )
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      sorted = sorted.filter(i =>
        i.insight_id.toLowerCase().includes(query) ||
        (i.disease_state || '').toLowerCase().includes(query) ||
        (i.therapeutic_area || '').toLowerCase().includes(query)
      )
    }
    return sorted
  }, [insights, searchQuery])

  // Paginate filtered insights
  const filteredInsights = useMemo(() => {
    const start = insightPage * insightsPerPage
    return allFilteredInsights.slice(start, start + insightsPerPage)
  }, [allFilteredInsights, insightPage])

  const totalInsightPages = Math.ceil(allFilteredInsights.length / insightsPerPage)

  // Reset page when search changes
  useEffect(() => {
    setInsightPage(0)
  }, [searchQuery])

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      const res = await getInsights()
      setInsights(res.data.insights || [])
      if (res.data.insights?.length > 0) {
        setSelectedInsight(res.data.insights[0].insight_id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSummaries = async () => {
    setGenerating(true)
    setSummaries(null)
    try {
      const res = await getPersonaSummaries(selectedInsight)
      setSummaries(res.data.summaries || {})
      setOriginalText(res.data.original_text || '')
    } catch (error) {
      console.error('Error:', error)
      // Try generating if not found
      try {
        const genRes = await generatePersonaSummaries(selectedInsight)
        setSummaries(genRes.data.summaries || {})
        const insight = insights.find(i => i.insight_id === selectedInsight)
        setOriginalText(insight?.description || '')
      } catch (genError) {
        console.error('Error generating:', genError)
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateAll = async () => {
    setGeneratingAll(true)
    try {
      const limit = batchLimit ? parseInt(batchLimit) : null
      const res = await generateAllPersonas(limit, skipGenerated)
      alert(`Generated summaries for ${res.data.results.success} insights`)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setGeneratingAll(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Persona Summaries</h1>
        <p className="text-slate-500 dark:text-slate-400">View insights tailored for different audiences</p>
      </div>

      {/* Role Info Banner */}
      {role !== 'admin' && (
        <Card className="mb-6 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary-500" />
            <p className="text-sm text-slate-700 dark:text-slate-300">
              You are viewing as <span className="font-semibold">{personaConfig[role]?.label || role}</span>.
              Only your role's persona summary is shown.
            </p>
          </div>
        </Card>
      )}

      {/* Persona Cards */}
      <div className={`grid grid-cols-1 ${visiblePersonas.length > 1 ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-md'} gap-6 mb-8`}>
        {visiblePersonas.map(([key, config]) => {
          const Icon = config.icon
          return (
            <Card key={key} hover>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{config.label}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {key === 'clinician' && 'Patient care focus'}
                    {key === 'medical_scientist' && 'Scientific evidence focus'}
                    {key === 'commercial' && 'Market positioning focus'}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Generate All */}
      <Card className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Batch Generation</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Generate persona summaries</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-slate-600 dark:text-slate-400">Limit:</label>
            <input
              type="number"
              value={batchLimit}
              onChange={(e) => setBatchLimit(e.target.value)}
              placeholder="All"
              min="1"
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipGenerated}
                onChange={(e) => setSkipGenerated(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Skip generated</span>
            </label>
            <Button onClick={handleGenerateAll} loading={generatingAll}>
              <Sparkles className="w-4 h-4" />
              Generate
            </Button>
          </div>
        </div>
      </Card>

      {/* View Summaries */}
      <Card className="mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">View Persona Summaries</h3>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or disease..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400">
            Showing {insightPage * insightsPerPage + 1}-{Math.min((insightPage + 1) * insightsPerPage, allFilteredInsights.length)} of {allFilteredInsights.length} insights
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setInsightPage(p => Math.max(0, p - 1))}
              disabled={insightPage === 0}
              className="px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              Prev
            </button>
            <span className="text-xs text-slate-500 px-2">{insightPage + 1}/{totalInsightPages || 1}</span>
            <button
              onClick={() => setInsightPage(p => Math.min(totalInsightPages - 1, p + 1))}
              disabled={insightPage >= totalInsightPages - 1}
              className="px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <select
            value={selectedInsight}
            onChange={(e) => setSelectedInsight(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {filteredInsights.map((insight) => (
              <option key={insight.insight_id} value={insight.insight_id}>
                {insight.insight_id} - {insight.disease_state || insight.therapeutic_area}
              </option>
            ))}
          </select>
          <Button onClick={handleViewSummaries} loading={generating}>
            <Users className="w-4 h-4" />
            View Summaries
          </Button>
        </div>
      </Card>

      {/* Summaries Display */}
      {summaries && (
        <div className="space-y-6">
          {/* Original Text */}
          <Card>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Original Insight</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
              {originalText}
            </p>
          </Card>

          {/* Persona Summaries */}
          <div className={`grid grid-cols-1 ${visiblePersonas.length > 1 ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-2xl'} gap-6`}>
            {visiblePersonas.map(([key, config]) => {
              const Icon = config.icon
              const summary = summaries[key]
              return (
                <Card key={key} className={`border-t-4 border-gradient`} style={{ borderTopColor: key === 'clinician' ? '#10b981' : key === 'medical_scientist' ? '#6366f1' : '#f59e0b' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{config.label}</h4>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {summary?.summary || 'No summary generated yet'}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Personas
