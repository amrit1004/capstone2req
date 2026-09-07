import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)

// Insights
export const getInsights = () => api.get('/insights')
export const getInsight = (id) => api.get(`/insights/${id}`)

// Taxonomy
export const getTaxonomySI = () => api.get('/taxonomy/si')
export const getTaxonomyCSF = (area) => api.get('/taxonomy/csf', { params: { therapeutic_area: area } })
export const getLabelOptions = () => api.get('/label-options')

// Tags
export const getTags = () => api.get('/tags')
export const getTag = (id) => api.get(`/tags/${id}`)
export const tagSingle = (insightId) => api.post('/tags/single', { insight_id: insightId })
export const tagBatch = (limit = null, skipTagged = false) => api.post('/tags/batch', { limit, skip_tagged: skipTagged })
export const verifyTag = (insightId, verifiedBy) => api.post('/tags/verify', { insight_id: insightId, verified_by: verifiedBy })
export const correctTag = (insightId, corrections, reason, correctedBy) => api.post('/tags/correct', {
  insight_id: insightId,
  corrections,
  reason,
  corrected_by: correctedBy
})

// Summary & Metrics
export const getSummary = () => api.get('/summary')
export const getMetrics = () => api.get('/metrics')
export const getDistributions = () => api.get('/distributions')

// Search
export const buildSearchIndex = () => api.post('/search/build-index')
export const searchInsights = (query, topK = 5) => api.post('/search', { query, top_k: topK })

// Personas
export const generatePersonaSummaries = (insightId) => api.post(`/personas/generate/${insightId}`)
export const generateAllPersonas = (limit = null, skipGenerated = false) => api.post('/personas/generate-all', { limit, skip_generated: skipGenerated })
export const getPersonaSummaries = (insightId) => api.get(`/personas/${insightId}`)

// Ground Truth
export const exportGroundTruthTemplate = (limit = 100) => api.get(`/ground-truth/export-template?limit=${limit}`, { responseType: 'blob' })
export const compareGroundTruth = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/ground-truth/compare', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const getSampleGroundTruth = () => api.get('/ground-truth/sample')

// RAG (Retrieval Augmented Generation)
export const ragQuery = (query, topK = 5) => api.post('/rag/query', { query, top_k: topK })
export const ragSummarizeTopic = (topic, topK = 10) => api.post('/rag/summarize-topic', { topic, top_k: topK })
export const ragCompare = (insightId, topK = 5) => api.post('/rag/compare', { insight_id: insightId, top_k: topK })

export default api
