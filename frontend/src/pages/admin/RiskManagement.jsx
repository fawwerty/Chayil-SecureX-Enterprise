import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Badge, Modal, toast, ToastContainer } from '../../components/shared';


const heatColors = { 1: '#34d399', 2: '#a3e635', 3: '#fbbf24', 4: '#f97316', 5: '#ef4444' };
const getColor = score => score >= 16 ? '#ef4444' : score >= 10 ? '#f97316' : score >= 6 ? '#fbbf24' : '#34d399';
const getLabel = score => score >= 16 ? 'Critical' : score >= 10 ? 'High' : score >= 6 ? 'Medium' : 'Low';

function RiskHeatmap({ risks }) {
  const cell = (l, i) => {
    const score = l * i;
    const color = getColor(score);
    const riskHere = risks.filter(r => r.likelihood === l && r.impact === i);
    return (
      <div key={`${l}-${i}`} style={{ width: 56, height: 56, background: color, opacity: 0.7, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontSize: 10, color: '#fff', cursor: 'pointer', position: 'relative' }} title={`L${l} x I${i} = ${score}\n${riskHere.map(r => r.title).join(', ')}`}>
        <span style={{ fontWeight: 700 }}>{score}</span>
        {riskHere.length > 0 && <span style={{ fontSize: '0.58rem', marginTop: 2 }}>{riskHere.length} risk{riskHere.length > 1 ? 's' : ''}</span>}
      </div>
    );
  };
  return (
    <div style={{ padding: 22 }}>
      <div className="chart-title" style={{ marginBottom: 16 }}>Risk Heat Map (Likelihood × Impact)</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginRight: 8 }}>
          {[5, 4, 3, 2, 1].map(l => <div key={l} style={{ width: 20, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--fg-muted)' }}>{l}</div>)}
          <div style={{ width: 20, height: 20, fontSize: '0.6rem', color: 'var(--fg-muted)', textAlign: 'center' }}>L→</div>
        </div>
        <div>
          {[5, 4, 3, 2, 1].map(l => (
            <div key={l} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[1, 2, 3, 4, 5].map(i => cell(l, i))}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: 56, textAlign: 'center', fontSize: 11, color: 'var(--fg-muted)' }}>{i}</div>)}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg-muted)', marginTop: 4 }}>Impact →</div>
        </div>
      </div>
    </div>
  );
}

export default function RiskManagement() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [newRisk, setNewRisk] = useState({ title: '', category: 'Cyber', likelihood: 3, impact: 3, treatment: 'Mitigate', owner: '', treatment_plan: '' });

  const fetchData = async () => {
    try {
      const r = await api.get('/api/risks');
      setRisks(r.data.risks || []);
    } catch {
      toast.error('Failed to fetch risks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRegisterRisk = async () => {
    try {
      await api.post('/api/risks', newRisk);
      toast.success('Risk registered');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to register risk');
    }
  };

  const filtered = filterSeverity === 'all' ? risks : risks.filter(r => getLabel(r.score).toLowerCase() === filterSeverity);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--teal)' }}>Loading Risk Register...</div>;

  const totalRisks = risks.length || 1;

  return (
    <div>
      <ToastContainer />
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Risk Management</h1>
            <p className="page-sub">Enterprise risk register, heat maps, and treatment planning — ISO 31000 & NIST RMF aligned</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => window.open(`${api.defaults.baseURL}/api/risks/export`, '_blank')}>↓ Risk Report</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Register Risk</button>
          </div>
        </div>
      </div>

      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Risks', val: risks.length, color: 'var(--teal)' },
          { label: 'Critical', val: risks.filter(r => r.score >= 16).length, color: '#ef4444' },
          { label: 'High', val: risks.filter(r => r.score >= 10 && r.score < 16).length, color: '#f97316' },
          { label: 'Avg Score', val: risks.length ? (risks.reduce((a, r) => a + r.score, 0) / risks.length).toFixed(1) : '0.0', color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 0 }}>
          <RiskHeatmap risks={risks} />
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="chart-title" style={{ marginBottom: 14 }}>Treatment Summary</div>
          {['Mitigate', 'Transfer', 'Accept', 'Avoid'].map(t => {
            const count = risks.filter(r => r.treatment === t || r.treatment_plan?.includes(t)).length;
            const pct = Math.round((count / totalRisks) * 100);
            return (
              <div key={t} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span>{t}</span><span style={{ color: 'var(--teal)', fontWeight: 600 }}>{count} ({pct}%)</span>
                </div>
                <div className="progress-bar"><div className="progress-fill progress-teal" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
          <div style={{ marginTop: 20, padding: '14px', background: 'rgba(201,162,39,0.06)', border: '1px solid var(--border-gold)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 6 }}>Risk Appetite Statement</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.6 }}>Organisation has LOW appetite for risks that could result in regulatory breach or customer data exposure, and MEDIUM appetite for operational risks.</div>
          </div>
        </div>
      </div>

      {/* Risk Register */}
      <div className="card" style={{ padding: '22px 0' }}>
        <div style={{ padding: '0 22px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span className="chart-title">Risk Register</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'critical', 'high', 'medium', 'low'].map(f => (
              <button key={f} onClick={() => setFilterSeverity(f)} className={`btn btn-sm ${filterSeverity === f ? 'btn-teal' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>{f}</button>
            ))}
          </div>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Risk Title</th><th>Score</th><th>Treatment</th><th>Owner</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--teal)', fontWeight: 600 }}>{r.id.slice(0, 8)}</td>
                  <td style={{ maxWidth: 300, fontWeight: 500 }}>{r.title}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: getColor(r.score), background: `${getColor(r.score)}18`, padding: '2px 10px', borderRadius: 50, fontSize: 12, border: `1px solid ${getColor(r.score)}44` }}>
                      {r.score} — {getLabel(r.score)}
                    </span>
                  </td>
                  <td><span className="badge badge-info">{r.status || 'Active'}</span></td>
                  <td style={{ fontSize: 13 }}>{r.owner || 'N/A'}</td>
                  <td><span className={`badge ${r.status === 'Identified' ? 'badge-high' : 'badge-low'}`}>{r.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{new Date(r.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No risks registered.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Register New Risk"
          footer={<><button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary btn-sm" onClick={handleRegisterRisk}>Register Risk</button></>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="label">Risk Title</label><input className="input" placeholder="Describe the risk..." value={newRisk.title} onChange={e => setNewRisk({ ...newRisk, title: e.target.value })} /></div>
            <div><label className="label">Category</label><select className="input select" value={newRisk.category} onChange={e => setNewRisk({ ...newRisk, category: e.target.value })}>{['Cyber', 'Data', 'Third-Party', 'Insider', 'Compliance', 'Cloud', 'Availability'].map(c => <option key={c}>{c}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label className="label">Likelihood (1-5)</label><input className="input" type="number" min={1} max={5} value={newRisk.likelihood} onChange={e => setNewRisk({ ...newRisk, likelihood: parseInt(e.target.value) })} /></div>
              <div><label className="label">Impact (1-5)</label><input className="input" type="number" min={1} max={5} value={newRisk.impact} onChange={e => setNewRisk({ ...newRisk, impact: parseInt(e.target.value) })} /></div>
            </div>
            <div><label className="label">Treatment Strategy</label><select className="input select" value={newRisk.treatment} onChange={e => setNewRisk({ ...newRisk, treatment: e.target.value })}>{['Mitigate', 'Transfer', 'Accept', 'Avoid'].map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="label">Risk Owner</label><input className="input" placeholder="Owner name / team" value={newRisk.owner} onChange={e => setNewRisk({ ...newRisk, owner: e.target.value })} /></div>
            <div><label className="label">Treatment Plan</label><textarea className="input textarea" rows={3} placeholder="Describe mitigation steps..." value={newRisk.treatment_plan} onChange={e => setNewRisk({ ...newRisk, treatment_plan: e.target.value })} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

