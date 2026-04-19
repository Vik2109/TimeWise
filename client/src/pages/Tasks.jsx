import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTasks } from '../hooks/index'
import { Modal, ConfirmDelete, EmptyState, PageLoading, PriorityDot, Progress, Field } from '../components/common/UI'
import Icon from '../components/common/Icon'
import clsx from 'clsx'

const CATS = ['Work','Study','Health','Personal']
const PRIS = ['High','Medium','Low']
const TABS = [['all','All Tasks'],['today','Today'],['upcoming','Upcoming'],['completed','Completed']]
const PRI_BADGE = { High: 'badge-red', Medium: 'badge-amber', Low: 'badge-green' }

function TaskForm({ initial, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [f, setF] = useState(initial || { title:'', description:'', category:'Work', priority:'Medium', dueDate:today, dueTime:'', estimatedHours:'' })
  const [saving, setSaving] = useState(false)
  const s = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!f.title.trim()) return
    setSaving(true)
    try { await onSave(f) } finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-0">
      <Field label="Title *">
        <input className="input" value={f.title} onChange={s('title')} placeholder="Task title…" autoFocus required />
      </Field>
      <Field label="Description">
        <textarea className="input resize-none h-20" value={f.description} onChange={s('description')} placeholder="Add details…" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select className="input" value={f.category} onChange={s('category')}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select className="input" value={f.priority} onChange={s('priority')}>
            {PRIS.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due Date">
          <input className="input" type="date" value={f.dueDate} onChange={s('dueDate')} />
        </Field>
        <Field label="Due Time">
          <input className="input" type="time" value={f.dueTime} onChange={s('dueTime')} />
        </Field>
      </div>
      <Field label="Estimated Hours">
        <input className="input" type="number" step="0.5" min="0" value={f.estimatedHours} onChange={s('estimatedHours')} placeholder="e.g. 2" />
      </Field>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial?._id ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  )
}

export default function Tasks() {
  const { openSidebar } = useOutletContext() || {}
  const [tab, setTab]           = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters]   = useState({ category:'', priority:'', search:'' })
  const [selected, setSelected] = useState(null)
  const [modal, setModal]       = useState(null)

  const params = useMemo(() => ({ tab, ...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)) }), [tab, filters])
  const { tasks, loading, stats, create, update, remove, toggle } = useTasks(params)

  const handleSave = async (form) => {
    selected?._id ? await update(selected._id, form) : await create(form)
    setModal(null); setSelected(null)
  }
  const handleDelete = async () => { await remove(selected._id); setModal(null); setSelected(null) }

  return (
    <>
      <div className="topbar">
        <div className="flex items-center min-w-0">
          <button className="hamburger-btn" onClick={openSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
            <p className="text-sm text-white/40 mt-0.5 hidden sm:block">{stats.pending} pending · {tasks.filter(t=>t.status==='completed').length} completed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost" onClick={() => setFilterOpen(p=>!p)}>
            <Icon name="filter" size={14} /> <span className="hidden sm:inline">Filter</span>
          </button>
          <button className="btn btn-primary" onClick={() => { setSelected(null); setModal('form') }}>
            <Icon name="plus" size={14} /> <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-7 animate-fade-in">
        {/* Filter panel */}
        {filterOpen && (
          <div className="card mb-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div>
                <label className="label" style={{fontSize:11}}>Category</label>
                <select className="input text-sm py-2" value={filters.category} onChange={e=>setFilters(p=>({...p,category:e.target.value}))}>
                  <option value="">All Categories</option>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label" style={{fontSize:11}}>Priority</label>
                <select className="input text-sm py-2" value={filters.priority} onChange={e=>setFilters(p=>({...p,priority:e.target.value}))}>
                  <option value="">All Priorities</option>
                  {PRIS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label" style={{fontSize:11}}>Search</label>
                <input className="input text-sm py-2" placeholder="Search tasks…" value={filters.search} onChange={e=>setFilters(p=>({...p,search:e.target.value}))} />
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setFilters({category:'',priority:'',search:''})}>Clear</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-100 p-1 rounded-xl mb-5 overflow-x-auto">
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={clsx('flex-1 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-w-0', tab===key ? 'bg-surface-50 text-white shadow-sm' : 'text-white/40 hover:text-white')}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          {/* List */}
          <div className="card">
            {loading ? <PageLoading /> : tasks.length === 0 ? (
              <EmptyState icon="📋" message="No tasks found" action={
                <button className="btn btn-primary btn-sm" onClick={() => { setSelected(null); setModal('form') }}>+ New Task</button>
              } />
            ) : tasks.map(task => (
              <div key={task._id}
                onClick={() => setSelected(task)}
                className={clsx('task-row', selected?._id === task._id && 'bg-primary-400/5 rounded-lg')}
              >
                <div
                  onClick={e => { e.stopPropagation(); toggle(task._id) }}
                  className={clsx('w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all',
                    task.status==='completed' ? 'bg-teal-300 border-teal-300' : 'border-white/20 hover:border-white/40')}
                >
                  {task.status==='completed' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" className="w-2.5 h-2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-sm truncate', task.status==='completed' && 'line-through text-white/30')}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`tag tag-${task.category}`}>{task.category}</span>
                    {task.dueDate && <span className="text-[11px] text-white/25 font-mono">{task.dueDate.split('T')[0]}{task.dueTime?' · '+task.dueTime:''}</span>}
                    {task.estimatedHours>0 && <span className="text-[11px] text-white/25 font-mono">{task.estimatedHours}h</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0" style={{opacity:1}}>
                  <button className="btn btn-ghost btn-sm px-2 hidden sm:inline-flex" onClick={e=>{e.stopPropagation();setSelected(task);setModal('form')}}>Edit</button>
                  <button className="icon-btn icon-btn-danger w-7 h-7" onClick={e=>{e.stopPropagation();setSelected(task);setModal('delete')}}>
                    <Icon name="trash" size={12} color="#F06464"/>
                  </button>
                  <PriorityDot priority={task.priority} />
                </div>
              </div>
            ))}
          </div>

          {/* Detail — hidden on mobile unless selected */}
          {selected && (
            <div className="card lg:sticky lg:top-20 lg:self-start animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Task Details</h3>
                <div className="flex gap-1.5">
                  <button className="icon-btn w-7 h-7" onClick={() => setModal('form')} title="Edit">
                    <Icon name="edit" size={13} color="rgba(255,255,255,0.5)" />
                  </button>
                  <button className="icon-btn icon-btn-danger w-7 h-7" onClick={() => setModal('delete')} title="Delete">
                    <Icon name="trash" size={13} color="#F06464" />
                  </button>
                  <button className="icon-btn w-7 h-7 lg:hidden" onClick={() => setSelected(null)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-base font-semibold mb-2">{selected.title}</p>
              {selected.description && <p className="text-sm text-white/40 leading-relaxed mb-4">{selected.description}</p>}
              <div className="divider" />
              <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                <div>
                  <p className="text-white/30 mb-1">Priority</p>
                  <span className={`badge ${PRI_BADGE[selected.priority]}`}>{selected.priority}</span>
                </div>
                <div>
                  <p className="text-white/30 mb-1">Category</p>
                  <span className={`tag tag-${selected.category}`}>{selected.category}</span>
                </div>
                {selected.dueDate && <div>
                  <p className="text-white/30 mb-1">Due</p>
                  <p className="font-medium">{selected.dueDate.split('T')[0]}</p>
                </div>}
                {selected.estimatedHours>0 && <div>
                  <p className="text-white/30 mb-1">Estimate</p>
                  <p className="font-medium">{selected.estimatedHours}h</p>
                </div>}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className={clsx('btn btn-sm', selected.status==='completed' ? 'btn-ghost' : 'btn-primary')}
                  onClick={() => toggle(selected._id)}
                >
                  {selected.status==='completed' ? 'Mark Pending' : '✓ Mark Done'}
                </button>
              </div>
            </div>
          )}

          {/* Desktop empty detail panel */}
          {!selected && (
            <div className="card hidden lg:flex sticky top-20 self-start">
              <EmptyState icon="📌" message="Select a task to view details" />
            </div>
          )}
        </div>
      </div>

      <Modal open={modal==='form'} onClose={()=>{setModal(null);setSelected(null)}} title={selected?._id ? 'Edit Task' : 'New Task'}>
        <TaskForm initial={selected?._id?selected:null} onSave={handleSave} onClose={()=>{setModal(null);setSelected(null)}} />
      </Modal>
      <Modal open={modal==='delete'} onClose={()=>setModal(null)} title="" maxWidth="max-w-sm">
        <ConfirmDelete onConfirm={handleDelete} onClose={()=>setModal(null)} title="Delete this task?" />
      </Modal>
    </>
  )
}
