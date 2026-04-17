// ═══════════════════════════════════════════════════════════════════════════════
// ALL REMAINING ADMIN PAGES — exported individually
// ═══════════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef } from 'react';
import { Badge, StatCard, ProgressBar, Modal, ToastContainer, toast, ThreatFeedWidget, RiskDonut, ScanLauncher } from '../../components/shared';
import { exportToCSV } from '../../utils/ExportUtils';
import api from '../../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// CISO ADVISORY
// ─────────────────────────────────────────────────────────────────────────────
export function CISOAdvisory() {
  const [maturityDomains, setMaturityDomains] = useState([]);
  const [priorities, setPriorities] = useState([]);

  useEffect(() => {
    api.get('/api/advisory').then(r => {
      setMaturityDomains(r.data.maturity || []);
      setPriorities(r.data.roadmap || []);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">CISO Advisory & Strategy</h1>
        <p className="page-sub">Security program maturity, strategic roadmap, and board-level reporting</p>
      </div>
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="chart-title" style={{ marginBottom: 16 }}>Security Maturity Model (1–5)</div>
          {maturityDomains.map(d => (
            <div key={d.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 5 }}>
                <span>{d.name}</span>
                <span style={{ color: d.color, fontWeight: 700 }}>Level {d.level}/{d.max}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: d.max }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i < d.level ? d.color : 'var(--bg-elevated)', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="chart-title" style={{ marginBottom: 16 }}>Board Security Metrics</div>
          {[{l:'Security Budget Utilised',v:78},{l:'Incidents Resolved <SLA',v:92},{l:'Phishing Click Rate',v:4},{l:'Patch Compliance',v:87},{l:'MFA Adoption',v:96}].map(m => (
            <div key={m.l} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 5 }}>
                <span>{m.l}</span>
                <span style={{ color: m.v < 20 && m.l.includes('Click') ? '#34d399' : m.v > 80 ? '#34d399' : '#fbbf24', fontWeight: 700 }}>{m.v}%</span>
              </div>
              <ProgressBar value={m.v} color={m.v > 80 ? 'green' : 'gold'} />
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: '22px 0' }}>
        <div style={{ padding: '0 22px 16px' }}><span className="chart-title">Strategic Security Roadmap</span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>Priority</th><th>Initiative</th><th>Business Impact</th><th>Effort</th><th>Timeline</th><th>Status</th></tr></thead>
            <tbody>
              {priorities.map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{p.id}</td>
                  <td style={{ fontWeight: 500 }}>{p.title}</td>
                  <td><Badge label={p.impact} variant={p.impact.toLowerCase()} /></td>
                  <td><span className="badge badge-info">{p.effort}</span></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.timeline}</td>
                  <td><Badge label={p.status} variant={p.status === 'In Progress' ? 'progress' : p.status === 'Not Started' ? 'info' : 'low'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THREAT INTELLIGENCE
// ─────────────────────────────────────────────────────────────────────────────
export function ThreatIntelligence() {
  const [iocs, setIocs] = useState([]);
  const [checkVal, setCheckVal] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [newIoc, setNewIoc] = useState({ type: 'ip', value: '', threat_type: '', confidence: 80, severity: 'medium', source: '' });

  useEffect(() => {
    api.get('/api/threats').then(r => setIocs(r.data.iocs || [])).catch(() => {});
  }, []);

  const checkIOC = async () => {
    if (!checkVal.trim()) return;
    setChecking(true);
    try {
      const r = await api.post('/api/threats/check', { value: checkVal.trim() });
      setCheckResult(r.data);
    } catch { setCheckResult({ found: false, value: checkVal }); }
    finally { setChecking(false); }
  };

  const addIOC = async () => {
    try {
      await api.post('/api/threats/ioc', newIoc);
      toast.success('IOC added to database');
      setAddModal(false);
      api.get('/api/threats').then(r => setIocs(r.data.threats || [])).catch(() => {});
    } catch { toast.error('Failed to add IOC'); }
  };

  const sevColor = { critical: '#ef4444', high: '#f59e0b', medium: '#e8c252', low: '#34d399', info: '#0ecfcf' };

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div><h1 className="page-title">Threat Intelligence</h1><p className="page-sub">IOC database, threat feeds, AbuseIPDB & VirusTotal enrichment</p></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => exportToCSV(iocs, 'threat_iocs')}>↓ Export IOCs</button>
            <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>+ Add IOC</button>
          </div>
        </div>
      </div>

      {/* IOC Checker */}
      <div className="card" style={{ padding: 22, marginBottom: 24 }}>
        <div className="chart-title" style={{ marginBottom: 14 }}>🔍 IOC Quick Check — IP / Domain / Hash / URL</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" style={{ flex: 1 }} value={checkVal} onChange={e => setCheckVal(e.target.value)} placeholder="e.g. 185.220.101.45 or malware.ru or SHA256 hash" onKeyDown={e => e.key === 'Enter' && checkIOC()} />
          <button className="btn btn-teal" onClick={checkIOC} disabled={checking}>{checking ? '…' : 'Check'}</button>
        </div>
        {checkResult && (
          <div style={{ marginTop: 14, padding: 16, background: checkResult.found ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${checkResult.found ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 10 }}>
            <div style={{ fontWeight: 700, color: checkResult.found ? '#f87171' : '#34d399', marginBottom: 6 }}>
              {checkResult.found ? '⚠️ MALICIOUS — Found in IOC Database' : '✓ Clean — Not found in IOC Database'}
            </div>
            {checkResult.ioc && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Badge label={checkResult.ioc.severity} variant={checkResult.ioc.severity} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Type: {checkResult.ioc.threat_type}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Source: {checkResult.ioc.source}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Confidence: {checkResult.ioc.confidence}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid-3-1" style={{ marginBottom: 24 }}>
        {/* IOC Table */}
        <div className="card" style={{ padding: '22px 0' }}>
          <div style={{ padding: '0 22px 16px' }}><span className="chart-title">IOC Database ({iocs.length} entries)</span></div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead><tr><th>Type</th><th>Value</th><th>Threat Type</th><th>Severity</th><th>Confidence</th><th>Source</th></tr></thead>
              <tbody>
                {iocs.map(ioc => (
                  <tr key={ioc.id}>
                    <td><span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>{ioc.type}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--teal)' }}>{ioc.value}</td>
                    <td style={{ fontSize: '0.82rem' }}>{ioc.threat_type}</td>
                    <td><Badge label={ioc.severity} variant={ioc.severity} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 60, height: 4 }}>
                          <div className="progress-fill" style={{ width: `${ioc.confidence}%`, background: sevColor[ioc.severity] || '#0ecfcf' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ioc.confidence}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ioc.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Live Feed */}
        <div className="card" style={{ padding: 22 }}>
          <div className="chart-title" style={{ marginBottom: 14 }}>Live Threat Feed</div>
          <ThreatFeedWidget />
        </div>
      </div>

      {/* Add IOC Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add IOC to Database"
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setAddModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={addIOC}>Add IOC</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div><label className="label">Type</label>
              <select className="input" value={newIoc.type} onChange={e => setNewIoc(n => ({ ...n, type: e.target.value }))}>
                {['ip','domain','hash','url','email'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Value</label><input className="input" value={newIoc.value} onChange={e => setNewIoc(n => ({ ...n, value: e.target.value }))} placeholder="e.g. 185.220.101.45" /></div>
          </div>
          <div><label className="label">Threat Type</label><input className="input" value={newIoc.threat_type} onChange={e => setNewIoc(n => ({ ...n, threat_type: e.target.value }))} placeholder="e.g. C2, Phishing, Botnet" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label className="label">Severity</label>
              <select className="input" value={newIoc.severity} onChange={e => setNewIoc(n => ({ ...n, severity: e.target.value }))}>
                {['critical','high','medium','low','info'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Confidence %</label><input className="input" type="number" min={1} max={100} value={newIoc.confidence} onChange={e => setNewIoc(n => ({ ...n, confidence: e.target.value }))} /></div>
            <div><label className="label">Source</label><input className="input" value={newIoc.source} onChange={e => setNewIoc(n => ({ ...n, source: e.target.value }))} placeholder="e.g. AbuseIPDB" /></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INCIDENT RESPONSE
// ─────────────────────────────────────────────────────────────────────────────
export function IncidentResponse() {
  const [incidents, setIncidents] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', severity: 'high', category: 'malware' });

  useEffect(() => {
    api.get('/api/incidents').then(r => setIncidents(r.data.incidents || [])).catch(() => {});
  }, []);

  const createIncident = async () => {
    try {
      const r = await api.post('/api/incidents', form);
      setIncidents(i => [r.data.incident, ...i]);
      setAddModal(false);
      toast.success('Incident created');
    } catch { toast.error('Failed to create incident'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/incidents/${id}`, { status });
      setIncidents(i => i.map(inc => inc.id === id ? { ...inc, status } : inc));
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div><h1 className="page-title">Incident Response</h1><p className="page-sub">Detect, contain, eradicate, and recover from security incidents</p></div>
          <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>+ Report Incident</button>
        </div>
      </div>
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {[
          { l:'Open', v: incidents.filter(i=>i.status==='open').length, c:'#ef4444' },
          { l:'Investigating', v: incidents.filter(i=>i.status==='investigating').length, c:'#f59e0b' },
          { l:'Contained', v: incidents.filter(i=>i.status==='contained').length, c:'#0ecfcf' },
          { l:'Closed', v: incidents.filter(i=>i.status==='closed').length, c:'#34d399' },
        ].map(s => <StatCard key={s.l} label={s.l} value={s.v} icon="⚡" color={s.c} />)}
      </div>
      <div className="card" style={{ padding: '22px 0' }}>
        <div style={{ padding: '0 22px 16px' }}><span className="chart-title">Active Incidents</span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Category</th><th>Status</th><th>Reported</th><th>Actions</th></tr></thead>
            <tbody>
              {incidents.map(inc => (
                <tr key={inc.id} style={{ cursor: 'pointer' }}>
                  <td style={{ color: 'var(--teal)', fontWeight: 600, fontSize: '0.82rem' }}>{inc.id}</td>
                  <td style={{ fontWeight: 500 }} onClick={() => setSelected(inc)}>{inc.title}</td>
                  <td><Badge label={inc.severity} variant={inc.severity} /></td>
                  <td><span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{inc.category}</span></td>
                  <td><Badge label={inc.status} variant={inc.status === 'open' ? 'open' : inc.status === 'closed' ? 'closed' : 'progress'} /></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(inc.created_at).toLocaleString()}</td>
                  <td>
                    <select className="input" style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }} value={inc.status} onChange={e => updateStatus(inc.id, e.target.value)}>
                      {['open','investigating','contained','eradicated','closed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Report New Incident"
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setAddModal(false)}>Cancel</button><button className="btn btn-danger btn-sm" onClick={createIncident}>Report Incident</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Incident Title</label><input className="input" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Brief description" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="label">Severity</label>
              <select className="input" value={form.severity} onChange={e => setForm(f=>({...f,severity:e.target.value}))}>
                {['critical','high','medium','low'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Description</label><textarea className="input textarea" rows={4} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="What happened? What systems are affected?" /></div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSET DISCOVERY
// ─────────────────────────────────────────────────────────────────────────────
export function AssetDiscovery() {
  const [assets, setAssets] = useState([]);
  const [scanTarget, setScanTarget] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ name:'', type:'server', ip_address:'', hostname:'', os:'', criticality:'medium' });

  useEffect(() => {
    api.get('/api/assets').then(r => setAssets(r.data.assets || [])).catch(() => {});
  }, []);

  const addAsset = async () => {
    try {
      const r = await api.post('/api/assets', form);
      setAssets(a => [r.data.asset, ...a]);
      setAddModal(false);
      toast.success('Asset added');
    } catch { toast.error('Failed to add asset'); }
  };

  const exportAssets = () => {
    window.open(`${api.defaults.baseURL}/api/assets/export`, '_blank');
  };

  const critColor = { critical:'#ef4444', high:'#f59e0b', medium:'#e8c252', low:'#34d399' };

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div><h1 className="page-title">Asset Discovery</h1><p className="page-sub">Track, inventory, and monitor all your IT assets</p></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" style={{ width: 200 }} placeholder="Scan range (e.g. 10.0.0.0/24)" value={scanTarget} onChange={e => setScanTarget(e.target.value)} />
            <button className="btn btn-teal btn-sm" onClick={() => toast.success('Network discovery scan queued')}>🔍 Discover</button>
            <button className="btn btn-primary btn-sm" onClick={() => setAddModal(true)}>+ Add Asset</button>
          </div>
        </div>
      </div>
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {['server','workstation','network','cloud'].map(t => (
          <StatCard key={t} label={`${t.charAt(0).toUpperCase()+t.slice(1)}s`} value={assets.filter(a=>a.type===t).length} icon={t==='server'?'🖥️':t==='workstation'?'💻':t==='network'?'🌐':'☁️'} />
        ))}
      </div>
      <div className="card" style={{ padding: '22px 0' }}>
        <div style={{ padding: '0 22px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span className="chart-title">Asset Inventory ({assets.length} assets)</span>
           <button onClick={() => exportToCSV(assets, 'asset_inventory')} className="btn btn-ghost btn-sm text-[10px] font-bold text-indigo-400 uppercase tracking-widest">↓ Export CSV</button>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>IP Address</th><th>Hostname</th><th>OS</th><th>Criticality</th><th>Status</th><th>Last Seen</th></tr></thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td><span className="badge badge-info" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>{a.type}</span></td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--teal)', fontSize: '0.85rem' }}>{a.ip_address}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{a.hostname}</td>
                  <td style={{ fontSize: '0.82rem' }}>{a.os}</td>
                  <td><span style={{ color: critColor[a.criticality], fontWeight: 700, fontSize: '0.8rem', textTransform: 'capitalize' }}>{a.criticality}</span></td>
                  <td><Badge label={a.status} variant={a.status === 'active' ? 'closed' : a.status === 'vulnerable' ? 'critical' : 'info'} /></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(a.last_seen || Date.now()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New Asset"
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setAddModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={addAsset}>Add Asset</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div><label className="label">Asset Name</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Web Server 01" /></div>
            <div><label className="label">Type</label>
              <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                {['server','workstation','network','cloud','mobile','iot'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="label">IP Address</label><input className="input" value={form.ip_address} onChange={e=>setForm(f=>({...f,ip_address:e.target.value}))} placeholder="10.0.1.10" /></div>
            <div><label className="label">Hostname</label><input className="input" value={form.hostname} onChange={e=>setForm(f=>({...f,hostname:e.target.value}))} placeholder="web01.corp.local" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div><label className="label">Operating System</label><input className="input" value={form.os} onChange={e=>setForm(f=>({...f,os:e.target.value}))} placeholder="Ubuntu 22.04" /></div>
            <div><label className="label">Criticality</label>
              <select className="input" value={form.criticality} onChange={e=>setForm(f=>({...f,criticality:e.target.value}))}>
                {['critical','high','medium','low'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// REMAINING SIMPLE PAGES
// ─────────────────────────────────────────────────────────────────────────────
export function NetworkMonitoring() {
  const [stats, setStats] = useState({ active_hosts: 0, bandwidth_in: '0 Gbps', bandwidth_out: '0 Mbps', anomalies: 0 });

  useEffect(() => {
    api.get('/api/intel/network').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Network Monitoring</h1><p className="page-sub">Real-time network traffic, topology, and anomaly detection</p></div>
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        <StatCard label="Active Hosts" value={stats.active_hosts} icon="🌐" color="var(--teal)" />
        <StatCard label="Bandwidth In" value={stats.bandwidth_in} icon="↓" color="#34d399" />
        <StatCard label="Bandwidth Out" value={stats.bandwidth_out} icon="↑" color="#0ecfcf" />
        <StatCard label="Anomalies" value={stats.anomalies} icon="⚠️" color="#f59e0b" />
      </div>
      <div className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div className="chart-title" style={{ marginBottom: 16 }}>Network Topology</div>
        <NetworkTopologyCanvas />
      </div>
      <div className="card" style={{ padding: 22 }}>
        <div className="chart-title" style={{ marginBottom: 14 }}>Run Network Scan (nmap / netdiscover)</div>
        <ScanLauncher onScanStarted={() => toast.success('Network scan launched')} />
      </div>
    </div>
  );
}

function NetworkTopologyCanvas() {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || 600;
    canvas.height = 260;
    const ctx = canvas.getContext('2d');
    const nodes = [
      { x:300, y:130, label:'Firewall', color:'#c9a227', r:16, primary:true },
      { x:160, y:80, label:'Web Server', color:'#0ecfcf', r:12 },
      { x:440, y:80, label:'DB Server', color:'#ef4444', r:12 },
      { x:100, y:180, label:'Workstation', color:'#10b981', r:10 },
      { x:200, y:200, label:'Dev WS', color:'#10b981', r:10 },
      { x:420, y:200, label:'Cloud EC2', color:'#8b5cf6', r:12 },
      { x:500, y:160, label:'VPN GW', color:'#06b6d4', r:10 },
    ];
    ctx.clearRect(0,0,canvas.width,canvas.height);
    nodes.slice(1).forEach(n => {
      ctx.beginPath(); ctx.moveTo(nodes[0].x,nodes[0].y); ctx.lineTo(n.x,n.y);
      ctx.strokeStyle='rgba(14,207,207,0.2)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    });
    nodes.forEach(n => {
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fillStyle=n.color+'33'; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.strokeStyle=n.color; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#f0f6ff'; ctx.font=`${n.primary?12:10}px Space Grotesk`; ctx.textAlign='center';
      ctx.fillText(n.label,n.x,n.y+n.r+14);
    });
  }, []);
  return <canvas ref={ref} style={{ width:'100%', height:260, display:'block' }} />;
}

export function CloudSecurity() {
  const [data, setData] = useState({ asset_count: 0, findings: [], cloud_score: 0 });

  useEffect(() => {
    api.get('/api/intel/cloud').then(r => setData(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Cloud Security</h1><p className="page-sub">CSPM — Cloud Security Posture Management across AWS, Azure, GCP</p></div>
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        <StatCard label="Cloud Assets" value={data.asset_count} icon="☁️" />
        <StatCard label="Misconfigs" value={data.findings.length} icon="⚠️" color="#f59e0b" />
        <StatCard label="Cloud Points" value={data.cloud_score} icon="⚡" />
        <StatCard label="Cloud Status" value="Healthy" icon="◈" color="#0ecfcf" />
      </div>
      <div className="card" style={{ padding: '22px 0' }}>
        <div style={{ padding: '0 22px 16px' }}><span className="chart-title">Cloud Misconfigurations</span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>Resource</th><th>Issue</th><th>Severity</th><th>Region</th><th>Action</th></tr></thead>
            <tbody>
                {data.findings.map((f, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--teal)' }}>{f.ip_address || 'Cloud Node'}</td>
                    <td style={{ fontWeight: 500 }}>{f.title}</td>
                    <td><Badge label={f.severity} variant={f.severity.toLowerCase()} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{f.status}</td>
                    <td><button className="btn btn-ghost btn-sm">Remediate</button></td>
                  </tr>
                ))}
                {data.findings.length === 0 && <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No cloud security findings identified</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CyberScoreAfrica() {
  const [domains, setDomains] = useState([]);
  const [overall, setOverall] = useState(0);

  useEffect(() => {
    api.get('/api/analytics/cyberscore').then(r => {
      setDomains(r.data.domains || []);
      setOverall(r.data.overall || 0);
    }).catch(() => {});
  }, []);
  const sevColor = (s) => s >= 80 ? '#34d399' : s >= 65 ? '#fbbf24' : s >= 50 ? '#f97316' : '#ef4444';
  return (
    <div>
      <div className="page-header"><h1 className="page-title">CyberScore™ Africa</h1><p className="page-sub">Africa's first enterprise cybersecurity risk scoring platform</p></div>
      <div className="card" style={{ padding: 32, marginBottom: 24, background: 'linear-gradient(135deg, rgba(14,207,207,0.05), rgba(201,162,39,0.05))', textAlign: 'center' }}>
        <RiskDonut score={overall} size={160} />
        <div style={{ marginTop: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>CyberScore™: {overall}/100</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>{overall >= 80 ? 'Strong Posture' : overall >= 65 ? 'Moderate — Improvement Needed' : 'Weak — Urgent Action Required'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {domains.map(d => (
          <div key={d.name} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{d.name}</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Weight: {d.weight}%</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: sevColor(d.score), fontSize: '1.1rem' }}>{d.score}</span>
              </div>
            </div>
            <ProgressBar value={d.score} color={d.score >= 80 ? 'green' : d.score >= 65 ? 'gold' : 'red'} height={8} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm the Chayil SecureX AI Security Assistant. I can help you understand scan results, explain vulnerabilities, suggest remediation steps, or answer any cybersecurity questions. What do you need help with?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const QUICK = ['Explain Log4Shell vulnerability','What is CVE-2021-41773?','How do I respond to ransomware?','Review my scan results','What is Zero Trust?'];

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const response = await api.post('/api/ai/chat', { message: msg });
      const reply = response.data.reply || 'I apologize, I encountered an issue. Please try again.';
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'AI Assistant connection unavailable. Please check your configuration.';
      setMessages(m => [...m, { role: 'assistant', content: errorMsg }]);
    } finally { setLoading(false); }
  };


  return (
    <div>
      <div className="page-header"><h1 className="page-title">AI Security Assistant</h1><p className="page-sub">Powered by Claude — explains threats, suggests remediation, answers security questions</p></div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {QUICK.map(q => <button key={q} className="btn btn-ghost btn-sm" onClick={() => send(q)}>{q}</button>)}
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 560 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: 12, background: m.role === 'user' ? 'rgba(201,162,39,0.15)' : 'var(--bg-elevated)', border: `1px solid ${m.role === 'user' ? 'rgba(201,162,39,0.3)' : 'var(--border)'}`, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {m.role === 'assistant' && <div style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 700, marginBottom: 6 }}>🤖 CHAYIL AI</div>}
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div style={{ display: 'flex', justifyContent: 'flex-start' }}><div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 12, color: 'var(--teal)', fontSize: '0.85rem' }}>Analysing…</div></div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input className="input" style={{ flex: 1 }} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about vulnerabilities, threats, compliance, or incident response…" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} />
          <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>Send</button>
        </div>
      </div>
    </div>
  );
}

export function IAMModule() {
  const [users, setUsers] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [form, setForm] = useState({
    role: 'client', status: 'active', mfa_enabled: false, mac_clearance: 'Unclassified',
    access_rules: { domains: [], time_restricted: false }
  });

  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'client', mac_clearance: 'Unclassified' });

  const fetchUsers = () => api.get('/api/users').then(r => setUsers(r.data.users || [])).catch(() => {});
  useEffect(() => { fetchUsers(); }, []);

  const sendInvite = async () => {
    try {
      const res = await api.post('/api/users', inviteForm);
      toast.success(`User invited! Temp Password: ${res.data.temp_password}`);
      setInviteModal(false);
      setInviteForm({ name: '', email: '', role: 'client', mac_clearance: 'Unclassified' });
      fetchUsers();
    } catch(err) {
      toast.error(err.response?.data?.error || 'Failed to invite user');
    }
  };

  const openEdit = (u) => {
    setSelectedUser(u);
    setForm({
      role: u.role || 'client', 
      status: u.status || 'active', 
      mfa_enabled: u.mfa_enabled || false, 
      mac_clearance: u.mac_clearance || 'Unclassified',
      access_rules: u.access_rules || { domains: [], time_restricted: false }
    });
    setEditModal(true);
  };

  const handleDomain = (db) => {
    setForm(f => {
      const doms = f.access_rules.domains || [];
      return { ...f, access_rules: { ...f.access_rules, domains: doms.includes(db) ? doms.filter(d => d !== db) : [...doms, db] } };
    });
  };

  const saveIAM = async () => {
    try {
      await api.put(`/api/users/${selectedUser.id}`, form);
      toast.success(`Access policies updated for ${selectedUser.name}`);
      setEditModal(false);
      fetchUsers();
    } catch { toast.error('Failed to update access policies'); }
  };

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div><h1 className="page-title">Identity & Access Management</h1><p className="page-sub">RBAC, MAC, DBAC, MFA Enforcement, and Enterprise Access Control</p></div>
          <button className="btn btn-primary btn-sm" onClick={() => setInviteModal(true)}>+ Invite User</button>
        </div>
      </div>
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        <StatCard label="Total Users" value={users.length} icon="👥" />
        <StatCard label="MFA Enabled" value={users.filter(u=>u.mfa).length} icon="🔐" color="#34d399" />
        <StatCard label="MFA Disabled" value={users.filter(u=>!u.mfa).length} icon="⚠️" color="#ef4444" />
        <StatCard label="Active Sessions" value={users.filter(u=>u.status==='active').length} icon="🔑" color="var(--teal)" />
      </div>
      <div className="card" style={{ padding: '22px 0' }}>
        <div style={{ padding: '0 22px 16px' }}><span className="chart-title">User Management</span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Clearance</th><th>MFA</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td><span className={`badge ${u.role==='admin'?'badge-critical':u.role==='analyst'?'badge-medium':'badge-info'}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.mac_clearance==='Top Secret'?'badge-critical':u.mac_clearance==='Secret'?'badge-progress':'badge-info'}`}>{u.mac_clearance || 'Unclassified'}</span></td>
                  <td>{u.mfa ? <span style={{ color:'#34d399', fontWeight:700 }}>✓</span> : <span style={{ color:'#ef4444', fontWeight:700 }}>✗</span>}</td>
                  <td><Badge label={u.status} variant={u.status === 'active' ? 'closed' : 'info'} /></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.last_login}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {u.role !== 'admin' && <button className="btn btn-outline btn-sm" style={{ borderStyle:'dashed', borderColor:'#8b5cf6', color:'#8b5cf6' }} onClick={() => openEdit(u)}>Assign</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Governance & Access Configuration"
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setEditModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={saveIAM}>Deploy Policies</button></>}>
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-elevated)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600 }}>{selectedUser.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedUser.email}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* RBAC */}
              <div><label className="label">RBAC (Role Based Access)</label>
                <select className="input" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                  <option value="client">Client (Read Only)</option>
                  <option value="analyst">Analyst (Operations)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              {/* MAC */}
              <div><label className="label">MAC (Mandatory Access)</label>
                <select className="input" value={form.mac_clearance} onChange={e=>setForm(f=>({...f,mac_clearance:e.target.value}))}>
                  <option>Unclassified</option>
                  <option>Confidential</option>
                  <option>Secret</option>
                  <option>Top Secret</option>
                </select>
              </div>

              {/* DBAC & DSA Options */}
              <div style={{ gridColumn: '1 / -1' }}><label className="label">DBAC (Data-Based Domain Access)</label>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {['Financial Data', 'HR/PII Data', 'Audit Logs', 'Source Code'].map(db => (
                    <label key={db} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={form.access_rules.domains?.includes(db)} onChange={() => handleDomain(db)} />
                      {db}
                    </label>
                  ))}
                </div>
              </div>

              {/* DSA Dynamic */}
              <div><label className="label">Dynamic Separation (DSA)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.access_rules.time_restricted} onChange={e=>setForm(f=>({...f, access_rules: {...f.access_rules, time_restricted: e.target.checked}}))} />
                  Restrict to Business Hours (9-5)
                </label>
              </div>

              {/* Policy Enforcement */}
              <div><label className="label">Enforcement Policy</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', marginBottom: 8 }}>
                  <input type="checkbox" checked={form.mfa_enabled} onChange={e=>setForm(f=>({...f,mfa_enabled:e.target.checked}))} /> Require Multi-Factor (MFA)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.status === 'suspended'} onChange={e=>setForm(f=>({...f,status:e.target.checked?'suspended':'active'}))} /> Suspend Account
                </label>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Invite New User"
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setInviteModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={sendInvite}>Send Invite</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="label">Full Name</label><input className="input" value={inviteForm.name} onChange={e=>setInviteForm(f=>({...f,name:e.target.value}))} placeholder="Alice Analyst" /></div>
            <div><label className="label">Email Address</label><input className="input" value={inviteForm.email} onChange={e=>setInviteForm(f=>({...f,email:e.target.value}))} placeholder="alice@corp.com" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="label">Role (RBAC)</label>
              <select className="input" value={inviteForm.role} onChange={e=>setInviteForm(f=>({...f,role:e.target.value}))}>
                <option value="client">Client</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div><label className="label">Clearance (MAC)</label>
              <select className="input" value={inviteForm.mac_clearance} onChange={e=>setInviteForm(f=>({...f,mac_clearance:e.target.value}))}>
                <option>Unclassified</option>
                <option>Confidential</option>
                <option>Secret</option>
                <option>Top Secret</option>
              </select>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
            A secure temporary password will be generated and displayed upon invitation.
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function ReportsEngine() {
  const [reports, setReports] = useState([]);
  const [genModal, setGenModal] = useState(false);
  const [form, setForm] = useState({ type:'executive', title:'', filters:{} });

  useEffect(() => {
    api.get('/api/reports').then(r => setReports(r.data.reports || [])).catch(() => {});
  }, []);

  const generate = async () => {
    try {
      const r = await api.post('/api/reports/generate', form);
      setReports(prev => [r.data.report, ...prev]);
      setGenModal(false);
      toast.success('Report generated successfully');
    } catch { toast.error('Failed to generate report'); }
  };

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div><h1 className="page-title">Reports Engine</h1><p className="page-sub">Executive, technical, compliance, and penetration test reports</p></div>
          <button className="btn btn-primary btn-sm" onClick={() => setGenModal(true)}>+ Generate Report</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {reports.map(r => (
          <div key={r.id} className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 10 }}>{r.type==='executive'?'📊':r.type==='compliance'?'✅':r.type==='pentest'?'🔐':'📋'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>{r.title}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <span className="badge badge-info" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>{r.type}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>{new Date(r.created_at).toLocaleDateString()}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => window.open(`${api.defaults.baseURL}/api/portal/documents/${r.id}/download`, '_blank')}>↓ Download</button>
              <button className="btn btn-ghost btn-sm">Share</button>
            </div>
          </div>
        ))}
      </div>
      <Modal open={genModal} onClose={() => setGenModal(false)} title="Generate New Report"
        footer={<><button className="btn btn-ghost btn-sm" onClick={() => setGenModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={generate}>Generate</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Report Type</label>
            <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
              {['executive','technical','compliance','pentest','risk'].map(t=><option key={t} style={{ textTransform:'capitalize' }}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Report Title</label><input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Q2 2024 Security Report" /></div>
          <div><label className="label">Date Range</label>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              <input className="input" type="date" />
              <input className="input" type="date" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSULTATIONS
// ─────────────────────────────────────────────────────────────────────────────
export function ConsultationManager() {
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    api.get('/api/portal/consultations').then(r => setConsultations(r.data.consultations || [])).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Consultation Requests</h1>
        <p className="page-sub">Review and follow up on client consultation requests</p>
      </div>
      <div className="card" style={{ padding: '22px 0' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>Client Name</th><th>Organization</th><th>Subject</th><th>Message</th><th>Date</th></tr></thead>
            <tbody>
              {consultations.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.user_name}</td>
                  <td><span className="badge badge-info">{c.org_name}</span></td>
                  <td style={{ color: 'var(--teal)' }}>{c.subject}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.message.length > 50 ? c.message.slice(0, 50) + '...' : c.message}</td>
                  <td style={{ fontSize: '0.78rem' }}>{new Date(c.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {consultations.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>No consultations requested yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNANCE CONTROL
// ─────────────────────────────────────────────────────────────────────────────
export function GovernanceControl() {
  const [approvals, setApprovals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/scans/approvals'),
      api.get('/api/audit')
    ]).then(([a, l]) => {
      setApprovals(a.data.approvals || []);
      setLogs(l.data.logs || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleDecision = async (id, status) => {
    try {
      await api.post(`/api/scans/approvals/${id}/decide`, { status });
      toast.success(`Request ${status} successfully`);
      setApprovals(approvals.filter(a => a.id !== id));
    } catch {
      toast.error('Failed to register decision');
    }
  };

  return (
    <div className="space-y-10 pb-20">
       <div className="page-header">
          <h1 className="page-title text-2xl font-black text-white uppercase tracking-tighter">Governance & Oversight</h1>
          <p className="page-sub text-slate-500 font-bold uppercase tracking-widest text-[10px]">Administrative command center for policy & ethics</p>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Exploit Approval Queue */}
          <div className="glass-card">
             <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">🧨 Exploit Approval Queue</h3>
                <Badge label={`${approvals.length} PENDING`} variant="warning" />
             </div>
             <div className="p-0">
                <table className="data-table">
                   <thead>
                      <tr><th>Analyst</th><th>Tool</th><th>Target</th><th>Action</th></tr>
                   </thead>
                   <tbody>
                      {approvals.map(a => (
                        <tr key={a.id}>
                           <td>{a.requester_name}</td>
                           <td className="font-mono text-indigo-400">{a.tool}</td>
                           <td className="text-[11px] truncate max-w-[120px]">{a.target}</td>
                           <td>
                              <div className="flex gap-2">
                                 <button onClick={() => handleDecision(a.id, 'approved')} className="p-2 bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500/20">✓</button>
                                 <button onClick={() => handleDecision(a.id, 'rejected')} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20">✕</button>
                              </div>
                           </td>
                        </tr>
                      ))}
                      {approvals.length === 0 && <tr><td colSpan="4" className="text-center py-12 text-slate-500 text-[10px] font-bold uppercase tracking-widest">No pending authorization requests</td></tr>}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Audit Logs */}
          <div className="glass-card overflow-hidden">
             <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">📜 Security Audit Log</h3>
                <button onClick={() => {
                   import('../../utils/ExportUtils').then(m => m.exportToCSV(logs, 'security_audit_log'));
                }} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-2 transition-colors">
                   ↓ Export CSV
                </button>
             </div>

             <div className="max-h-[340px] overflow-y-auto p-0">
                <table className="data-table">
                   <thead>
                      <tr><th>Action</th><th>Resource</th><th>User</th><th>IP</th></tr>
                   </thead>
                   <tbody>
                      {logs.slice(0, 20).map(l => (
                        <tr key={l.id}>
                           <td className="text-[10px] font-black uppercase text-slate-300">{l.action}</td>
                           <td className="text-[10px] text-slate-500">{l.resource}</td>
                           <td className="text-[10px] font-bold">{l.name || 'SYSTEM'}</td>
                           <td className="font-mono text-[9px] text-indigo-400">{l.ip_address}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>
    </div>
  );
}

