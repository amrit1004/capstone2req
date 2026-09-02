import React, { useState, useEffect, useRef } from 'react'
import { BarChart3, Target, CheckCircle, Edit3, TrendingUp, Download, Upload, FileText, AlertCircle } from 'lucide-react'
import { Card, MetricCard, Badge, Button } from '../components/Card'
import { getMetrics, exportGroundTruthTemplate, compareGroundTruth } from '../api'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

function Metrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState(null)
  const [exportLimit, setExportLimit] = useState(100)
  const fileInputRef = useRef(null)

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

  const handleExportTemplate = async () => {
    setExporting(true)
    try {
      const response = await exportGroundTruthTemplate(exportLimit)
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ground_truth_template.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error:', error)
      alert('Error exporting template')
    } finally {
      setExporting(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setComparing(true)
    setComparisonResult(null)
    try {
      const res = await compareGroundTruth(file)
      setComparisonResult(res.data)
    } catch (error) {
      console.error('Error:', error)
      const errorMsg = error.response?.data?.detail || 'Error comparing ground truth'
      alert(errorMsg)
    } finally {
      setComparing(false)
      event.target.value = ''
    }
  }

  const precision = metrics?.precision || 0
  const gaugeData = [
    { name: 'Precision', value: precision },
    { name: 'Remaining', value: 100 - precision },
  ]
  const gaugeColors = ['#6366f1', '#1e293b']

  const getPrecisionColor = (val) => {
    const v = val ?? precision
    if (v >= 80) return 'text-emerald-500'
    if (v >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getBarColor = (accuracy) => {
    if (accuracy >= 80) return '#10b981'
    if (accuracy >= 60) return '#f59e0b'
    return '#ef4444'
  }

  // Prepare chart data for comparison
  const comparisonChartData = comparisonResult?.label_accuracy
    ? Object.entries(comparisonResult.label_accuracy).map(([label, data]) => ({
        name: label.replace('_', ' '),
        accuracy: data.accuracy,
        fill: getBarColor(data.accuracy)
      }))
    : []

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Accuracy Metrics</h1>
        <p className="text-slate-500 dark:text-slate-400">Track AI tagging performance and compare with ground truth</p>
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

      {/* Ground Truth Comparison */}
      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Ground Truth Comparison</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Compare AI predictions against manually labeled ground truth data
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Export Template */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-3 mb-3">
              <Download className="w-5 h-5 text-primary-500" />
              <h4 className="font-medium text-slate-900 dark:text-white">Step 1: Export Template</h4>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Download a CSV template with insight IDs. Fill in the correct labels manually.
            </p>
            <div className="flex items-center gap-3">
              <select
                value={exportLimit}
                onChange={(e) => setExportLimit(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              >
                <option value={25}>25 insights</option>
                <option value={50}>50 insights</option>
                <option value={100}>100 insights</option>
                <option value={150}>150 insights</option>
                <option value={200}>200 insights</option>
                <option value={250}>250 insights</option>
              </select>
              <Button onClick={handleExportTemplate} loading={exporting} variant="secondary">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Upload & Compare */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="w-5 h-5 text-emerald-500" />
              <h4 className="font-medium text-slate-900 dark:text-white">Step 2: Upload & Compare</h4>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Upload your filled ground truth CSV to compare with AI predictions.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} loading={comparing}>
              <Upload className="w-4 h-4" />
              Upload CSV
            </Button>
          </div>
        </div>

        {/* Comparison Results */}
        {comparisonResult && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Comparison Results</h4>
                <p className="text-sm text-slate-500">
                  Compared {comparisonResult.total_compared} ground truth records against AI predictions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="primary">{comparisonResult.total_compared} samples</Badge>
                <Badge variant={comparisonResult.overall_accuracy >= 80 ? 'success' : comparisonResult.overall_accuracy >= 60 ? 'warning' : 'error'}>
                  Overall: {comparisonResult.overall_accuracy}%
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accuracy per Label */}
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Accuracy per Label</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonChartData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#64748b' }} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                    />
                    <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                      {comparisonChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Label Details */}
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Label Details</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {Object.entries(comparisonResult.label_accuracy).map(([label, data]) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-700">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                        {label.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {data.correct}/{data.total}
                        </span>
                        <Badge variant={data.accuracy >= 80 ? 'success' : data.accuracy >= 60 ? 'warning' : 'error'}>
                          {data.accuracy}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mismatches */}
            {comparisonResult.mismatches?.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Sample Mismatches ({comparisonResult.mismatches.length})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 text-slate-500">Insight ID</th>
                        <th className="text-left py-2 px-3 text-slate-500">Label</th>
                        <th className="text-left py-2 px-3 text-slate-500">Ground Truth</th>
                        <th className="text-left py-2 px-3 text-slate-500">AI Prediction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResult.mismatches.slice(0, 10).map((m, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                          <td className="py-2 px-3 font-mono text-slate-900 dark:text-white">{m.insight_id}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300 capitalize">{m.label.replace('_', ' ')}</td>
                          <td className="py-2 px-3"><Badge variant="success">{m.ground_truth || '-'}</Badge></td>
                          <td className="py-2 px-3"><Badge variant="error">{m.ai_prediction || '-'}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Precision Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Human Review Precision</h3>
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
                <p className="text-sm text-slate-500 dark:text-slate-400">Based on Reviews</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Metrics Explained</h3>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <p className="font-medium text-slate-900 dark:text-white mb-1">Human Review Precision</p>
              <p className="text-sm text-slate-500">% of AI tags accepted without correction during human review</p>
              <p className="text-xs font-mono text-primary-500 mt-1">(Verified - Corrections) / Verified × 100</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <p className="font-medium text-slate-900 dark:text-white mb-1">Ground Truth Accuracy</p>
              <p className="text-sm text-slate-500">% match between AI predictions and manually labeled ground truth</p>
              <p className="text-xs font-mono text-emerald-500 mt-1">Matching Labels / Total Labels × 100</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Analysis Notes */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Analysis Notes</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4">Document patterns in AI errors for your deliverable report</p>
        <textarea
          placeholder="e.g., The AI tends to confuse SI-02 and SI-04 when insights mention both access barriers and competitive differentiation. Sentiment classification is most accurate, while stakeholder identification needs improvement..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none transition-all hover:border-primary-300 dark:hover:border-primary-500"
          rows={4}
        />
      </Card>
    </div>
  )
}

export default Metrics
