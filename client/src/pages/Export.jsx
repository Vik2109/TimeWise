import { useOutletContext } from 'react-router-dom'
import api from '../utils/api'
import Icon from '../components/common/Icon'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const EXPORTS = [
  {icon:'tasks',    iconColor:'#2CC9A0', bg:'bg-teal-300/10',    title:'Tasks Export (CSV)',      sub:'All tasks with dates, categories and status',          path:'/export/tasks.csv',    file:'timewise-tasks.csv'},
  {icon:'calendar', iconColor:'#4A9EF5', bg:'bg-blue-400/10',    title:'Calendar Export (ICS)',   sub:'Import to Google Calendar, Outlook, Apple Calendar',   path:'/export/calendar.ics', file:'timewise-calendar.ics'},
  {icon:'chart',    iconColor:'#F5A623', bg:'bg-amber-300/10',   title:'Full Data Export (JSON)', sub:'Complete archive — tasks, events, habits, pomodoros',   path:'/export/data.json',    file:'timewise-data.json'},
]

export default function Export() {
  const { openSidebar } = useOutletContext() || {};
  const dl=async(path,filename)=>{
    try{
      const res=await api.get(path,{responseType:'blob'})
      const url=window.URL.createObjectURL(new Blob([res.data]))
      const a=document.createElement('a'); a.href=url; a.download=filename; a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`${filename} downloaded!`)
    }catch{ toast.error('Export failed. Try again.') }
  }

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
            <h1 className="text-xl font-semibold tracking-tight">Export Data</h1>
            <p className="text-sm text-white/40 mt-0.5 hidden sm:block">Download your data in multiple formats</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-7 animate-fade-in max-w-[660px]">
        <div className="card mb-4">
          <h3 className="section-title mb-5">Export Reports</h3>
          {EXPORTS.map(e=>(
            <div key={e.title}
              onClick={()=>dl(e.path,e.file)}
              className="flex items-center gap-4 p-4 border border-white/[0.07] rounded-xl cursor-pointer transition-all hover:border-primary-400/50 hover:bg-primary-400/[0.03] mb-3 group">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', e.bg)}>
                <Icon name={e.icon} size={20} color={e.iconColor}/>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-white/35 mt-0.5">{e.sub}</p>
              </div>
              <button className="btn btn-ghost btn-sm opacity-60 group-hover:opacity-100 transition-opacity" onClick={ev=>{ev.stopPropagation();dl(e.path,e.file)}}>
                <Icon name="download" size={13}/> Download
              </button>
            </div>
          ))}
        </div>

        <div className="card mb-4">
          <h3 className="section-title mb-4">Scheduled Reports</h3>
          {[
            {label:'Weekly Summary',    sub:'Every Monday at 8:00 AM'},
            {label:'Monthly Analytics', sub:'1st of each month'},
          ].map(r=>(
            <div key={r.label} className="flex items-center justify-between p-3 bg-surface-100 rounded-xl mb-2">
              <div><p className="text-sm font-medium">{r.label}</p><p className="text-xs text-white/35 mt-0.5">{r.sub}</p></div>
              <span className="badge badge-green">Active</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="section-title mb-3">Account Data (GDPR)</h3>
          <p className="text-sm text-white/40 mb-4 leading-relaxed">Download a complete archive of all your TimeWise data — tasks, events, habits, pomodoro sessions and settings.</p>
          <button className="btn btn-ghost" onClick={()=>dl('/export/data.json','timewise-full-archive.json')}>
            <Icon name="download" size={14}/> Download full archive
          </button>
        </div>
      </div>
    </>
  )
}
