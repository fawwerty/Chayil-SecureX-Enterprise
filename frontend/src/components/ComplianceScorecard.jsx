import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ProgressBar } from './shared';

const CONTROLS = [
  { id: 'ISO-5.1', label: 'Info Security Policies', framework: 'ISO 27001' },
  { id: 'ISO-8.1', label: 'User Endpoint Security', framework: 'ISO 27001' },
  { id: 'NIST-ID.AM-1', label: 'Asset Management', framework: 'NIST CSF' },
  { id: 'GDPR-A32', label: 'Security of Processing', framework: 'GDPR' }
];

export default function ComplianceScorecard() {
  const [scores, setScores] = useState({ iso: 0, nist: 0, gdpr: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/portal/compliance-summary').then(r => {
      setScores(r.data.scores);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-white/5 rounded-2xl" />;

  return (
    <div className="glass-card p-8 h-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-2">Governance Scorecard</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Automated framework alignment</p>
        </div>
        <div className="flex gap-1">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 opacity-30" />
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 opacity-20" />
        </div>
      </div>

      <div className="space-y-8">
         <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
               <span className="text-white">ISO 27001:2022</span>
               <span className="text-indigo-400">{scores.iso || 0}%</span>
            </div>
            <ProgressBar value={scores.iso || 0} color="indigo" height={6} />
         </div>

         <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
               <span className="text-white">NIST CSF v2.0</span>
               <span className="text-indigo-300">{scores.nist || 0}%</span>
            </div>
            <ProgressBar value={scores.nist || 0} color="violet" height={6} />
         </div>

         <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
               <span className="text-white">GDPR Compliance</span>
               <span className="text-indigo-200">{scores.gdpr || 0}%</span>
            </div>
            <ProgressBar value={scores.gdpr || 0} color="success" height={6} />
         </div>

         <div className="mt-8 pt-8 border-t border-white/5">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Critical Control Deficiencies</div>
            <div className="space-y-2">
               {CONTROLS.slice(0, 2).map(c => (
                 <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <span className="text-[10px] font-bold text-white uppercase tracking-tight">{c.id}: {c.label}</span>
                    <span className="text-[8px] font-black text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">{c.framework}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
