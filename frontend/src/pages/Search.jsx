import React, { useState } from 'react'
import { Search as SearchIcon, Database, Sparkles } from 'lucide-react'
import { Card, Badge, Button } from '../components/Card'
import { buildSearchIndex, searchInsights } from '../api'

function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [topK, setTopK] = useState(5)
  const [searching, setSearching] = useState(false)
  const [building, setBuilding] = useState(false)
  const [indexSize, setIndexSize] = useState(null)

  const handleBuildIndex = async () => {
    setBuilding(true)
    try {
      const res = await buildSearchIndex()
      setIndexSize(res.data.index_size)
      alert(`Index built with ${res.data.index_size} insights`)
    } catch (error) {
      console.error('Error:', error)
      alert('Error building index. Check API configuration.')
    } finally {
      setBuilding(false)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await searchInsights(query, topK)
      setResults(res.data.results || [])
    } catch (error) {
      console.error('Error:', error)
      if (error.response?.data?.detail?.includes('empty')) {
        alert('Please build the vector index first')
      }
    } finally {
      setSearching(false)
    }
  }

  const getScoreColor = (score) => {
    if (score > 0.7) return 'text-emerald-500'
    if (score > 0.4) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Semantic Search</h1>
        <p className="text-slate-500 dark:text-slate-400">Search through medical insights using natural language</p>
      </div>

      {/* Build Index */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Vector Index</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {indexSize ? `${indexSize} insights indexed` : 'Build index before searching'}
              </p>
            </div>
          </div>
          <Button onClick={handleBuildIndex} loading={building} variant="secondary">
            <Sparkles className="w-4 h-4" />
            {building ? 'Building...' : 'Build Index'}
          </Button>
        </div>
      </Card>

      {/* Search Input */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g., pancreatic cancer treatment efficacy, diabetes weight management..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500 dark:text-slate-400">Results:</label>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {[3, 5, 10].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <Button onClick={handleSearch} loading={searching}>
              <SearchIcon className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Found {results.length} results
          </h3>
          <div className="space-y-4">
            {results.map((result, idx) => (
              <Card key={result.insight_id} hover>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{result.insight_id}</span>
                      <Badge variant="primary">{result.insight?.therapeutic_area}</Badge>
                      <Badge variant="warning">{result.insight?.disease_state}</Badge>
                      <span className={`text-sm font-medium ${getScoreColor(result.score)}`}>
                        {(result.score * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      {result.insight?.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && query && !searching && (
        <Card className="text-center py-12">
          <SearchIcon className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">No results found. Try different search terms.</p>
        </Card>
      )}
    </div>
  )
}

export default Search
