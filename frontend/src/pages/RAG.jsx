import { useState, useEffect } from 'react'
import { MessageSquare, Search, GitCompare, FileText, Send, Loader2, BookOpen } from 'lucide-react'
import { Card, Badge, Button } from '../components/Card'
import { getInsights, ragQuery, ragSummarizeTopic, ragCompare } from '../api'

function RAG() {
  const [activeTab, setActiveTab] = useState('query')
  const [insights, setInsights] = useState([])

  // Query state
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [queryLoading, setQueryLoading] = useState(false)

  // Topic state
  const [topic, setTopic] = useState('')
  const [topicResult, setTopicResult] = useState(null)
  const [topicLoading, setTopicLoading] = useState(false)

  // Compare state
  const [selectedInsight, setSelectedInsight] = useState('')
  const [compareResult, setCompareResult] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)

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
    }
  }

  const handleQuery = async () => {
    if (!query.trim()) return
    setQueryLoading(true)
    setQueryResult(null)
    try {
      const res = await ragQuery(query)
      setQueryResult(res.data)
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.detail || 'Query failed. Make sure vector index is built.')
    } finally {
      setQueryLoading(false)
    }
  }

  const handleTopicSummary = async () => {
    if (!topic.trim()) return
    setTopicLoading(true)
    setTopicResult(null)
    try {
      const res = await ragSummarizeTopic(topic)
      setTopicResult(res.data)
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.detail || 'Topic analysis failed.')
    } finally {
      setTopicLoading(false)
    }
  }

  const handleCompare = async () => {
    if (!selectedInsight) return
    setCompareLoading(true)
    setCompareResult(null)
    try {
      const res = await ragCompare(selectedInsight)
      setCompareResult(res.data)
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.detail || 'Comparison failed.')
    } finally {
      setCompareLoading(false)
    }
  }

  const tabs = [
    { id: 'query', label: 'Ask Questions', icon: MessageSquare },
    { id: 'topic', label: 'Topic Analysis', icon: FileText },
    { id: 'compare', label: 'Compare Insights', icon: GitCompare },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">RAG Assistant</h1>
        <p className="text-slate-500 dark:text-slate-400">Retrieval-Augmented Generation for intelligent insight analysis</p>
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">How RAG Works</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              RAG (Retrieval-Augmented Generation) enhances AI responses by first retrieving relevant insights from your indexed data,
              then using them as context for the LLM. This grounds responses in actual data and improves accuracy.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Query Tab */}
      {activeTab === 'query' && (
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Ask a Question</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Ask questions about your medical insights. The AI will retrieve relevant insights and answer based on actual data.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                placeholder="e.g., What are the main efficacy concerns for oncology drugs?"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <Button onClick={handleQuery} loading={queryLoading}>
                <Send className="w-4 h-4" />
                Ask
              </Button>
            </div>
          </Card>

          {queryResult && (
            <Card>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Answer</h3>
              <div className="prose dark:prose-invert max-w-none mb-6">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{queryResult.answer}</p>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                  Sources ({queryResult.num_sources} insights retrieved)
                </h4>
                <div className="space-y-2">
                  {queryResult.sources?.map((source, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="primary">{source.insight_id}</Badge>
                        <span className="text-xs text-slate-400">Relevance: {(source.relevance_score * 100).toFixed(1)}%</span>
                        {source.therapeutic_area && (
                          <Badge variant="secondary">{source.therapeutic_area}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{source.preview}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Topic Tab */}
      {activeTab === 'topic' && (
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Analyze a Topic</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Enter a topic to analyze trends, patterns, and generate a structured summary from relevant insights.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTopicSummary()}
                placeholder="e.g., dosing concerns, safety signals, patient access"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <Button onClick={handleTopicSummary} loading={topicLoading}>
                <Search className="w-4 h-4" />
                Analyze
              </Button>
            </div>
          </Card>

          {topicResult && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Topic Analysis: {topicResult.topic}</h3>
                <Badge variant="secondary">{topicResult.insights_analyzed} insights analyzed</Badge>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{topicResult.summary}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400">
                  Source IDs: {topicResult.source_ids?.join(', ')}
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Compare Similar Insights</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Select an insight to find similar ones and get an AI analysis of patterns and differences.
            </p>
            <div className="flex gap-3">
              <select
                value={selectedInsight}
                onChange={(e) => setSelectedInsight(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {insights.map((insight) => (
                  <option key={insight.insight_id} value={insight.insight_id}>
                    {insight.insight_id} - {insight.disease_state || insight.therapeutic_area}
                  </option>
                ))}
              </select>
              <Button onClick={handleCompare} loading={compareLoading}>
                <GitCompare className="w-4 h-4" />
                Compare
              </Button>
            </div>
          </Card>

          {compareResult && (
            <div className="space-y-4">
              <Card>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Original Insight</h3>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <Badge variant="primary" className="mb-2">{compareResult.insight_id}</Badge>
                  <p className="text-slate-700 dark:text-slate-300">{compareResult.original_description}</p>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Similar Insights</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {compareResult.similar_insights?.map((sim, idx) => (
                    <Badge key={idx} variant="secondary">
                      {sim.insight_id} ({(sim.similarity * 100).toFixed(1)}% similar)
                    </Badge>
                  ))}
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{compareResult.analysis}</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RAG
