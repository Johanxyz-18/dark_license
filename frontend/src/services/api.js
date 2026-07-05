const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('dl_token')
}

function setToken(token) {
  if (token) localStorage.setItem('dl_token', token)
  else localStorage.removeItem('dl_token')
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.error || 'Error en la solicitud')
    err.reason = data.reason || null
    throw err
  }
  return data
}

export const api = {
  getToken,
  setToken,

  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  register: (data) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => request('/auth/me'),

  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/users${q ? `?${q}` : ''}`)
  },

  getBirthdays: () => request('/users/birthdays'),

  updateProfile: (data) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  toggleUserStatus: (id, status) =>
    request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  createUser: (data) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),

  deleteUser: (id) =>
    request(`/users/${id}`, { method: 'DELETE' }),

  getEvents: () => request('/events'),

  createEvent: (data) =>
    request('/events', { method: 'POST', body: JSON.stringify(data) }),

  updateEvent: (id, data) =>
    request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteEvent: (id) =>
    request(`/events/${id}`, { method: 'DELETE' }),

  getJustifications: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/justifications${q ? `?${q}` : ''}`)
  },

  createJustification: (data) =>
    request('/justifications', { method: 'POST', body: JSON.stringify(data) }),

  updateJustification: (id, estado) =>
    request(`/justifications/${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) }),

  getDashboardStats: () => request('/dashboard/stats'),
  getActivityChart: () => request('/dashboard/activity-chart'),
  getJustificationStatus: () => request('/dashboard/justification-status'),
  getRecentActivity: () => request('/dashboard/recent'),
}

export default api
