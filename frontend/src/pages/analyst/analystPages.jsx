// ═══════════════════════════════════════════════════════════════════════
// ANALYST PORTAL — All pages · Inter · GitHub/Fly.io design language
// ═══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge, StatCard, ScanLauncher, ThreatFeedWidget, ToastContainer, toast, DataTable, Modal } from '../../components/shared';
import api from '../../utils/api';

const analystNav = [
  { path:'/analyst',               label:'Overview',            icon:'▦', exact:true },
  { path:'/analyst/clients',       label:'My Projects',         icon:'⬡' },
  { path:'/analyst/services',      label:'Service Hub',         icon:'⚡' },
  { path:'/analyst/documents',     label:'Document Vault',      icon:'≡' },
  { path:'/analyst/consultations', label:'Consultations',       icon:'◈' },
  { path:'/analyst/governance',    label:'Governance & Billing',icon:'$' },
];

export function AnalystLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  const getTitle = () => {
    const item = analystNav.find(i => isActive(i.path, i.exact));
    if (item) return item.label;
    if (location.pathname === '/analyst/ai-assistant') return 'AI Security Assistant';
    return 'Analyst Portal';
  };

  return (
    <div className="portal-layout">
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:199 }}/>}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.jpg" alt="" className="sidebar-logo" onError={e => e.target.style.display='none'}/>
          <div>
            <div className="sidebar-brand">Chayil <span>SecureX</span></div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.12em' }}>Analyst Portal</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-group-label">Operational Core</div>
            {analystNav.map(item => (
              <div key={item.path} className={`nav-item${isActive(item.path, item.exact) ? ' active' : ''}`} onClick={() => { navigate(item.path); setOpen(false); }}>
                <span className="nav-icon">{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
          <div className="nav-group">
            <div className="nav-group-label">Intelligent Support</div>
            <div className={`nav-item${isActive('/analyst/ai-assistant') ? ' active' : ''}`} onClick={() => { navigate('/analyst/ai-assistant'); setOpen(false); }}>
              <span className="nav-icon">❆</span>AI Assistant
            </div>
            <div className={`nav-item${isActive('/analyst') && location.hash === '#scan' ? ' active' : ''}`} onClick={() => { navigate('/analyst'); setOpen(false); }}>
              <span className="nav-icon">🔍</span>Launch Scan
            </div>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => { logout(); navigate('/login'); }}>
            <div className="user-avatar">{user?.name?.[0] || 'A'}</div>
            <div>
              <div className="user-name">{user?.name || 'Analyst'}</div>
              <div className="user-role">{user?.role || 'analyst'}</div>
            </div>
            <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.2)', fontSize:12 }}>↥</span>
          </div>
        </div>
      </aside>

      <main className="portal-main">
        <div className="portal-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setOpen(!open)} className="mobile-menu-btn"
              style={{ background:'none', border:'none', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:16, display:'none' }}>☰</button>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#fff', letterSpacing:'-0.02em' }}>
                {getTitle()}
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>SOC Intelligence & Governance Hub</div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', background:'rgba(63,185,80,0.08)', border:'1px solid rgba(63,185,80,0.18)', borderRadius:4, fontSize:10, color:'var(--color-success)', fontWeight:600 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--color-success)', display:'inline-block' }}/>LIVE
            </div>
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,var(--indigo),var(--violet))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', border:'none', cursor:'pointer' }}>
              {user?.name?.[0] || 'A'}
            </button>
          </div>
        </div>
        <div className="portal-content">
          <Outlet />
        </div>
      </main>
      <style>{`@media(max-width:1024px){.mobile-menu-btn{display:flex !important;}}`}</style>
    </div>
  );
}

import PipelineWizard from '../../components/PipelineWizard';

// ── SOC DASHBOARD ──────────────────────────────────────────────────────
export function AnalystDashboard() {
  const [stats, setStats] = useState({ alerts:0, incidents:0, threats:0, scans:0 });
  const [activeTab, setActiveTab] = useState('pipeline'); // pipeline | alerts

  useEffect(() => {
    api.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 pb-20">
      <div className="page-header">
        <h1 className="page-title">SOC Operations Center</h1>
        <p className="page-sub">Elite multi-stage reconnaissance and threat verification pipeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <StatCard label="Live Alerts" value={stats.open_incidents || 0} icon="⚡" color="#ef4444" />
        <StatCard label="Threat Vectors" value={stats.threats || 0} icon="⬡" color="#f59e0b" />
        <StatCard label="Active Jobs" value={stats.scans || 0} icon="🔍" color="#6366f1" />
        <StatCard label="Monitored Assets" value={stats.assets || 0} icon="◈" color="#10b981" />
      </div>

      <div className="glass-card">
         <div className="flex border-b border-white/5">
            <button onClick={() => setActiveTab('pipeline')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pipeline' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}>Pipeline Launcher</button>
            <button onClick={() => setActiveTab('vulns')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'vulns' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}>Finding Editor</button>
            <button onClick={() => setActiveTab('alerts')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'alerts' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}>Live Incident Feed</button>
         </div>
         <div className="p-8">
            {activeTab === 'pipeline' ? <PipelineWizard /> : activeTab === 'vulns' ? <FindingHubSection /> : <AlertFeedSection />}
         </div>
      </div>
    </div>
  );
}

function FindingHubSection() {
   const [findings, setFindings] = useState([]);
   const [editModal, setEditModal] = useState(false);
   const [current, setCurrent] = useState(null);

   useEffect(() => {
     api.get('/api/vulnerabilities').then(r => setFindings(r.data.vulnerabilities || [])).catch(() => {});
   }, []);

   const saveFinding = async () => {
      try {
         await api.patch(`/api/vulnerabilities/${current.id}`, current);
         toast.success("Finding updated");
         setEditModal(false);
         setFindings(findings.map(f => f.id === current.id ? current : f));
      } catch {
         toast.error("Update failed");
      }
   };

   return (
      <div className="space-y-4">
         <div className="table-wrap">
            <table className="data-table">
               <thead><tr><th>Severity</th><th>Title</th><th>Asset</th><th>Status</th><th>Action</th></tr></thead>
               <tbody>
                  {findings.map(f => (
                     <tr key={f.id}>
                        <td><Badge label={f.severity} variant={f.severity} /></td>
                        <td className="text-white font-bold">{f.title}</td>
                        <td className="text-slate-500 text-[11px]">{f.ip_address || 'Cloud Node'}</td>
                        <td><Badge label={f.status} variant={f.status} /></td>
                        <td><button className="btn btn-ghost btn-sm" onClick={() => { setCurrent(f); setEditModal(true); }}>Edit</button></td>
                     </tr>
                  ))}
                  {findings.length === 0 && <tr><td colSpan="5" className="text-center py-12 text-slate-500">No findings identified in current audits</td></tr>}
               </tbody>
            </table>
         </div>

         <Modal open={editModal} onClose={() => setEditModal(false)} title="Triage Finding">
            {current && (
               <div className="space-y-4">
                  <div><label className="label">CVSS SCORE</label><input type="number" step="0.1" className="input" value={current.cvss_score || 0} onChange={e=>setCurrent({...current, cvss_score: e.target.value})} /></div>
                  <div><label className="label">STATUS</label>
                     <select className="input" value={current.status} onChange={e=>setCurrent({...current, status: e.target.value})}>
                        {['open', 'verified', 'remediated', 'risk_accepted', 'false_positive'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                     </select>
                  </div>
                  <div><label className="label">SOLUTION / REMEDIATION</label><textarea className="input min-h-[100px]" value={current.solution || ''} onChange={e=>setCurrent({...current, solution: e.target.value})} /></div>
                  <button className="btn btn-primary btn-full" onClick={saveFinding}>Commit Changes</button>
               </div>
            )}
         </Modal>
      </div>
   );
}

function AlertFeedSection() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    api.get('/api/incidents').then(r => setAlerts((r.data.incidents||[]))).catch(() => {});
  }, []);

  const sev = { critical:'#ef4444', high:'#f59e0b', medium:'#8b5cf6', low:'#10b981' };

  return (
    <div className="space-y-4">
      {alerts.map(a => (
        <div key={a.id} className="p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-6 group">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: sev[a.severity]||'#6366f1', boxShadow: `0 0 10px ${sev[a.severity]}` }}/>
          <div className="flex-1">
             <div className="text-sm font-bold text-white mb-1">{a.title}</div>
             <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>{a.category}</span>
                <span className="text-slate-700">|</span>
                <span>{new Date(a.created_at).toLocaleString()}</span>
             </div>
          </div>
          <button className="btn btn-ghost btn-sm opacity-0 group-hover:opacity-100 transition-opacity">Triage →</button>
        </div>
      ))}
      {alerts.length === 0 && (
        <div className="py-20 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
          No active indicators in the current window
        </div>
      )}
    </div>
  );
}

// ── THREAT WORKSPACE ───────────────────────────────────────────────────
export function ThreatWorkspace() {
  const [iocVal, setIocVal] = useState('');
  const [iocRes, setIocRes] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkIOC = async () => {
    if (!iocVal.trim()) return;
    setChecking(true); setIocRes(null);
    try {
      const r = await api.post('/api/threats/check', { value: iocVal });
      setIocRes(r.data);
    } catch {
      setIocRes({ found: false, error: true });
    }
    setChecking(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Threat Workspace</h1>
        <p className="page-sub">IOC enrichment, threat feeds, OSINT intelligence</p>
      </div>
      <div className="grid-2" style={{ gap:16, marginBottom:20 }}>
        <div style={{ background:'var(--bg-overlay)', border:'1px solid var(--border-default)', borderRadius:8, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--fg-default)', marginBottom:14 }}>IOC Quick Check</div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <input className="input" value={iocVal} onChange={e => setIocVal(e.target.value)} placeholder="IP, domain, hash, or URL…" onKeyDown={e => e.key==='Enter' && checkIOC()}/>
            <button className="btn btn-primary" onClick={checkIOC} disabled={checking}>{checking ? '…' : 'Check'}</button>
          </div>
          {iocRes && (
            <div style={{ padding:'10px 14px', borderRadius:6, background: iocRes.found ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.1)', border:`1px solid ${iocRes.found ? 'rgba(248,81,73,0.25)' : 'rgba(63,185,80,0.25)'}` }}>
              <div style={{ fontSize:13, fontWeight:600, color: iocRes.found ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {iocRes.found ? '⚠ THREAT DETECTED' : '✓ Clean — Not in threat DB'}
              </div>
              {iocRes.ioc && <div style={{ fontSize:12, color:'var(--fg-muted)', marginTop:4 }}>{iocRes.ioc.description}</div>}
            </div>
          )}
        </div>
        <div style={{ background:'var(--bg-overlay)', border:'1px solid var(--border-default)', borderRadius:8, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--fg-default)', marginBottom:14 }}>OSINT Lookup</div>
          {['domain','ip','email','hash'].map(t => (
            <div key={t} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--border-muted)' }}>
              <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--cyan)', width:50 }}>{t.toUpperCase()}</span>
              <span style={{ fontSize:12, color:'var(--fg-muted)' }}>WHOIS · DNS · AbuseIPDB · VirusTotal</span>
            </div>
          ))}
        </div>
      </div>
      <ThreatFeedWidget />
    </div>
  );
}

// ── SOC VISIBILITY ─────────────────────────────────────────────────────
export function SOCVisibility() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/audit').then(r => {
      setEvents(r.data.logs || []);
    }).finally(() => setLoading(false));
  }, []);
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">SOC Visibility</h1>
        <p className="page-sub">Live SIEM — network events, packet analysis, alert correlation</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--color-success)', animation:'pulse 1.5s ease-in-out infinite' }}/>
        <span style={{ fontSize:12, color:'var(--color-success)', fontFamily:'var(--font-mono)' }}>LIVE MONITORING ACTIVE</span>
        <span style={{ fontSize:11, color:'var(--fg-subtle)', marginLeft:'auto' }}>Last event: 2s ago</span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th><th>Source</th><th>Destination</th><th>Event Type</th><th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e,i) => (
              <tr key={i}>
                <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{new Date(e.created_at).toLocaleTimeString()}</td>
                <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{e.ip_address || 'internal'}</td>
                <td style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{e.resource || 'portal'}</td>
                <td style={{ fontSize:13 }}>{e.action}</td>
                <td><Badge label={e.status || 'info'} variant={e.status === 'success' ? 'low' : 'critical'}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

// ── LOG ANALYSIS ───────────────────────────────────────────────────────
export function LogAnalysis() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    api.get('/api/audit').then(r => {
      setLogs((r.data.logs || []).map(l => `[${new Date(l.created_at).toLocaleString()}] ${l.status.toUpperCase()} ${l.action}: ${l.details?.message || l.resource || ''}`));
    });
  }, []);
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Log Analysis</h1>
        <p className="page-sub">SIEM log aggregation, pattern detection, forensic timeline</p>
      </div>
      <div style={{ background:'#010409', border:'1px solid var(--border-default)', borderRadius:8, overflow:'hidden' }}>
        <div style={{ padding:'10px 14px', background:'var(--bg-subtle)', borderBottom:'1px solid var(--border-default)', display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#f85149' }}/>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#d29922' }}/>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#3fb950' }}/>
          <span style={{ marginLeft:8, fontSize:12, color:'var(--fg-muted)', fontFamily:'var(--font-mono)' }}>syslog · auth.log · dns.log · firewall.log</span>
        </div>
        <div style={{ padding:16, maxHeight:400, overflowY:'auto' }}>
          {logs.map((l,i) => (
            <div key={i} style={{ fontFamily:'var(--font-mono)', fontSize:12, lineHeight:1.8, color: l.includes('CRITICAL')||l.includes('ERROR') ? 'var(--color-danger)' : l.includes('WARNING') ? 'var(--color-warning)' : '#7ee787' }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── INCIDENT TRIAGE ────────────────────────────────────────────────────
export function IncidentTriage() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [modal, setModal]         = useState(false);

  useEffect(() => {
    api.get('/api/incidents').then(r => setIncidents(r.data.incidents||[])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Incident Triage</h1>
        <p className="page-sub">Active incident management and response coordination</p>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Assignee</th><th>Action</th></tr>
          </thead>
          <tbody>
            {incidents.map(inc => (
              <tr key={inc.id}>
                <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-muted)' }}>{inc.id}</td>
                <td style={{ fontSize:13, maxWidth:320 }}>{inc.title}</td>
                <td><Badge label={inc.severity} variant={inc.severity}/></td>
                <td><Badge label={inc.status} variant={inc.status==='Open'?'open':inc.status==='Closed'?'closed':'progress'}/></td>
                <td style={{ fontSize:12, color:'var(--fg-muted)' }}>{inc.assignee}</td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => { setSelected(inc); setModal(true); }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={selected?.id || 'Incident Detail'}>
        {selected && (
          <div>
            <p style={{ fontSize:16, fontWeight:600, color:'var(--fg-default)', marginBottom:8 }}>{selected.title}</p>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              <Badge label={selected.severity} variant={selected.severity}/>
              <Badge label={selected.status} variant={selected.status==='Open'?'open':'progress'}/>
            </div>
            <div style={{ fontSize:13, color:'var(--fg-muted)', lineHeight:1.65 }}>
              Assigned to: {selected.assignee}<br/>
              All response actions, evidence, and timeline are available in the full incident view.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── PLAYBOOKS ──────────────────────────────────────────────────────────
export function Playbooks() {
  const [books, setBooks] = useState([]);
  useEffect(() => {
    // In a real system, these would come from the /api/playbooks endpoint
    // For now, we clear them to reflect the "real-time" requirement
    setBooks([]);
  }, []);
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">IR Playbooks</h1>
        <p className="page-sub">Automated incident response playbooks and runbooks</p>
      </div>
      <div className="grid-3" style={{ gap:14 }}>
        {books.map(b => (
          <div key={b.name} style={{ background:'var(--bg-overlay)', border:'1px solid var(--border-default)', borderRadius:8, padding:'16px 18px', transition:'var(--trans)', cursor:'pointer' }}
            onMouseOver={e => { e.currentTarget.style.borderColor='var(--cyan-border)'; e.currentTarget.style.background='var(--bg-subtle)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor='var(--border-default)'; e.currentTarget.style.background='var(--bg-overlay)'; }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <span style={{ fontSize:20 }}>▶</span>
              <Badge label={b.status} variant={b.status==='Active'?'low':b.status==='Draft'?'info':'warning'}/>
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--fg-default)', marginBottom:4 }}>{b.name}</div>
            <div style={{ fontSize:12, color:'var(--fg-muted)' }}>{b.steps} steps · Updated {b.updated}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNED CLIENTS
// ─────────────────────────────────────────────────────────────────────────────
export function AssignedClients() {
  const [engagements, setEngagements] = useState([]);
  
  useEffect(() => {
    api.get('/api/portal/engagements').then(r => setEngagements(r.data.engagements || [])).catch(()=>{});
  }, []);

  return (
    <div className="card">
       <div className="page-header">
          <h2 className="page-title">Assigned Engagements</h2>
          <p className="page-sub">Operational views for your active client projects.</p>
       </div>
       <div className="table-wrap">
          <table className="data-table">
             <thead>
                <tr>
                   <th>Organization</th>
                   <th>Project Title</th>
                   <th>Status</th>
                   <th>Progress</th>
                   <th>Deadline</th>
                   <th>Action</th>
                </tr>
             </thead>
             <tbody>
                {engagements.map(e => (
                   <tr key={e.id}>
                      <td className="font-bold">{e.org_name}</td>
                      <td>{e.title}</td>
                      <td><Badge type={e.status==='active'?'success':'indigo'}>{e.status}</Badge></td>
                      <td>
                         <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-cyan-400" style={{ width: `${e.progress}%` }} />
                            </div>
                            <span>{e.progress}%</span>
                         </div>
                      </td>
                      <td>{new Date(e.end_date).toLocaleDateString() || 'TBD'}</td>
                      <td>
                         <button className="btn btn-sm btn-outline">Manage Audits</button>
                      </td>
                   </tr>
                ))}
                {engagements.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-400">No projects assigned.</td></tr>}
             </tbody>
          </table>
       </div>
    </div>
  );
}

export { AnalystLayout as default };
