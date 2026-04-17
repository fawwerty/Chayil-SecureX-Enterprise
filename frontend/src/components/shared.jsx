import React, { useState, useEffect } from 'react';
import api from '../utils/api';

/* ═══════════════════════════════════════════════════
   BADGE
═══════════════════════════════════════════════════ */
export function Badge({ label, variant = 'info' }) {
  const map = {
    critical: 'badge-danger', high: 'badge-danger', medium: 'badge-indigo',
    low: 'badge-success', info: 'badge-indigo', open: 'badge-danger',
    closed: 'badge-success', compliant: 'badge-success', partial: 'badge-indigo',
    non_compliant: 'badge-danger', not_assessed: 'badge-indigo',
    running: 'badge-violet', queued: 'badge-indigo', completed: 'badge-success',
    failed: 'badge-danger', active: 'badge-success', vulnerable: 'badge-danger',
    inactive: 'badge-indigo',
  };
  return <span className={`badge ${map[variant] || map[label?.toLowerCase()] || 'badge-indigo'}`}>{label}</span>;
}

/* ═══════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════ */
export function StatCard({ label, value, icon, change, changeDir, color }) {
  return (
    <div className="stat-card relative overflow-hidden group">
      <div className="flex justify-between items-start mb-3">
        <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
        {change && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${changeDir === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {changeDir === 'up' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <div className="stat-val" style={color ? { color } : {}}>{value}</div>
      <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:6 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════ */
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
      onClick={onClose}
    >
      <div
        style={{ background:'var(--surface-1)', border:'1px solid var(--border-default)', borderRadius:16, width:'100%', maxWidth:680, maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding:'20px 28px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:15, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>{title}</span>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'none', borderRadius:6, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:12 }}>✕</button>
        </div>
        <div style={{ padding:'20px 28px', overflowY:'auto', flex:1 }}>{children}</div>
        {footer && <div style={{ padding:'14px 28px', borderTop:'1px solid var(--border-subtle)', display:'flex', gap:8, justifyContent:'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
let toastFn = null;
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  toastFn = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };
  return (
    <div className="fixed top-24 right-6 z-[99999] flex flex-col gap-3">
      {toasts.map(t => (
        <div key={t.id} className={`glass px-6 py-4 rounded-xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-right duration-300 shadow-2xl ${t.type === 'success' ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${t.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {t.type === 'success' ? '✓' : '✗'}
          </div>
          <span className="text-sm font-bold text-white">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
export const toast = { success: msg => toastFn?.(msg, 'success'), error: msg => toastFn?.(msg, 'error') };

/* ═══════════════════════════════════════════════════
   PROGRESS BAR
═══════════════════════════════════════════════════ */
export function ProgressBar({ value, color = 'indigo', height = 4 }) {
  const cls = { indigo: 'bg-indigo-500', violet: 'bg-violet-500', red: 'bg-red-500', success: 'bg-emerald-500' };
  return (
    <div className="w-full bg-white/5 rounded-full overflow-hidden" style={{ height }}>
      <div className={`${cls[color] || 'bg-indigo-500'} h-full transition-all duration-1000 ease-out`} style={{ width: `${Math.min(value, 100)}%`, boxShadow: `0 0 10px ${color === 'violet' ? 'rgba(139,92,246,0.3)' : 'rgba(99,102,241,0.3)'}` }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DATA TABLE
═══════════════════════════════════════════════════ */
import { exportToCSV } from '../utils/ExportUtils';

export function DataTable({ columns, rows, onRowClick, loading, title = 'Data Table' }) {
  if (loading) return (
    <div className="p-20 text-center text-slate-400 flex flex-col items-center">
      <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin mb-6" />
      <span className="text-xs font-bold uppercase tracking-widest">Compiling Intelligence…</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
         <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title} ({rows.length})</div>
         <button onClick={() => exportToCSV(rows, title.toLowerCase().replace(/\s/g, '_'))} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-2 transition-colors">
            ↓ Export CSV
         </button>
      </div>
      <div className="w-full overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5">
            <tr>
              {columns.map(c => (
                <th key={c.key} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-6 py-12 text-center text-xs text-slate-500">No active signals found</td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.id || i} onClick={() => onRowClick?.(row)} className={`hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map(c => (
                  <td key={c.key} className="px-6 py-5 text-sm text-slate-300 font-medium">
                    {c.render ? c.render(row[c.key], row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SCAN LAUNCHER — used in all portals
═══════════════════════════════════════════════════ */
const TOOLS = {
  nmap:          { name: 'Nmap', icon: '🔍', category: 'Network', color: '#6366f1', desc: 'Port & service scanner', targetHint: 'IP, hostname or CIDR' },
  nikto:         { name: 'Nikto', icon: '🌐', category: 'Web', color: '#8b5cf6', desc: 'Web vulnerability scanner', targetHint: 'URL (e.g. https://site.com)' },
  theharvester:  { name: 'theHarvester', icon: '🕵️', category: 'OSINT', color: '#6366f1', desc: 'Email & domain recon', targetHint: 'Domain name' },
  amass:         { name: 'Amass', icon: '🗺️', category: 'OSINT', color: '#8b5cf6', desc: 'Subdomain enumeration', targetHint: 'Domain name' },
  whatweb:       { name: 'WhatWeb', icon: '🖥️', category: 'Web', color: '#10b981', desc: 'Tech fingerprinting', targetHint: 'URL or hostname' },
  nuclei:        { name: 'Nuclei', icon: '⚡', category: 'Vuln', color: '#ef4444', desc: 'Template-based vuln scanner', targetHint: 'URL or hostname' },
  wafw00f:       { name: 'WafW00f', icon: '🛡️', category: 'Web', color: '#f59e0b', desc: 'WAF detection', targetHint: 'URL or hostname' },
  sqlmap:        { name: 'SQLMap', icon: '💉', category: 'Web', color: '#dc2626', desc: 'SQL injection tester', targetHint: 'URL with parameter' },
};

export function ScanLauncher({ onScanStarted }) {
  const [tool, setTool] = useState('nmap');
  const [target, setTarget] = useState('');
  const [targetType, setTargetType] = useState('ip');
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    api.get('/api/scans').then(r => setRecentScans(r.data.scans || [])).catch(() => {});
  }, [lastScan]);

  const categories = ['All', ...new Set(Object.values(TOOLS).map(t => t.category))];
  const filteredTools = Object.entries(TOOLS).filter(([, t]) => activeCategory === 'All' || t.category === activeCategory);
  const launch = async () => {
    if (!target.trim()) return;
    setLoading(true);
    try {
      const r = await api.post('/api/scans', { tool, target: target.trim(), target_type: targetType, options });
      setLastScan(r.data);
      toast.success(`${TOOLS[tool].name} initiated — ID: ${r.data.scanId?.slice(0, 8)}`);
      onScanStarted?.(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initiate scan');
    } finally {
      setLoading(false);
    }
  };

  const selectedTool = TOOLS[tool];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategory === c ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredTools.map(([k, t]) => (
            <div key={k} onClick={() => setTool(k)} className={`p-5 rounded-2xl cursor-pointer transition-all border ${tool === k ? 'bg-indigo-500/10 border-indigo-500 shadow-xl shadow-indigo-500/10' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
              <div className="text-2xl mb-4">{t.icon}</div>
              <div className={`text-xs font-black uppercase tracking-tighter mb-1 ${tool === k ? 'text-indigo-400' : 'text-white'}`}>{t.name}</div>
              <div className="text-[9px] text-slate-500 leading-tight font-medium">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="label uppercase tracking-[0.2em] text-[9px] mb-3">Target Endpoint</label>
          <input className="input h-14 bg-white/5 border-white/10 !text-base focus:bg-white/10 focus:border-indigo-500/50" value={target} onChange={e => setTarget(e.target.value)} placeholder={selectedTool.targetHint} onKeyDown={e => e.key === 'Enter' && launch()} />
        </div>
        <div>
          <label className="label uppercase tracking-[0.2em] text-[9px] mb-3">Endpoint Type</label>
          <select className="input h-14 bg-white/5 border-white/10" value={targetType} onChange={e => setTargetType(e.target.value)}>
            {['ip', 'domain', 'url', 'cidr', 'hostname'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      <div className="p-5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-[11px] text-slate-400 font-medium">
        <strong className="text-yellow-500/80 mr-2 uppercase tracking-widest">Rules of Engagement:</strong> 
        Deployment of offensive tools is restricted to authorised environments only.
      </div>

      <button className="btn btn-primary h-14 px-12 group uppercase tracking-[0.2em] font-black text-xs" onClick={launch} disabled={loading || !target.trim()}>
        {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : `Execute ${selectedTool.name} →`}
      </button>

      {recentScans.length > 0 && (
        <div className="mt-12">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Recent Engagements</h4>
          <div className="space-y-3">
            {recentScans.slice(0, 4).map(s => {
              const t = TOOLS[s.tool] || {};
              return (
                <div key={s.id} className="glass p-4 rounded-xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-lg">{t.icon || '🔍'}</span>
                    <span className="text-xs font-bold text-white">{s.target}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <Badge label={s.status} variant={s.status} />
                    {s.risk_score != null && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-1.5 rounded-full bg-white/10 overflow-hidden">
                           <div className={`h-full ${s.risk_score > 70 ? 'bg-red-500' : s.risk_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${s.risk_score}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-white">{s.risk_score}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   RISK SCORE DONUT
═══════════════════════════════════════════════════ */
export function RiskDonut({ score, size = 120 }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const getColor = s => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444';
  const color = getColor(score);
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - (circ * score / 100)}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white tracking-tighter" style={{ color }}>{score}</span>
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Score</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   THREAT FEED WIDGET
═══════════════════════════════════════════════════ */
export function ThreatFeedWidget() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get('/api/threats/feed').then(r => setItems(r.data.feed || [])).catch(() => {});
  }, []);
  const sevColor = { critical: '#ef4444', high: '#f59e0b', medium: '#8b5cf6', low: '#10b981' };
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all">
          <div className="text-xs font-bold text-white mb-2 leading-tight">{item.title}</div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: sevColor[item.severity] || '#6366f1' }}>{item.severity}</span>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">{item.source}</span>
            <span className="text-[9px] text-slate-600 font-medium ml-auto">{new Date(item.published).toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
