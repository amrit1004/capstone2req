import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Search, GitCompare, FileText, Send, BookOpen, Bot, User, Copy, Check, RefreshCw, Sparkles } from 'lucide-react'
import { Card, Badge, Button } from '../components/Card'
import { getInsights, ragQuery, ragSummarizeTopic, ragCompare } from '../api'

// Simple markdown renderer
const renderMarkdown = (text) => {
  if (!text) return null

  // Split into lines for processing
  const lines = text.split('\n')
  const elements = []
  let listItems = []
  let inList = false

  const processInlineMarkdown = (line) => {
    // Bold + Italic (***text***)
    line = line.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold (**text**)
    line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic (*text*)
    line = line.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code (`text`)
    line = line.replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-sm">$1</code>')
    return line
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    // Headers
    if (trimmed.startsWith('### ')) {
      if (inList) { elements.push(<ul key={`list-${idx}`} className="list-disc list-inside mb-3 space-y-1">{listItems}</ul>); listItems = []; inList = false }
      elements.push(<h4 key={idx} className="font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2">{trimmed.slice(4)}</h4>)
    } else if (trimmed.startsWith('## ')) {
      if (inList) { elements.push(<ul key={`list-${idx}`} className="list-disc list-inside mb-3 space-y-1">{listItems}</ul>); listItems = []; inList = false }
      elements.push(<h3 key={idx} className="font-bold text-slate-900 dark:text-white mt-4 mb-2">{trimmed.slice(3)}</h3>)
    } else if (trimmed.startsWith('# ')) {
      if (inList) { elements.push(<ul key={`list-${idx}`} className="list-disc list-inside mb-3 space-y-1">{listItems}</ul>); listItems = []; inList = false }
      elements.push(<h2 key={idx} className="font-bold text-lg text-slate-900 dark:text-white mt-4 mb-2">{trimmed.slice(2)}</h2>)
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      if (inList && listItems.length > 0) { elements.push(<ul key={`list-${idx}`} className="list-disc list-inside mb-3 space-y-1">{listItems}</ul>); listItems = [] }
      inList = true
      const content = trimmed.replace(/^\d+\.\s/, '')
      listItems.push(<li key={idx} className="text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(content) }} />)
    }
    // Bullet list
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true
      const content = trimmed.slice(2)
      listItems.push(<li key={idx} className="text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(content) }} />)
    }
    // Empty line
    else if (trimmed === '') {
      if (inList) { elements.push(<ul key={`list-${idx}`} className="list-disc list-inside mb-3 space-y-1">{listItems}</ul>); listItems = []; inList = false }
      elements.push(<div key={idx} className="h-2" />)
    }
    // Regular paragraph
    else {
      if (inList) { elements.push(<ul key={`list-${idx}`} className="list-disc list-inside mb-3 space-y-1">{listItems}</ul>); listItems = []; inList = false }
      elements.push(<p key={idx} className="text-slate-700 dark:text-slate-300 mb-2" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(trimmed) }} />)
    }
  })

  // Close any remaining list
  if (inList && listItems.length > 0) {
    elements.push(<ul key="list-final" className="list-disc list-inside mb-3 space-y-1">{listItems}</ul>)
  }

  return <div className="space-y-1">{elements}</div>
}

function RAG() {
  const [activeTab, setActiveTab] = useState('query')
  const [insights, setInsights] = useState([])

  // Chat state
  const [messages, setMessages] = useState([])
  const [query, setQuery] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const chatEndRef = useRef(null)

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

    const userMessage = { role: 'user', content: query, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setQueryLoading(true)

    try {
      const res = await ragQuery(query)
      const botMessage = {
        role: 'assistant',
        content: res.data.answer,
        sources: res.data.sources,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please make sure the vector index is built.',
        isError: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setQueryLoading(false)
    }
  }

  const handleCopy = async (idx, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleClearChat = () => {
    setMessages([])
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
    { id: 'query', label: 'Chat', icon: MessageSquare },
    { id: 'topic', label: 'Topic Analysis', icon: FileText },
    { id: 'compare', label: 'Compare', icon: GitCompare },
  ]

  const suggestedQuestions = [
    "What are the main efficacy concerns?",
    "Summarize safety signals across insights",
    "What dosing questions are most common?",
    "What evidence gaps exist?"
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">RAG Assistant</h1>
        <p className="text-slate-500 dark:text-slate-400">AI-powered insight analysis with retrieval-augmented generation</p>
      </div>

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

      {/* Chat Tab */}
      {activeTab === 'query' && (
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
          {/* Chat Messages */}
          <Card className="flex-1 overflow-hidden flex flex-col mb-4">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Ask me anything about your insights</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                    I'll search through your medical insights database and provide answers grounded in actual data.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(q)}
                        className="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                        <div className={`rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-primary-500 text-white rounded-br-md'
                            : msg.isError
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-bl-md'
                              : 'bg-slate-100 dark:bg-slate-700 rounded-bl-md'
                        }`}>
                          {msg.role === 'user' ? (
                            <p>{msg.content}</p>
                          ) : (
                            <div>
                              {renderMarkdown(msg.content)}
                              {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                                    Sources ({msg.sources.length})
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {msg.sources.map((src, sIdx) => (
                                      <Badge key={sIdx} variant="secondary" className="text-xs">
                                        {src.insight_id}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-slate-400">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.role === 'assistant' && !msg.isError && (
                            <button
                              onClick={() => handleCopy(idx, msg.content)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              {copiedIdx === idx ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-slate-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </div>
                      )}
                    </div>
                  ))}
                  {queryLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-sm text-slate-500">Searching insights...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
          </Card>

          {/* Input Area */}
          <div className="flex gap-3 items-center">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Clear chat"
              >
                <RefreshCw className="w-5 h-5 text-slate-500" />
              </button>
            )}
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !queryLoading && handleQuery()}
                placeholder="Ask a question about your insights..."
                disabled={queryLoading}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
              />
              <button
                onClick={handleQuery}
                disabled={queryLoading || !query.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic Tab */}
      {activeTab === 'topic' && (
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Analyze a Topic</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Enter a topic to analyze trends, patterns, and generate a structured summary.
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
                <Sparkles className="w-4 h-4" />
                Analyze
              </Button>
            </div>
          </Card>

          {topicResult && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Topic: {topicResult.topic}</h3>
                <Badge variant="secondary">{topicResult.insights_analyzed} insights</Badge>
              </div>
              {renderMarkdown(topicResult.summary)}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Sources:</p>
                <div className="flex flex-wrap gap-1">
                  {topicResult.source_ids?.map((id, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{id}</Badge>
                  ))}
                </div>
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
              Select an insight to find similar ones and analyze patterns.
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
                      {sim.insight_id} ({(sim.similarity * 100).toFixed(0)}%)
                    </Badge>
                  ))}
                </div>
                {renderMarkdown(compareResult.analysis)}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RAG
