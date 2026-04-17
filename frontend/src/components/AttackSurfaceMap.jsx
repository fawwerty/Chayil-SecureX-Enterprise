import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Badge } from './shared';

export default function AttackSurfaceMap() {
  const [data, setData] = useState({ subdomainsBySource: {}, ports: [], totalAssets: 0, latestRecon: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real consolidated recon data
    api.get('/api/portal/attack-surface').then(r => {
      setData(r.data);
    }).catch(() => {
      // Resulting in 0/empty state instead of mock
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-white/5 rounded-2xl" />;

  return (
    <div className="glass-card p-8 h-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-2">Discovery Map</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Automated asset & surface correlation</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-indigo-400 tracking-tighter">{data.totalAssets || 0}</div>
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Identified Nodes</div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Simplified Visual Representation */}
        <div className="relative h-40 flex items-center justify-center border border-white/5 bg-black/20 rounded-xl overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--indigo-500)_1px,_transparent_1px)] bg-[size:24px_24px] opacity-10" />
           <div className="relative z-10 flex gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i < (data.totalAssets||0) ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
              ))}
              {data.totalAssets > 5 && <span className="text-[10px] font-black text-slate-500">+{data.totalAssets - 5} MORE</span>}
           </div>
           {data.totalAssets === 0 && <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Scan target to populate map</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Service Profile</div>
              <div className="flex flex-wrap gap-2">
                 {(data.ports || []).slice(0, 6).map(p => (
                   <span key={p.port} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-bold border border-indigo-500/20">{p.port}/{p.service}</span>
                 ))}
                 {(!data.ports || data.ports.length === 0) && <span className="text-[9px] text-slate-600 italic">No services identified</span>}
              </div>
           </div>
           <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Health Status</div>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] text-slate-300 font-bold">MONITORED</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
