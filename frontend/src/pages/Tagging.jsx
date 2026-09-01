import React, { useState, useEffect } from 'react'
import { Tags, Zap, Target, Brain, CheckCircle2, Package, MessageSquare, Lightbulb, Users, Radio, FileSearch, AlertCircle } from 'lucide-react'
import { Card, Badge, Button } from '../components/Card'
import { getInsights, getTags, tagSingle, tagBatch } from '../api'

const LABEL_CONFIG = [
  { key: 'asset', label: 'Asset', icon: Package, color: 'primary' },
  { key: 'sentiment', label: 'Sentiment', icon: MessageSquare, color: 'green' },
  { key: 'insight_type', label: 'Insight Type', icon: Lightbulb, color: 'orange' },
  { key: 'topic', label: 'Topic', icon: Target, color: 'blue' },
  { key: 'stakeholder', label: 'Stakeholder', icon: Users, color: 'purple' },
  { key: 'si_id', label: 'Strategic Imperative', icon: Target, color: 'primary' },
  { key: 'csf_id', label: 'CSF', icon: Brain, color: 'green' },
  { key: 'source_channel', label: 'Source Channel', icon: Radio, color: 'orange' },
  { key: 'evidence_gap', label: 'Evidence Gap', icon: FileSearch, color: 'blue' },
  { key: 'action_required', label: 'Action Required', icon: AlertCircle, color: 'purple' },
]

function Tagging() {
  const [insights, setInsights] = useState([])
  const [tags, setTags] = useState([])
  const [selectedInsight, setSelectedInsight] = useState('')
  const [loading, setLoading] = useState(true)
  const [tagging, setTagging] = useState(false)
  const [batchTagging, setBatchTagging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [insightsRes, tagsRes] = await Promise.all([
        getInsights(),
        getTags()
      ])
      setInsights(insightsRes.data.insights || [])
      setTags(tagsRes.data.tags || [])
      if (insightsRes.data.insights?.length > 0) {
        setSelectedInsight(insightsRes.data.insights[0].insight_id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTagSingle = async () => {
    setTagging(true)
    setResult(null)
    try {
      const res = await tagSingle(selectedInsight)
      setResult(res.data.result)
      await fetchData()
    } catch (error) {
      console.error('Error tagging:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error'
      alert(`Tagging failed: ${errorMsg}`)
    } finally {
      setTagging(false)
    }
  }

  const handleBatchTag = async () => {
    setBatchTagging(true)
    setProgress(0)
    try {
      const res = await tagBatch()
      setProgress(100)
      await fetchData()
      const results = res.data.results
      if (results.failed > 0 && results.last_error) {
        alert(`Completed with errors!\nSuccess: ${results.success}, Failed: ${results.failed}\n\nLast error: ${results.last_error}`)
      } else {
        alert(`Completed! Success: ${results.success}, Failed: ${results.failed}`)
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error'
      alert(`Batch tagging failed: ${errorMsg}`)
    } finally {
      setBatchTagging(false)
    }
  }

  const getSentimentColor = (sentiment) => {
    const colors = {
      'Positive': 'success',
      'Negative': 'error',
      'Neutral': 'default',
      'Mixed': 'warning'
    }
    return colors[sentiment] || 'default'
  }


  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Taxonomy Tagging</h1>
        <p className="text-slate-500 dark:text-slate-400">AI-powered extraction of 10 labels from medical insights</p>
      </div>

      {/* Labels Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {LABEL_CONFIG.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="p-4">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Batch Processing</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Extract all 10 labels from every insight using AI</p>

          {batchTagging && (
            <div className="mb-4">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-500 mt-2 text-center">Processing...</p>
            </div>
          )}

          <Button onClick={handleBatchTag} loading={batchTagging} className="w-full">
            <Zap className="w-4 h-4" />
            Start Batch Tagging
          </Button>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Single Insight</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Tag an individual insight</p>

          <select
            value={selectedInsight}
            onChange={(e) => setSelectedInsight(e.target.value)}
            className="w-full mb-4 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          >
            {insights.map((insight) => (
              <option key={insight.insight_id} value={insight.insight_id}>
                {insight.insight_id} - {insight.disease_state}
              </option>
            ))}
          </select>

          <Button onClick={handleTagSingle} loading={tagging} className="w-full">
            <Tags className="w-4 h-4" />
            Tag Selected
          </Button>

          {result && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">Extracted Labels:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {LABEL_CONFIG.map(({ key, label }) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-500">{label}:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{result[key] || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tags Table */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tagged Insights</h3>
        {tags.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Asset</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Sentiment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Topic</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Stakeholder</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">SI</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.insight_id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{tag.insight_id}</td>
                    <td className="py-3 px-4 text-sm text-primary-500 font-mono">{tag.asset || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getSentimentColor(tag.sentiment)}>{tag.sentiment || '-'}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">{tag.insight_type || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="primary">{tag.topic || '-'}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">{tag.stakeholder || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">{tag.si_id || '-'}</td>
                    <td className="py-3 px-4">
                      {tag.is_verified ? (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            No tags generated yet. Run batch tagging to extract labels from insights.
          </div>
        )}
      </Card>
    </div>
  )
}

export default Tagging
