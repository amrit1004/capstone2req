import React, { useState, useEffect } from 'react'
import { Tags, Zap, Target, Brain, CheckCircle2, Package, MessageSquare, Lightbulb, Users, Radio, FileSearch, AlertCircle, RefreshCw } from 'lucide-react'
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
  const [refreshing, setRefreshing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [batchLimit, setBatchLimit] = useState('')  // empty = all

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [insightsRes, tagsRes] = await Promise.all([
        getInsights(),
        getTags()
      ])
      const insightsList = insightsRes.data.insights || []
      const tagsList = tagsRes.data.tags || []

      setInsights(insightsList)
      setTags(tagsList)

      if (insightsList.length > 0 && !selectedInsight) {
        setSelectedInsight(insightsList[0].insight_id)
      }

      console.log(`Loaded ${insightsList.length} insights, ${tagsList.length} tags`)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
  }

  const handleTagSingle = async () => {
    if (!selectedInsight) {
      alert('Please select an insight first')
      return
    }
    setTagging(true)
    setResult(null)
    try {
      const res = await tagSingle(selectedInsight)
      setResult(res.data.result)
      // Refresh tags list
      const tagsRes = await getTags()
      setTags(tagsRes.data.tags || [])
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
      const limit = batchLimit ? parseInt(batchLimit) : null
      const res = await tagBatch(limit)
      setProgress(100)
      // Refresh tags list
      const tagsRes = await getTags()
      setTags(tagsRes.data.tags || [])

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Taxonomy Tagging</h1>
          <p className="text-slate-500 dark:text-slate-400">AI-powered extraction of 10 labels from medical insights</p>
        </div>
        <Button onClick={handleRefresh} variant="secondary" loading={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Labels Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {LABEL_CONFIG.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-default">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Batch Processing</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Extract all 10 labels from insights using AI</p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-600 dark:text-slate-400">Limit:</label>
            <input
              type="number"
              value={batchLimit}
              onChange={(e) => setBatchLimit(e.target.value)}
              placeholder="All"
              min="1"
              max={insights.length}
              className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <span className="text-xs text-slate-400">of {insights.length} insights</span>
          </div>

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

        <Card className="hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Single Insight</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Tag an individual insight</p>

          <select
            value={selectedInsight}
            onChange={(e) => setSelectedInsight(e.target.value)}
            className="w-full mb-4 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all hover:border-primary-300 dark:hover:border-primary-500"
          >
            {insights.length === 0 ? (
              <option value="">No insights loaded</option>
            ) : (
              insights.map((insight) => (
                <option key={insight.insight_id} value={insight.insight_id}>
                  {insight.insight_id} - {insight.disease_state || insight.therapeutic_area || 'No description'}
                </option>
              ))
            )}
          </select>

          <Button onClick={handleTagSingle} loading={tagging} className="w-full" disabled={!selectedInsight}>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tagged Insights ({tags.length})</h3>
        </div>
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
                {tags.slice(0, 50).map((tag) => (
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
            {tags.length > 50 && (
              <p className="text-center py-3 text-sm text-slate-500">Showing first 50 of {tags.length} tags</p>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Tags className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tags generated yet. Run batch tagging to extract labels from insights.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Tagging
