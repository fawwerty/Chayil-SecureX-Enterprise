import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Badge, Modal, toast, ToastContainer } from '../../components/shared';


const sevBadge = s => ({ critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[s?.toLowerCase()] || 'badge-info');

export default function ITAuditing() {
  const [activeSection, setActiveSection] = useState('audits');
  const [audits, setAudits] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAudit, setNewAudit] = useState({ title: '', audit_type: 'Internal', scope: '', scheduled_at: '' });

  const fetchData = async () => {
    try {
      const [resAudits, resFindings] = await Promise.all([
        api.get('/api/audits'),
        api.get('/api/audits/findings')
      ]);
      setAudits(resAudits.data.audits || []);
      setFindings(resFindings.data.findings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleScheduleAudit = async () => {
    try {
      await api.post('/api/audits/schedule', newAudit);
      toast.success('Audit scheduled');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to schedule audit');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--teal)' }}>Loading Audit Data...</div>;

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">IT & Security Auditing</h1>
            <p className="page-sub">Comprehensive audits aligned to ISO 27001, COBIT, NIST, and Ghana NDPA</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => window.open(`${api.defaults.baseURL}/api/audits/export`, '_blank')}>↓ Audit Report</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Schedule Audit</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Audits', val: audits.length, color: 'var(--teal)', sub: 'Active program' },
          { label: 'Open Findings', val: findings.filter(f => f.status === 'open').length, color: '#ef4444', sub: 'Require action' },
          { label: 'Critical Issues', val: findings.filter(f => f.severity === 'critical').length, color: '#f87171', sub: 'Immediate fix' },
          { label: 'Avg CVSS Score', val: findings.length ? (findings.reduce((acc, f) => acc + (f.cvss_score || 0), 0) / findings.length).toFixed(1) : '0.0', color: '#fbbf24', sub: 'Risk score' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-subtle)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['audits', 'Audit Schedule'], ['findings', 'Findings Register'], ['frameworks', 'Framework Coverage']].map(([k, l]) => (
          <button key={k} onClick={() => setActiveSection(k)} className={`btn btn-sm ${activeSection === k ? 'btn-teal' : 'btn-ghost'}`}>{l}</button>
        ))}
      </div>

      {activeSection === 'audits' && (
        <div className="card" style={{ padding: '22px 0' }}>
          <div style={{ padding: '0 22px 16px' }}><span className="chart-title">Audit Schedule & Status</span></div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead><tr><th>Audit ID</th><th>Name</th><th>Type</th><th>Status</th><th>Start Date</th><th>Findings</th></tr></thead>
              <tbody>
                {audits.map(a => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--teal)', fontWeight: 600 }}>{a.id.slice(0, 8)}</td>
                    <td style={{ fontWeight: 500, maxWidth: 300 }}>{a.title}</td>
                    <td><span className="badge badge-info">{a.audit_type}</span></td>
                    <td><span className={`badge ${a.status === 'Completed' ? 'badge-low' : a.status === 'In Progress' ? 'badge-progress' : 'badge-info'}`}>{a.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString() : 'TBD'}</td>
                    <td><span style={{ fontWeight: 700, color: a.findings_count > 5 ? '#ef4444' : a.findings_count > 0 ? '#fbbf24' : '#34d399' }}>{a.findings_count}</span></td>
                  </tr>
                ))}
                {audits.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No audits scheduled.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'findings' && (
        <div className="card" style={{ padding: '22px 0' }}>
          <div style={{ padding: '0 22px 16px' }}><span className="chart-title">Findings Register</span></div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>CVSS</th><th>Status</th><th>Created At</th></tr></thead>
              <tbody>
                {findings.map(f => (
                  <tr key={f.id}>
                    <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{f.id.slice(0, 8)}</td>
                    <td style={{ maxWidth: 300, fontWeight: 500 }}>{f.title}</td>
                    <td><span className={`badge ${sevBadge(f.severity)}`}>{f.severity}</span></td>
                    <td><span style={{ fontWeight: 700, color: f.cvss_score >= 9 ? '#ef4444' : f.cvss_score >= 7 ? '#f59e0b' : '#e8c252' }}>{f.cvss_score}</span></td>
                    <td><span className={`badge ${f.status === 'open' ? 'badge-open' : 'badge-progress'}`}>{f.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{new Date(f.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {findings.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No findings recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'frameworks' && (
        <div className="card" style={{ padding: 22 }}>
          <p style={{ color: 'var(--fg-muted)', textAlign: 'center' }}>Framework coverage analytics coming soon based on audit results.</p>
        </div>
      )}

      {/* Schedule Audit Modal */}
      {showModal && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Schedule New Audit"
          footer={<><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={handleScheduleAudit}>Schedule</button></>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="label">Audit Title</label><input className="input" placeholder="e.g. Annual ITGC" value={newAudit.title} onChange={e => setNewAudit({ ...newAudit, title: e.target.value })} /></div>
            <div><label className="label">Audit Type</label>
              <select className="input select" value={newAudit.audit_type} onChange={e => setNewAudit({ ...newAudit, audit_type: e.target.value })}>
                {['Internal', 'External', 'ISO 27001', 'SOC 2', 'Regulation Compliance'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div><label className="label">Schedule Date</label><input className="input" type="date" value={newAudit.scheduled_at} onChange={e => setNewAudit({ ...newAudit, scheduled_at: e.target.value })} /></div>
            <div><label className="label">Scope Notes</label><textarea className="input textarea" rows={3} placeholder="Describe scope..." value={newAudit.scope} onChange={e => setNewAudit({ ...newAudit, scope: e.target.value })} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

