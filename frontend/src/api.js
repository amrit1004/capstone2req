import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

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
export const tagBatch = () => api.post('/tags/batch')
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
export const generateAllPersonas = () => api.post('/personas/generate-all')
export const getPersonaSummaries = (insightId) => api.get(`/personas/${insightId}`)

export default api
