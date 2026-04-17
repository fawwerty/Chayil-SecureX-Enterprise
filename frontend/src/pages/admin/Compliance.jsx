import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Badge, ProgressBar, Modal, ToastContainer, toast } from '../../components/shared';

const FRAMEWORKS_META = {
  'ISO 27001': { controls: 114, color: '#0ecfcf', icon: '🔒' },
  'NIST CSF 2.0': { controls: 108, color: '#c9a227', icon: '🛡️' },
  'SOC 2': { controls: 64, color: '#8b5cf6', icon: '✅' },
  'PCI-DSS v4': { controls: 256, color: '#ef4444', icon: '💳' },
  'GDPR': { controls: 99, color: '#10b981', icon: '🇪🇺' },
  'Ghana NDPA': { controls: 48, color: '#f59e0b', icon: '🇬🇭' },
};

const statusMap = { compliant: 'Compliant', partial: 'Partial', non_compliant: 'Non-Compliant', not_assessed: 'Not Assessed' };

export default function Compliance() {
  const [selectedFw, setSelectedFw] = useState('All');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editControl, setEditControl] = useState(null);
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/compliance');
      setControls(res.data.controls || []);
    } catch {
      toast.error('Failed to fetch compliance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = controls.filter(c =>
    (selectedFw === 'All' || c.framework === selectedFw) &&
    (selectedDomain === 'All' || c.category === selectedDomain) &&
    (selectedStatus === 'all' || c.status === selectedStatus)
  );

  const domains = ['All', ...new Set(controls.map(c => c.category))];
  const compliantCount = controls.filter(c => c.status === 'compliant').length;
  const partialCount = controls.filter(c => c.status === 'partial').length;
  const nonCompliantCount = controls.filter(c => c.status === 'non_compliant').length;
  const total = controls.length || 1;
  const overallScore = Math.round((compliantCount / total) * 100);

  const uniqueFrameworks = [...new Set(controls.map(c => c.framework))];
  const fwScores = uniqueFrameworks.map(fw => {
    const fwControls = controls.filter(c => c.framework === fw);
    const comp = fwControls.filter(c => c.status === 'compliant').length;
    const meta = FRAMEWORKS_META[fw] || { controls: fwControls.length, color: '#94a3b8', icon: '📄' };
    return { 
      fw, 
      score: fwControls.length ? Math.round((comp / fwControls.length) * 100) : 0, 
      total: meta.controls, 
      assessed: fwControls.length, 
      color: meta.color, 
      icon: meta.icon 
    };
  });

  const handleUpdateControl = async () => {
    try {
      await api.put(`/api/compliance/${editControl.id}`, { 
        status: editControl.status, 
        evidence: editControl.evidence, 
        owner: editControl.owner 
      });
      setEditControl(null);
      toast.success('Control updated');
      fetchData();
    } catch {
      toast.error('Failed to update control');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--teal)' }}>Loading Compliance Framework...</div>;

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Compliance & Regulatory</h1>
            <p className="page-sub">ISO 27001 · NIST CSF · SOC 2 · PCI-DSS · GDPR · Ghana NDPA</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => window.open(`${api.defaults.baseURL}/api/reports/generate?type=compliance`, '_blank')}>↓ Compliance Report</button>
            <button className="btn btn-primary btn-sm" onClick={() => toast.info('New control registration available in Admin Tools')}>+ Add Control</button>
          </div>
        </div>
      </div>

      {/* Overall Score Banner */}
      <div className="card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, rgba(14,207,207,0.06), rgba(201,162,39,0.06))', border: '1px solid var(--border-gold)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '3rem', fontWeight: 800, color: overallScore >= 80 ? '#34d399' : overallScore >= 60 ? '#fbbf24' : '#ef4444' }}>{overallScore}%</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Overall Compliance</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 12 }}>
              {[{ l: 'Compliant', v: compliantCount, c: '#34d399' }, { l: 'Partial', v: partialCount, c: '#fbbf24' }, { l: 'Non-Compliant', v: nonCompliantCount, c: '#ef4444' }].map(s => (
                <div key={s.l} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: 800, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--fg-muted)' }}>{s.l}</div>
                </div>
              ))}
            </div>
            <ProgressBar value={overallScore} color={overallScore >= 80 ? 'green' : overallScore >= 60 ? 'gold' : 'red'} height={8} />
          </div>
        </div>
      </div>

      {/* Framework Scores Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {fwScores.map(f => (
          <div key={f.fw} className="card" style={{ padding: 18, cursor: 'pointer', border: selectedFw === f.fw ? `1.5px solid ${f.color}` : undefined }}
            onClick={() => setSelectedFw(selectedFw === f.fw ? 'All' : f.fw)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--fg-default)' }}>{f.fw}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '1.6rem', fontWeight: 800, color: f.color, marginBottom: 4 }}>{f.score}%</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--fg-muted)', marginBottom: 8 }}>{f.assessed} assessed</div>
            <ProgressBar value={f.score} color={f.score >= 80 ? 'green' : f.score >= 60 ? 'gold' : 'red'} height={4} />
          </div>
        ))}
      </div>

      {/* Controls Table */}
      <div className="card" style={{ padding: '22px 0' }}>
        <div style={{ padding: '0 22px 16px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="chart-title" style={{ marginBottom: 0 }}>Controls Register</span>
          <select className="input" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }} value={selectedFw} onChange={e => setSelectedFw(e.target.value)}>
            <option value="All">All Frameworks</option>
            {uniqueFrameworks.map(f => <option key={f}>{f}</option>)}
          </select>
          <select className="input" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.82rem' }} value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}>
            {domains.map(d => <option key={d}>{d}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {['all', 'compliant', 'partial', 'non_compliant'].map(s => (
              <button key={s} onClick={() => setSelectedStatus(s)} className={`btn btn-sm ${selectedStatus === s ? 'btn-teal' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>Control ID</th><th>Framework</th><th>Title</th><th>Domain</th><th>Status</th><th>Owner</th><th>Evidence</th><th></th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--teal)', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.control_id}</td>
                  <td><span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{c.framework}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.title}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>{c.category}</td>
                  <td>
                    <span className={`badge ${c.status === 'compliant' ? 'badge-low' : c.status === 'partial' ? 'badge-medium' : c.status === 'non_compliant' ? 'badge-critical' : 'badge-info'}`}>
                      {statusMap[c.status]}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{c.owner || 'N/A'}</td>
                  <td style={{ maxWidth: 200, fontSize: '0.78rem', color: 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.evidence || 'No evidence'}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => setEditControl(c)}>Edit</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>No controls found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Control Modal */}
      {editControl && (
        <Modal open={!!editControl} onClose={() => setEditControl(null)} title={`Update Control — ${editControl?.control_id}`}
          footer={
            <><button className="btn btn-ghost btn-sm" onClick={() => setEditControl(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleUpdateControl}>Save</button></>
          }>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: 'var(--fg-default)', marginBottom: 4 }}>{editControl.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>{editControl.framework} · {editControl.category}</div>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={editControl.status} onChange={e => setEditControl(c => ({ ...c, status: e.target.value }))}>
                <option value="compliant">Compliant</option>
                <option value="partial">Partial</option>
                <option value="non_compliant">Non-Compliant</option>
                <option value="not_assessed">Not Assessed</option>
              </select>
            </div>
            <div>
              <label className="label">Owner</label>
              <input className="input" value={editControl.owner || ''} onChange={e => setEditControl(c => ({ ...c, owner: e.target.value }))} />
            </div>
            <div>
              <label className="label">Evidence / Notes</label>
              <textarea className="input textarea" rows={4} value={editControl.evidence || ''} onChange={e => setEditControl(c => ({ ...c, evidence: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

