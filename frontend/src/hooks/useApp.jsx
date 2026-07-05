import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [adminEvents, setAdminEvents] = useState([])

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
  }, [darkMode])

  const refreshEvents = useCallback(async () => {
    try {
      const { events } = await api.getEvents()
      setAdminEvents(events)
    } catch {
      setAdminEvents([])
    }
  }, [])

  useEffect(() => {
    const token = api.getToken()
    if (!token) {
      setLoading(false)
      return
    }
    api.getMe()
      .then(({ user }) => {
        setCurrentUser(user)
        setIsAuthenticated(true)
        return refreshEvents()
      })
      .catch(() => {
        api.setToken(null)
      })
      .finally(() => setLoading(false))
  }, [refreshEvents])

  const login = async (username, password) => {
    try {
      const { token, user } = await api.login(username, password)
      api.setToken(token)
      setCurrentUser(user)
      setIsAuthenticated(true)
      await refreshEvents()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message, reason: err.reason || null }
    }
  }

  const register = async (data) => {
    try {
      const { token, user } = await api.register({
        username:       data.username,
        password:       data.password,
        robloxUsername: data.robloxUsername,
        phone:          data.phone,
      })
      api.setToken(token)
      setCurrentUser(user)
      setIsAuthenticated(true)
      await refreshEvents()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const logout = () => {
    api.setToken(null)
    setIsAuthenticated(false)
    setCurrentUser(null)
    setAdminEvents([])
  }

  const toggleDarkMode = () => setDarkMode(prev => !prev)

  const updateCurrentUser = async (data) => {
    const { user } = await api.updateProfile(data)
    setCurrentUser(user)
    return user
  }

  const addAdminEvent = (event) => {
    setAdminEvents(prev => [event, ...prev])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      currentUser,
      setCurrentUser,
      updateCurrentUser,
      login,
      register,
      logout,
      darkMode,
      toggleDarkMode,
      adminEvents,
      setAdminEvents,
      refreshEvents,
      addAdminEvent,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
