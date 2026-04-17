import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Badge, toast, ToastContainer } from '../../components/shared';


const statusBadge = s => {
  const map = { Compliant: 'badge-low', 'Non-Compliant': 'badge-critical', Partial: 'badge-medium' };
  return map[s] || 'badge-info';
};

export default function CyberAssurance() {
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [measures, setMeasures] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEng, setNewEng] = useState({ client: '', type: 'Cyber Assurance Review', start_date: '', end_date: '', lead: '', scope: '' });

  const fetchData = async () => {
    try {
      const [resAssure, resEng] = await Promise.all([
        api.get('/api/assurance'),
        api.get('/api/portal/engagements')
      ]);
      setMeasures(resAssure.data.measures || []);
      setEngagements(resEng.data.engagements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateEngagement = async () => {
    try {
      await api.post('/api/portal/engagements', { 
        title: `${newEng.client} - ${newEng.type}`, 
        service_id: '88888888-8888-8888-8888-888888888888', // Standard assurance service ID
        client_name: newEng.client 
      });
      toast.success('Engagement created');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to create engagement');
    }
  };

  const filtered = filter === 'all' ? measures : measures.filter(m => m.status === filter);
  const compliant = measures.filter(m => m.status === 'Compliant' || m.status === 'in_place' || m.status === 'active').length;
  const partial = measures.filter(m => m.status === 'Partial').length;
  const nonCompliant = measures.filter(m => m.status === 'Non-Compliant').length;
  const total = measures.length || 1;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--teal)' }}>Loading Assurance Data...</div>;

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Cyber Assurance</h1>
            <p className="page-sub">Independent assurance over your security controls, policies, and processes</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => window.open(`${api.defaults.baseURL}/api/assurance/export`, '_blank')}>↓ Export Assessment</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ New Engagement</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Measures', val: measures.length, icon: '◈', color: 'var(--teal)' },
          { label: 'Compliant', val: compliant, icon: '✓', color: '#34d399' },
          { label: 'Partial', val: partial, icon: '◑', color: '#fbbf24' },
          { label: 'Non-Compliant', val: nonCompliant, icon: '✗', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
            </div>
            <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Assurance Score Bar */}
      <div className="card" style={{ padding: 22, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span className="chart-title">Overall Assurance Score</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 700, color: 'var(--teal)' }}>{Math.round((compliant / total) * 100)}%</span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill progress-teal" style={{ width: `${Math.round((compliant / total) * 100)}%` }} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#34d399' }}>■ Compliant: {compliant} ({Math.round((compliant / total) * 100)}%)</span>
          <span style={{ fontSize: 12, color: '#fbbf24' }}>■ Partial: {partial} ({Math.round((partial / total) * 100)}%)</span>
          <span style={{ fontSize: 12, color: '#ef4444' }}>■ Non-Compliant: {nonCompliant} ({Math.round((nonCompliant / total) * 100)}%)</span>
        </div>
      </div>

      {/* Controls Table */}
      <div className="card" style={{ padding: '22px 0', marginBottom: 24 }}>
        <div style={{ padding: '0 22px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span className="chart-title">Control Assessment Matrix</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'Compliant', 'Partial', 'Non-Compliant'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-teal' : 'btn-ghost'}`}>{f === 'all' ? 'All' : f}</button>
            ))}
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>Control ID</th><th>Category</th><th>Title</th><th>Status</th><th>Actual Value</th><th>Target</th><th>Last Verified</th><th></th></tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td style={{ color: 'var(--teal)', fontWeight: 600 }}>{m.id.slice(0, 8)}</td>
                  <td><span className="badge badge-info">{m.category}</span></td>
                  <td style={{ fontWeight: 500 }}>{m.title}</td>
                  <td><span className={`badge ${statusBadge(m.status)}`}>{m.status}</span></td>
                  <td>{m.actual_value}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.target_value}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.last_verified ? new Date(m.last_verified).toLocaleDateString() : 'Never'}</td>
                  <td><button className="btn btn-ghost btn-sm">View</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>No assurance measures found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Engagements */}
      <div className="card" style={{ padding: '22px 0' }}>
        <div style={{ padding: '0 22px 16px' }}><span className="chart-title">Active Engagements</span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Org</th><th>Service</th><th>Status</th><th>Progress</th><th>Due</th><th>Created At</th></tr></thead>
            <tbody>
              {engagements.map(e => (
                <tr key={e.id}>
                  <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{e.id.slice(0, 8)}</td>
                  <td style={{ fontWeight: 500 }}>{e.org_name || 'N/A'}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{e.service_name}</td>
                  <td><span className={`badge ${e.status === 'Completed' ? 'badge-low' : e.status === 'requested' ? 'badge-progress' : 'badge-info'}`}>{e.status}</span></td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill progress-teal" style={{ width: `${e.progress}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600, width: 32 }}>{e.progress}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{e.end_date ? new Date(e.end_date).toLocaleDateString() : 'TBD'}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {engagements.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No active engagements.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Engagement Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Assurance Engagement</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label className="label">Client Name</label><input className="input" placeholder="Organisation name" value={newEng.client} onChange={e => setNewEng({ ...newEng, client: e.target.value })} /></div>
                <div><label className="label">Engagement Type</label>
                  <select className="input select" value={newEng.type} onChange={e => setNewEng({ ...newEng, type: e.target.value })}>
                    {['Cyber Assurance Review', 'ISO 27001 Readiness', 'Control Testing', 'Gap Assessment', 'Full Security Audit'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="label">Start Date</label><input className="input" type="date" value={newEng.start_date} onChange={e => setNewEng({ ...newEng, start_date: e.target.value })} /></div>
                  <div><label className="label">Due Date</label><input className="input" type="date" value={newEng.end_date} onChange={e => setNewEng({ ...newEng, end_date: e.target.value })} /></div>
                </div>
                <div><label className="label">Lead Auditor</label><input className="input" placeholder="Assign lead" value={newEng.lead} onChange={e => setNewEng({ ...newEng, lead: e.target.value })} /></div>
                <div><label className="label">Scope Notes</label><textarea className="input textarea" rows={3} placeholder="Describe engagement scope..." value={newEng.scope} onChange={e => setNewEng({ ...newEng, scope: e.target.value })} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreateEngagement}>Create Engagement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

