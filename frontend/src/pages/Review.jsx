import React, { useState, useEffect } from 'react'
import { CheckCircle, Edit3, User, Package, MessageSquare, Lightbulb, Target, Users, Radio, FileSearch, AlertCircle, Brain } from 'lucide-react'
import { Card, Badge, Button } from '../components/Card'
import { getTags, getInsights, getLabelOptions, getTaxonomySI, getTaxonomyCSF, verifyTag, correctTag } from '../api'

const LABEL_CONFIG = [
  { key: 'asset', label: 'Asset', icon: Package },
  { key: 'sentiment', label: 'Sentiment', icon: MessageSquare },
  { key: 'insight_type', label: 'Insight Type', icon: Lightbulb },
  { key: 'topic', label: 'Topic', icon: Target },
  { key: 'stakeholder', label: 'Stakeholder', icon: Users },
  { key: 'si_id', label: 'Strategic Imperative', icon: Target },
  { key: 'csf_id', label: 'CSF', icon: Brain },
  { key: 'source_channel', label: 'Source Channel', icon: Radio },
  { key: 'evidence_gap', label: 'Evidence Gap', icon: FileSearch },
  { key: 'action_required', label: 'Action Required', icon: AlertCircle },
]

function Review() {
  const [tags, setTags] = useState([])
  const [insights, setInsights] = useState({})
  const [labelOptions, setLabelOptions] = useState({})
  const [taxonomySI, setTaxonomySI] = useState([])
  const [taxonomyCSF, setTaxonomyCSF] = useState([])
  const [reviewer, setReviewer] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [corrections, setCorrections] = useState({})
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tagsRes, insightsRes, optionsRes, siRes, csfRes] = await Promise.all([
        getTags(),
        getInsights(),
        getLabelOptions(),
        getTaxonomySI(),
        getTaxonomyCSF()
      ])

      const unverified = (tagsRes.data.tags || []).filter(t => !t.is_verified)
      setTags(unverified)

      const insightsMap = {}
      ;(insightsRes.data.insights || []).forEach(i => {
        insightsMap[i.insight_id] = i
      })
      setInsights(insightsMap)

      setLabelOptions(optionsRes.data || {})
      setTaxonomySI(siRes.data.taxonomy_si || [])
      setTaxonomyCSF(csfRes.data.taxonomy_csf || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (insightId) => {
    if (!reviewer) {
      alert('Please enter your name')
      return
    }
    try {
      await verifyTag(insightId, reviewer)
      await fetchData()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleStartEdit = (tag) => {
    setEditingId(tag.insight_id)
    setCorrections({
      asset: tag.asset || '',
      sentiment: tag.sentiment || '',
      insight_type: tag.insight_type || '',
      topic: tag.topic || '',
      stakeholder: tag.stakeholder || '',
      si_id: tag.si_id || '',
      csf_id: tag.csf_id || '',
      source_channel: tag.source_channel || '',
      evidence_gap: tag.evidence_gap || '',
      action_required: tag.action_required || ''
    })
    setReason('')
  }

  const handleSaveCorrection = async (insightId) => {
    if (!reviewer) {
      alert('Please enter your name')
      return
    }
    if (!reason) {
      alert('Please enter a reason for correction')
      return
    }
    try {
      await correctTag(insightId, corrections, reason, reviewer)
      setEditingId(null)
      setCorrections({})
      setReason('')
      await fetchData()
    } catch (error) {
      console.error('Error:', error)
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Review & Correct</h1>
        <p className="text-slate-500 dark:text-slate-400">Verify AI-generated labels and make corrections</p>
      </div>

      {/* Reviewer Input */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Reviewer Name</label>
            <input
              type="text"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="Enter your name"
              className="w-full max-w-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          {reviewer && (
            <Badge variant="success">Logged in as {reviewer}</Badge>
          )}
        </div>
      </Card>

      {/* Review Cards */}
      {tags.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">All Caught Up!</h3>
          <p className="text-slate-500 dark:text-slate-400">No unverified tags to review.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {tags.map((tag) => {
            const insight = insights[tag.insight_id] || {}
            const isEditing = editingId === tag.insight_id

            return (
              <Card key={tag.insight_id}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{tag.insight_id}</span>
                    <Badge variant="primary">{insight.therapeutic_area}</Badge>
                    <Badge variant="warning">{insight.disease_state}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleVerify(tag.insight_id)}>
                      <CheckCircle className="w-4 h-4" /> Approve All
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => isEditing ? setEditingId(null) : handleStartEdit(tag)}>
                      <Edit3 className="w-4 h-4" /> {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                </div>

                {/* Original Insight */}
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{insight.description}</p>
                </div>

                {/* Labels Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {LABEL_CONFIG.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                      <div className="flex items-center gap-1 mb-1">
                        <Icon className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{label}</span>
                      </div>
                      {isEditing ? (
                        key === 'asset' ? (
                          <input
                            type="text"
                            value={corrections[key] || ''}
                            onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                            className="w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            placeholder="BI-XXXXXX"
                          />
                        ) : key === 'si_id' ? (
                          <select
                            value={corrections[key] || ''}
                            onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                            className="w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="">Select...</option>
                            {taxonomySI.map(si => (
                              <option key={si.si_id} value={si.si_id}>{si.si_id}</option>
                            ))}
                          </select>
                        ) : key === 'csf_id' ? (
                          <select
                            value={corrections[key] || ''}
                            onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                            className="w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="">Select...</option>
                            {taxonomyCSF.filter(c => c.therapeutic_area === insight.therapeutic_area).map(csf => (
                              <option key={csf.csf_id} value={csf.csf_id}>{csf.csf_id}</option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={corrections[key] || ''}
                            onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                            className="w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="">Select...</option>
                            {(labelOptions[key] || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )
                      ) : (
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {key === 'sentiment' ? (
                            <Badge variant={getSentimentColor(tag[key])}>{tag[key] || '-'}</Badge>
                          ) : (
                            tag[key] || '-'
                          )}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Correction Reason */}
                {isEditing && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Reason for Correction
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why these corrections are needed..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                      rows={2}
                    />
                    <div className="mt-3">
                      <Button size="sm" onClick={() => handleSaveCorrection(tag.insight_id)}>
                        Save Corrections
                      </Button>
                    </div>
                  </div>
                )}

                {/* Confidence & Reasoning */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      Confidence: <span className="text-primary-500 font-medium">{((tag.confidence_score || 0) * 100).toFixed(0)}%</span>
                    </span>
                  </div>
                  {tag.reasoning && (
                    <p className="text-sm text-slate-500 italic">"{tag.reasoning}"</p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Review
