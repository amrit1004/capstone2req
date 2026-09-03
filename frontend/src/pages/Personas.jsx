import React, { useState, useEffect } from 'react'
import { Users, Stethoscope, FlaskConical, Briefcase, Sparkles } from 'lucide-react'
import { Card, Badge, Button } from '../components/Card'
import { getInsights, getPersonaSummaries, generatePersonaSummaries, generateAllPersonas } from '../api'

const personaConfig = {
  clinician: { icon: Stethoscope, color: 'from-emerald-500 to-teal-600', label: 'Clinician' },
  medical_scientist: { icon: FlaskConical, color: 'from-primary-500 to-purple-600', label: 'Medical Scientist' },
  commercial: { icon: Briefcase, color: 'from-orange-500 to-amber-600', label: 'Commercial' },
}

function Personas() {
  const [insights, setInsights] = useState([])
  const [selectedInsight, setSelectedInsight] = useState('')
  const [summaries, setSummaries] = useState(null)
  const [originalText, setOriginalText] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [batchLimit, setBatchLimit] = useState('')

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
      const res = await generateAllPersonas(limit)
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

      {/* Persona Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(personaConfig).map(([key, config]) => {
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
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600 dark:text-slate-400">Limit:</label>
            <input
              type="number"
              value={batchLimit}
              onChange={(e) => setBatchLimit(e.target.value)}
              placeholder="All"
              min="1"
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
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
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={selectedInsight}
            onChange={(e) => setSelectedInsight(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {insights.map((insight) => (
              <option key={insight.insight_id} value={insight.insight_id}>
                {insight.insight_id} - {insight.disease_state}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(personaConfig).map(([key, config]) => {
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
