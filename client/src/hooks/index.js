import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

// ── Generic fetch ──────────────────────────────────────────────
export function useFetch(url) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch = useCallback(async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await api.get(url)
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, error, refetch: fetch }
}

// ── Tasks ──────────────────────────────────────────────────────
export function useTasks(params = {}) {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState({ total: 0, pending: 0 })

  const key = JSON.stringify(params)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v)))
      const res = await api.get(`/tasks?${q}`)
      setTasks(res.data.data || [])
      setStats({ total: res.data.total || 0, pending: res.data.pending || 0 })
    } catch { toast.error('Failed to load tasks') }
    finally { setLoading(false) }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const create = async (d)    => { await api.post('/tasks', d);                toast.success('Task created!');  load() }
  const update = async (id,d) => { await api.put(`/tasks/${id}`, d);           toast.success('Task updated!');  load() }
  const remove = async (id)   => { await api.delete(`/tasks/${id}`);           toast.success('Task deleted');   load() }
  const toggle = async (id)   => { await api.patch(`/tasks/${id}/toggle`);     load() }

  return { tasks, loading, stats, refetch: load, create, update, remove, toggle }
}

// ── Habits ─────────────────────────────────────────────────────
export function useHabits() {
  const [habits, setHabits]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/habits'); setHabits(r.data.data || []) }
    catch { toast.error('Failed to load habits') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (d)    => { await api.post('/habits', d);           toast.success('Habit added!');   load() }
  const update = async (id,d) => { await api.put(`/habits/${id}`, d);     toast.success('Habit updated!'); load() }
  const remove = async (id)   => { await api.delete(`/habits/${id}`);     toast.success('Habit removed');  load() }
  const log    = async (id,date,status) => { await api.post(`/habits/${id}/log`, { date, status }); load() }

  return { habits, loading, refetch: load, create, update, remove, log }
}

// ── Events ─────────────────────────────────────────────────────
export function useEvents(params = {}) {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)

  const key = JSON.stringify(params)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v)))
      const r = await api.get(`/events?${q}`)
      setEvents(r.data.data || [])
    } catch { toast.error('Failed to load events') }
    finally { setLoading(false) }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const create = async (d)    => { await api.post('/events', d);           toast.success('Event added!');   load() }
  const update = async (id,d) => { await api.put(`/events/${id}`, d);     toast.success('Event updated!'); load() }
  const remove = async (id)   => { await api.delete(`/events/${id}`);     toast.success('Event deleted');  load() }

  return { events, loading, refetch: load, create, update, remove }
}

// ── Analytics ──────────────────────────────────────────────────
export function useAnalytics(period = '7days') {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/analytics/summary?period=${period}`)
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  return { data, loading }
}
