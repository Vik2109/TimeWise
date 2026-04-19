import { useState, useMemo } from 'react'
import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { useEvents } from '../hooks/index'
import { Modal, ConfirmDelete, Field } from '../components/common/UI'
import Icon from '../components/common/Icon'
import clsx from 'clsx'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const CAT_COLORS = { accent:'#7C6BF0', teal:'#2CC9A0', amber:'#F5A623', coral:'#F06464', blue:'#4A9EF5' }
const CAT_BG     = { accent:'rgba(124,107,240,0.15)', teal:'rgba(44,201,160,0.12)', amber:'rgba(245,166,35,0.1)', coral:'rgba(240,100,100,0.12)', blue:'rgba(74,158,245,0.1)' }
const CAT_BORDER = { accent:'border-l-[#7C6BF0]', teal:'border-l-[#2CC9A0]', amber:'border-l-[#F5A623]', coral:'border-l-[#F06464]', blue:'border-l-[#4A9EF5]' }

function EventForm({ initial, onSave, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const [f, setF] = useState(initial || { title:'', date:today, startTime:'09:00', endTime:'10:00', category:'accent', location:'' })
  const [saving, setSaving] = useState(false)
  const s = k => e => setF(p=>({...p,[k]:e.target.value}))

  const submit = async (e) => { e.preventDefault(); if(!f.title.trim()) return; setSaving(true); try { await onSave(f) } finally { setSaving(false) } }

  return (
    <form onSubmit={submit}>
      <Field label="Event Title *"><input className="input" value={f.title} onChange={s('title')} autoFocus required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input className="input" type="date" value={f.date} onChange={s('date')} /></Field>
        <Field label="Category">
          <select className="input" value={f.category} onChange={s('category')}>
            {Object.keys(CAT_COLORS).map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Time"><input className="input" type="time" value={f.startTime} onChange={s('startTime')} /></Field>
        <Field label="End Time"><input className="input" type="time" value={f.endTime} onChange={s('endTime')} /></Field>
      </div>
      <Field label="Location / Link"><input className="input" value={f.location} onChange={s('location')} placeholder="Zoom, Google Meet…" /></Field>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Saving…':initial?._id?'Update Event':'Save Event'}</button>
      </div>
    </form>
  )
}

export default function Calendar() {
  const { openSidebar } = useOutletContext() || {}
  const [view, setView]       = useState('month')
  const [curDate, setCurDate] = useState(new Date())
  const [selDate, setSelDate] = useState(new Date().toISOString().split('T')[0])
  const [modal, setModal]     = useState(null)
  const [editEvt, setEditEvt] = useState(null)
  const [delEvt,  setDelEvt]  = useState(null)
  const todayStr = new Date().toISOString().split('T')[0]

  const qp = useMemo(() => {
    const y=curDate.getFullYear(), m=curDate.getMonth()
    if(view==='month') return { month:`${y}-${String(m+1).padStart(2,'0')}` }
    if(view==='week') {
      const sun=new Date(curDate); sun.setDate(curDate.getDate()-curDate.getDay())
      const sat=new Date(sun); sat.setDate(sun.getDate()+6)
      const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      return { startDate:fmt(sun), endDate:fmt(sat) }
    }
    return { date:`${y}-${String(m+1).padStart(2,'0')}-${String(curDate.getDate()).padStart(2,'0')}` }
  }, [curDate, view])

  const { events, create, update, remove } = useEvents(qp)

  const nav = dir => {
    const d=new Date(curDate)
    if(view==='month') d.setMonth(d.getMonth()+dir)
    else if(view==='week') d.setDate(d.getDate()+dir*7)
    else d.setDate(d.getDate()+dir)
    setCurDate(d)
  }

  const fmtTitle = () => {
    if(view==='month') return `${MONTHS[curDate.getMonth()]} ${curDate.getFullYear()}`
    if(view==='week') {
      const sun=new Date(curDate); sun.setDate(curDate.getDate()-curDate.getDay())
      const sat=new Date(sun); sat.setDate(sun.getDate()+6)
      return `${MONTHS[sun.getMonth()]} ${sun.getDate()} – ${MONTHS[sat.getMonth()]} ${sat.getDate()}`
    }
    return `${DAYS[curDate.getDay()]}, ${MONTHS[curDate.getMonth()]} ${curDate.getDate()}`
  }

  const handleSave = async (form) => {
    editEvt ? await update(editEvt._id, form) : await create(form)
    setModal(null); setEditEvt(null)
  }
  const handleDelete = async () => { await remove(delEvt._id); setModal(null); setDelEvt(null) }

  const MonthView = () => {
    const y=curDate.getFullYear(), m=curDate.getMonth()
    const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate(), prev=new Date(y,m,0).getDate()
    const cells = []
    for(let i=0;i<first;i++) cells.push(<div key={`p${i}`} className="cal-day other-month">{prev-first+1+i}</div>)
    for(let d=1;d<=days;d++) {
      const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      const dEvts=events.filter(e=>e.date===ds)
      cells.push(
        <div key={d} className={clsx('cal-day', ds===todayStr&&'today', ds===selDate&&ds!==todayStr&&'selected')}
          onClick={()=>{ setCurDate(new Date(y,m,d)); setSelDate(ds) }}>
          {d}
          {dEvts.length>0 && <div className="flex gap-0.5">{dEvts.slice(0,3).map(e=><div key={e._id} className="w-1 h-1 rounded-full" style={{background:CAT_COLORS[e.category]||'#7C6BF0'}} />)}</div>}
        </div>
      )
    }
    const rem=(7-(first+days)%7)%7
    for(let i=1;i<=rem;i++) cells.push(<div key={`n${i}`} className="cal-day other-month">{i}</div>)
    return (
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map(d=><div key={d} className="text-center text-[11px] font-semibold text-white/25 uppercase tracking-wide py-2">{d}</div>)}
        {cells}
      </div>
    )
  }

  const WeekView = () => {
    const sun=new Date(curDate); sun.setDate(curDate.getDate()-curDate.getDay())
    const wDates=Array.from({length:7},(_,i)=>{ const d=new Date(sun); d.setDate(sun.getDate()+i); return { d, s:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` } })
    const hours=Array.from({length:13},(_,i)=>i+8)
    return (
      <div className="overflow-x-auto">
        <div className="grid border border-white/[0.07] rounded-xl overflow-hidden" style={{gridTemplateColumns:'52px repeat(7,1fr)',minWidth:560}}>
          <div className="bg-surface-100 p-2 border-b border-r border-white/[0.07]" />
          {wDates.map(({d,s})=>(
            <div key={s} className={clsx('p-2 text-center border-b border-r border-white/[0.07]', s===todayStr?'bg-primary-400/10':'bg-surface-100')}>
              <p className="text-[10px] text-white/30 mb-0.5">{DAYS[d.getDay()]}</p>
              <p className={clsx('text-base font-medium', s===todayStr&&'text-primary-300')}>{d.getDate()}</p>
            </div>
          ))}
          {hours.map(h=>(
            <React.Fragment key={h}>
              <div className="bg-surface-100 text-[10px] font-mono text-white/25 text-right pr-2 py-2 border-r border-b border-white/[0.07]">{h}:00</div>
              {wDates.map(({s})=>{
                const hEvts=events.filter(e=>e.date===s&&parseInt(e.startTime)===h)
                return (
                  <div key={s} className={clsx('relative min-h-[44px] border-r border-b border-white/[0.07] hover:bg-white/[0.02] transition-colors', s===todayStr&&'bg-primary-400/[0.02]')}>
                    {hEvts.map(e=>(
                      <div key={e._id} onClick={()=>{setEditEvt(e);setModal('form')}}
                        style={{background:CAT_BG[e.category],color:CAT_COLORS[e.category],borderLeftColor:CAT_COLORS[e.category]}}
                        className="absolute inset-x-0.5 top-0.5 border-l-2 rounded px-1.5 py-0.5 text-[10px] font-medium cursor-pointer overflow-hidden whitespace-nowrap text-ellipsis z-10">
                        {e.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  const DayView = () => {
    const ds=`${curDate.getFullYear()}-${String(curDate.getMonth()+1).padStart(2,'0')}-${String(curDate.getDate()).padStart(2,'0')}`
    const dEvts=events.filter(e=>e.date===ds)
    return (
      <div className="space-y-0">
        {Array.from({length:15},(_,i)=>i+7).map(h=>{
          const hEvts=dEvts.filter(e=>parseInt(e.startTime)===h)
          return (
            <div key={h} className="flex gap-3 min-h-[52px] border-b border-white/[0.07]">
              <div className="w-12 shrink-0 pt-1.5 text-[10px] font-mono text-white/25 text-right">{h}:00</div>
              <div className="flex-1 py-1 space-y-1">
                {hEvts.map(e=>(
                  <div key={e._id} className="flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-opacity hover:opacity-80"
                    style={{background:CAT_BG[e.category],borderLeft:`3px solid ${CAT_COLORS[e.category]}`}}
                    onClick={()=>{setEditEvt(e);setModal('form')}}>
                    <div>
                      <p className="text-sm font-medium" style={{color:CAT_COLORS[e.category]}}>{e.title}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{e.startTime}–{e.endTime}{e.location?' · '+e.location:''}</p>
                    </div>
                    <button className="icon-btn icon-btn-danger w-6 h-6" onClick={ev=>{ev.stopPropagation();setDelEvt(e);setModal('delete')}}>
                      <Icon name="trash" size={11} color="#F06464"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const panelEvts = view==='month' ? events.filter(e=>e.date===selDate) : events

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
            <h1 className="text-xl font-semibold tracking-tight">Calendar</h1>
            <p className="text-sm text-white/40 mt-0.5 hidden sm:block">{fmtTitle()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-surface-100 p-1 rounded-lg">
            {['month','week','day'].map(v=>(
              <button key={v} onClick={()=>setView(v)} className={clsx('px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all capitalize', view===v?'bg-surface-50 text-white shadow-sm':'text-white/40 hover:text-white')}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
          <button className="icon-btn" onClick={()=>nav(-1)}><Icon name="chevLeft" size={17} color="rgba(255,255,255,0.5)"/></button>
          <button className="icon-btn" onClick={()=>nav(1)}><Icon name="chevRight" size={17} color="rgba(255,255,255,0.5)"/></button>
          <button className="btn btn-primary" onClick={()=>{setEditEvt(null);setModal('form')}}>
            <Icon name="plus" size={14}/> <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-7 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          <div className="card">
            {view==='month' && <MonthView />}
            {view==='week'  && <WeekView />}
            {view==='day'   && <DayView />}
            <div className="divider" />
            <div className="flex flex-wrap gap-3">
              {Object.entries(CAT_COLORS).map(([k,v])=>(
                <div key={k} className="flex items-center gap-1.5 text-xs text-white/40">
                  <div className="w-2 h-2 rounded-sm" style={{background:v}} />
                  {k.charAt(0).toUpperCase()+k.slice(1)}
                </div>
              ))}
            </div>
          </div>

          <div className="card sticky top-20 self-start">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">{view==='month'?selDate:view==='day'?fmtTitle():'This Week'}</h3>
              <button className="btn btn-primary btn-sm" onClick={()=>{setEditEvt(null);setModal('form')}}>+ Add</button>
            </div>
            {panelEvts.length===0
              ? <p className="text-sm text-white/25 text-center py-6">No events</p>
              : panelEvts.map(e=>(
                <div key={e._id} className={clsx('event-item', CAT_BORDER[e.category]||'border-l-primary-400')}>
                  <span className="text-[11px] font-mono text-white/30 w-12 shrink-0 pt-0.5">{e.startTime}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-white/35 mt-0.5">{e.endTime}{e.location?' · '+e.location:''}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="icon-btn w-6 h-6" onClick={()=>{setEditEvt(e);setModal('form')}}><Icon name="edit" size={11} color="rgba(255,255,255,0.4)"/></button>
                    <button className="icon-btn icon-btn-danger w-6 h-6" onClick={()=>{setDelEvt(e);setModal('delete')}}><Icon name="trash" size={11} color="#F06464"/></button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <Modal open={modal==='form'} onClose={()=>{setModal(null);setEditEvt(null)}} title={editEvt?'Edit Event':'Add Event'}>
        <EventForm initial={editEvt} onSave={handleSave} onClose={()=>{setModal(null);setEditEvt(null)}} />
      </Modal>
      <Modal open={modal==='delete'} onClose={()=>setModal(null)} title="" maxWidth="max-w-sm">
        <ConfirmDelete onConfirm={handleDelete} onClose={()=>setModal(null)} title="Delete this event?" />
      </Modal>
    </>
  )
}
