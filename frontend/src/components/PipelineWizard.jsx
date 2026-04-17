import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Badge, ProgressBar, toast, Modal } from './shared';

const PIPELINE_MODES = [
  { 
    id: 'recon', 
    label: '🛰️ Reconnaissance', 
    tools: ['nmap', 'amass', 'theharvester'], 
    desc: 'Surface discovery & info gathering',
    functions: [
      'Active Subdomain Enumeration',
      'OSINT Data Aggregation',
      'Public Asset Discovery',
      'Port Exposure Visualization'
    ]
  },
  { 
    id: 'scanning', 
    label: '🔎 Scanning & Enum', 
    tools: ['nikto', 'whatweb', 'nuclei'], 
    desc: 'Service detection & initial vulns',
    functions: [
      'Service Version Fingerprinting',
      'HTTP Header Analysis',
      'Default Credential Testing',
      'Initial Configuration Audit'
    ]
  },
  { 
    id: 'vulnerability', 
    label: '🛡️ Vuln Assessment', 
    tools: ['nuclei', 'openvas'], 
    desc: 'Deep vulnerability identification',
    functions: [
      'Known CVE Verification',
      'Static/Dynamic Code Analysis',
      'Protocol Vulnerability Check',
      'Compliance Policy Mapping'
    ]
  },
  { 
    id: 'exploit', 
    label: '🧨 Exploitation', 
    tools: ['sqlmap', 'metasploit'], 
    desc: 'Controlled vulnerability validation', 
    sensitive: true,
    functions: [
      'Inherent Risk Validation',
      'Privilege Escalation Simulation',
      'Data Exfiltration Modeling',
      'Remediation Proof of Concept'
    ]
  }
];


export default function PipelineWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ target: '', targetType: 'domain', projectTitle: '' });
  const [loading, setLoading] = useState(false);
  const [pipelineId, setPipelineId] = useState(null);
  const [activePipeline, setActivePipeline] = useState(null);
  const [approvalModal, setApprovalModal] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');

  // Polling for pipeline status
  useEffect(() => {
    let interval;
    if (pipelineId) {
      interval = setInterval(async () => {
        try {
          const r = await api.get(`/api/scans/pipelines/${pipelineId}`);
          setActivePipeline(r.data.pipeline);
          if (r.data.pipeline.status === 'completed') {
            clearInterval(interval);
            toast.success("Pipeline sequence completed!");
          }
        } catch {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [pipelineId]);

  const startPipeline = async () => {
    if (!formData.target) return toast.error("Target is required");
    setLoading(true);
    try {
      const mode = PIPELINE_MODES[step];
      const r = await api.post('/api/scans/pipelines', {
        ...formData,
        mode: mode.id,
        tools: mode.tools
      });
      setPipelineId(r.data.pipelineId);
      toast.success(`${mode.label} initiated`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start pipeline");
    } finally {
      setLoading(false);
    }
  };

  const requestExploit = async () => {
    if (!approvalReason) return toast.error("Validation reason required");
    try {
      await api.post('/api/scans/approvals', {
        tool: 'sqlmap',
        target: formData.target,
        reason: approvalReason
      });
      toast.success("Exploit approval request submitted to Admins");
      setApprovalModal(false);
    } catch (err) {
      toast.error("Failed to submit approval request");
    }
  };

  if (activePipeline) {
    return (
      <div className="glass-card p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-8">
           <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-1">Pipeline Active: {formData.target}</h3>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                 <span className="animate-pulse">●</span> Executing Phase: {activePipeline.current_stage}
              </div>
           </div>
           <Badge label={activePipeline.status} variant={activePipeline.status} />
        </div>

        <div className="space-y-6">
           {activePipeline.steps.map((s, i) => (
              <div key={i} className={`p-5 rounded-2xl border transition-all ${s.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20' : s.status === 'running' ? 'bg-indigo-500/5 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                       <span className="text-lg">{s.status === 'completed' ? '✅' : s.status === 'running' ? '⚡' : '⏳'}</span>
                       <div>
                          <div className="text-xs font-black text-white uppercase tracking-tight">{s.tool.toUpperCase()} SCAN</div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.stage}</div>
                       </div>
                    </div>
                    {s.status === 'running' && <div className="w-12 h-1 overflow-hidden bg-white/10 rounded-full"><div className="h-full bg-indigo-500 animate-slide-right"/></div>}
                 </div>
              </div>
           ))}
        </div>

        <button className="btn btn-outline btn-full mt-8" onClick={() => setPipelineId(null)}>← Monitor in Background</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Target Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">1. Definition</label>
             <div className="space-y-4">
                <input className="input" placeholder="Project Title (e.g. Q2 External Audit)" value={formData.projectTitle} onChange={e=>setFormData({...formData, projectTitle:e.target.value})} />
                <input className="input" placeholder="Target Endpoint (domain or IP)" value={formData.target} onChange={e=>setFormData({...formData, target:e.target.value})} />
             </div>
          </div>
          <div className="glass-card p-6">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">2. Phase Selection</label>
             <div className="grid grid-cols-2 gap-3">
                {PIPELINE_MODES.map((m, i) => (
                  <div key={m.id} onClick={() => setStep(i)} className={`p-4 rounded-xl border cursor-pointer transition-all ${step === i ? 'bg-indigo-500/10 border-indigo-500 shadow-xl shadow-indigo-500/10' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                    <div className="text-sm font-black text-white uppercase tracking-tighter mb-1">{m.label}</div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">{m.desc}</div>
                  </div>
                ))}
             </div>
          </div>
      </div>

      {/* Phase Contents & Tools */}
      <div className="glass-card overflow-hidden">
         <div className="flex flex-wrap border-b border-white/5">
            <div className="px-8 py-4 border-r border-white/5 bg-white/5">
               <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Active Strategy</div>
               <div className="text-sm font-bold text-white">{PIPELINE_MODES[step].label}</div>
            </div>
            <div className="flex-1 px-8 py-4 flex items-center justify-between min-w-[300px]">
               <div className="flex gap-2">
                  {PIPELINE_MODES[step].tools.map(t => <span key={t} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest">{t}</span>)}
               </div>
            </div>
         </div>

         <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Phase Functional Scope</h4>
               <div className="space-y-4">
                  {PIPELINE_MODES[step].functions.map((f, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                       <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-all">{i + 1}</div>
                       <div className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{f}</div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="flex flex-col justify-center">
               <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
                  This phase applies standard offensive security procedures for {PIPELINE_MODES[step].id}. 
                  All telemetry is captured in real-time and formatted for GRC review.
               </p>
               {PIPELINE_MODES[step].sensitive ? (
                  <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-center justify-between">
                     <div>
                        <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Authorization Required</div>
                        <div className="text-[9px] text-slate-500 font-bold uppercase">Restricted Exploitation Phase</div>
                     </div>
                     <button className="btn btn-outline border-red-500/30 text-red-500 hover:bg-red-500/10 btn-sm" onClick={() => setApprovalModal(true)}>Request Auth</button>
                  </div>
               ) : (
                  <button className="btn btn-primary h-14 px-12 uppercase tracking-[0.2em] font-black text-xs" onClick={startPipeline} disabled={loading}>{loading ? 'Initializing Engine...' : 'Initialize Phase →'}</button>
               )}
            </div>
         </div>
      </div>


      <Modal open={approvalModal} onClose={() => setApprovalModal(false)} title="Exploitation Authorization Request">
         <div className="space-y-4">
            <div className="text-xs text-slate-400 leading-relaxed mb-4 font-medium italic">
               "Deploying SQLMap or Metasploit on production targets requires documented proof of engagement scope."
            </div>
            <textarea className="input min-h-[120px]" placeholder="Reason for validation... (e.g. Authenticated SQLi verification for bug bounty scope)" value={approvalReason} onChange={e=>setApprovalReason(e.target.value)} />
            <button className="btn btn-primary btn-full" onClick={requestExploit}>Submit Request to Admin</button>
         </div>
      </Modal>

      <style>{`
        @keyframes slide-right { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
        .animate-slide-right { animation: slide-right 2s infinite linear; }
      `}</style>
    </div>
  );
}
