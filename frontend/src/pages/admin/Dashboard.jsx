import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Badge, StatCard, ProgressBar } from '../../components/shared';

function ThreatMapVis() {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 180;
    const w = canvas.width, h = canvas.height;

    ctx.clearRect(0,0,w,h);
    const nodes = [
      {x: w*0.45, y: h*0.5, label:'Accra', primary: true},
      {x: w*0.42, y: h*0.35, label:'Lagos'},
      {x: w*0.55, y: h*0.45, label:'Nairobi'},
      {x: w*0.48, y: h*0.7, label:'Joburg'},
      {x: w*0.35, y: h*0.3, label:'Dakar'},
      {x: w*0.6, y: h*0.25, label:'Cairo'},
      {x: w*0.2, y: h*0.5, label:'EU'},
      {x: w*0.8, y: h*0.4, label:'Asia'},
      {x: w*0.1, y: h*0.6, label:'US'},
    ];

    nodes.slice(1).forEach(n => {
      const primary = nodes[0];
      const grad = ctx.createLinearGradient(primary.x, primary.y, n.x, n.y);
      grad.addColorStop(0, 'rgba(99,102,241,0.4)');
      grad.addColorStop(1, 'rgba(139,92,246,0.1)');
      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.setLineDash([4,4]);
      ctx.moveTo(primary.x, primary.y);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    nodes.forEach(n => {
      const r = n.primary ? 8 : 5;
      const color = n.primary ? '#8b5cf6' : '#6366f1';
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px Inter';
      ctx.fillText(n.label, n.x+10, n.y+4);
    });
  }, []);
  return <canvas ref={canvasRef} className="w-full h-[180px] block opacity-80" />;
}

function RiskDonut({ score }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = 120;
    canvas.width = s; canvas.height = s;
    const cx = s/2, cy = s/2, r = 48;
    ctx.clearRect(0,0,s,s);
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,0.05)';
    ctx.lineWidth=8;
    ctx.stroke();
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    ctx.beginPath();
    ctx.arc(cx,cy,r,-Math.PI/2, (-Math.PI/2)+((score/100)*Math.PI*2));
    ctx.strokeStyle=color;
    ctx.lineWidth=8;
    ctx.lineCap='round';
    ctx.stroke();
    ctx.fillStyle='#ffffff';
    ctx.font='black 24px Inter';
    ctx.textAlign='center';
    ctx.fillText(score, cx, cy+4);
    ctx.fillStyle='#64748b';
    ctx.font='bold 9px Inter';
    ctx.fillText('SCORE', cx, cy+18);
  }, [score]);
  return <canvas ref={canvasRef} className="w-20 h-20" />;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard/stats')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { stats, recent_incidents, threat_stream, risks } = data;

  const dashboardStats = [
    { label:'Open Incidents', val: stats.open_incidents, change:'Live Queue', dir:'up', icon:'⚡' },
    { label:'Critical Vulns', val: stats.critical_vulns, change:'Active Scans', dir:'up', icon:'⚠' },
    { label:'Compliance Score', val: `${stats.compliance_score}%`, change:'Validated', dir:'up', icon:'◈' },
    { label:'Assets Monitored', val: stats.assets, change:'Synchronized', dir:'up', icon:'◉' },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-1 uppercase">Security <span className="text-indigo-500">Command Centre</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Portal Alpha v2.4 • Operational Intelligence Orchestration</p>
        </div>
        <div className="flex gap-3">
          <button className="btn px-6 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">↓ Export Intel</button>
          <button className="btn btn-primary px-6 py-2 text-[10px] font-black uppercase tracking-widest" onClick={() => window.location.href='/admin/incidents'}>+ Deploy Response</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{stats.critical_vulns} Critical Threats Observed</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">✓ Infrastructure Synchronized</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posture: {stats.compliance_score}% Compliance</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map(s => (
          <StatCard key={s.label} {...s} value={s.val} changeDir={s.dir} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card overflow-hidden h-fit">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Active Engagements</h3>
            <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest" onClick={() => window.location.href='/admin/incidents'}>View Operations →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5">
                <tr>
                  {['ID', 'Engagement', 'Severity', 'Status', 'Updated'].map(h => (
                    <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent_incidents.map(i => (
                  <tr key={i.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 text-xs font-black text-indigo-400">{i.id}</td>
                    <td className="px-6 py-4 text-xs font-bold text-white max-w-[200px] truncate">{i.title}</td>
                    <td className="px-6 py-4"><Badge label={i.severity} variant={i.severity.toLowerCase()} /></td>
                    <td className="px-6 py-4"><Badge label={i.status} variant={i.status.toLowerCase().replace('in progress', 'running')} /></td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{new Date(i.updated_at || i.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recent_incidents.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-xs text-slate-500 font-bold uppercase tracking-widest">No active operational engagements</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-6 h-fit">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Real-time Threat Stream</h3>
          <div className="space-y-4">
            {threat_stream.map(a => (
              <div key={a.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                <div className="flex gap-3 items-start">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${a.sev === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'}`} />
                  <div className="flex-1">
                    <div className="text-[11px] font-bold text-white leading-relaxed mb-2">{a.msg}</div>
                    <div className="flex items-center gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                      <span>{a.host || 'PORTAL'}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span>{a.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {threat_stream.length === 0 && (
              <div className="py-12 text-center text-[10px] text-slate-600 font-black uppercase tracking-widest">No indicators detected</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 h-fit">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8">Risk Landscape Mapping</h3>
          <div className="space-y-6">
            {risks.map(r => (
              <div key={r.domain} className="group">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors capitalize">{r.domain}</span>
                  <span className="text-xs font-black text-indigo-400 tracking-tighter">{r.score}%</span>
                </div>
                <ProgressBar value={r.score} color={r.score > 80 ? 'success' : r.score > 60 ? 'indigo' : r.score > 40 ? 'violet' : 'red'} />
              </div>
            ))}
            {risks.length === 0 && (
               <div className="py-8 text-center text-xs text-slate-600 font-bold uppercase tracking-widest">No risks documented</div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 relative overflow-hidden group h-fit">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full" />
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Origin Intelligence Mapping</h3>
          <div className="relative h-[180px] bg-black/20 rounded-2xl border border-white/5 p-4 mb-6">
            <ThreatMapVis />
          </div>
          <div className="flex flex-wrap gap-4">
            {[{c:'bg-red-500',l:'Critical'},{c:'bg-orange-500',l:'High'},{c:'bg-indigo-500',l:'Medium'},{c:'bg-emerald-500',l:'Low'}].map(l => (
              <div key={l.l} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${l.c}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{l.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-8 group relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mb-32 -mr-32" />
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
            <RiskDonut score={stats.compliance_score} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-black text-white tracking-tighter mb-3 uppercase">Consolidated CyberScore™</h3>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-6 leading-relaxed max-w-xl">Overall enterprise security posture calculated across ISO 27001, NIST CSF, and CIS Critical Security Controls frameworks.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Badge label={stats.compliance_score > 80 ? "Low Risk" : stats.compliance_score > 60 ? "Moderate Risk" : "High Risk"} variant={stats.compliance_score > 80 ? "success" : stats.compliance_score > 60 ? "medium" : "danger"} />
              <Badge label="+5.2% Growth" variant="active" />
              <Badge label="Target: 92%" variant="info" />
            </div>
          </div>
          <button onClick={() => window.location.href='/admin/cyberscore'} className="btn px-8 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all">Detailed Analysis →</button>
        </div>
      </div>
    </div>
  );
}

