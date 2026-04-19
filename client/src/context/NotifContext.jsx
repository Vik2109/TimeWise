import { createContext, useContext, useState, useCallback } from 'react'
import api from '../utils/api'

const NotifCtx = createContext(null)

export function NotifProvider({ children }) {
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/notifications?unread=true')
      setUnread(res.data.unreadCount || 0)
    } catch { /* ignore */ }
  }, [])

  const markAll = useCallback(async () => {
    await api.patch('/notifications/read-all')
    setUnread(0)
  }, [])

  return (
    <NotifCtx.Provider value={{ unread, setUnread, refresh, markAll }}>
      {children}
    </NotifCtx.Provider>
  )
}

export const useNotif = () => useContext(NotifCtx)
