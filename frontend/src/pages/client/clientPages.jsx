import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge, StatCard, ToastContainer, toast, DataTable, Modal, ThreatFeedWidget } from '../../components/shared';
import api from '../../utils/api';

const clientNav = [
  { path:'/client',             label:'Overview',         icon:'▦', exact:true },
  { path:'/client/engagements',  label:'My Projects',      icon:'⬡' },
  { path:'/client/requests',     label:'Service Hub',      icon:'⚡' },
  { path:'/client/documents',    label:'Document Vault',   icon:'≡' },
  { path:'/client/consultations',label:'Consultations',   icon:'◈' },
  { path:'/client/billing',      label:'Governance & Billing', icon:'$'},
];

export function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="portal-layout">
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:199 }}/>}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.jpg" alt="" className="sidebar-logo"
            onError={e => e.target.style.display='none'}
          />
          <div>
            <div className="sidebar-brand">Chayil <span>SecureX</span></div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.12em' }}>Client Portal</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-group-label">Enterprise GRC</div>
            {clientNav.map(item => (
              <div key={item.path} className={`nav-item${isActive(item.path, item.exact) ? ' active' : ''}`} onClick={() => { navigate(item.path); setOpen(false); }}>
                <span className="nav-icon">{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => { logout(); navigate('/login'); }}>
            <div className="user-avatar">{user?.name?.[0] || 'C'}</div>
            <div>
              <div className="user-name">{user?.name || 'Client'}</div>
              <div className="user-role">Enterprise</div>
            </div>
            <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.2)', fontSize:12 }}>↥</span>
          </div>
        </div>
      </aside>

      <main className="portal-main">
        <div className="portal-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setOpen(!open)} className="mobile-menu-btn" style={{ background:'none', border:'none', color:'rgba(255,255,255,0.45)', display:'none', cursor:'pointer' }}>☰</button>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#fff', letterSpacing:'-0.02em' }}>
                {clientNav.find(i => isActive(i.path, i.exact))?.label || 'Client Portal'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
             <span style={{ fontSize:10, padding:'3px 10px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:4, color:'rgba(99,102,241,0.9)', fontWeight:600, letterSpacing:'0.06em' }}>ORG: {user?.org_name || 'Organization'}</span>
             <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost btn-sm">Logout</button>
          </div>
        </div>
        <div className="portal-content">
          <Outlet />
        </div>
      </main>
      <style>{`@media(max-width:1024px){.mobile-menu-btn{display:block !important;}}`}</style>
    </div>
  );
}

import AttackSurfaceMap from '../../components/AttackSurfaceMap';
import ComplianceScorecard from '../../components/ComplianceScorecard';

// ── CLIENT DASHBOARD ───────────────────────────────────────────────────────────
export function ClientDashboard() {
  const [stats, setStats] = useState({ risk: 0, projects: 0, compliance: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    api.get('/api/dashboard/stats').then(r => {
       setStats({
          risk: 100 - (r.data.avg_risk || 0), // Posture = 100 - risk
          projects: r.data.engagements || 0,
          compliance: r.data.compliance_score || 0,
          tasks: r.data.open_incidents || 0
       });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="page-header">
         <h1 className="page-title text-2xl font-black text-white uppercase tracking-tighter">Enterprise Overview</h1>
         <p className="page-sub text-slate-500 font-bold uppercase tracking-widest text-[10px]">Portal Alpha v2.0 • Real-time Monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Security Posture" value={`${stats.risk}%`} icon="🛡️" color={stats.risk > 80 ? '#10b981' : stats.risk > 60 ? '#f59e0b' : '#ef4444'} />
        <StatCard label="Compliance Index" value={`${stats.compliance}%`} icon="📊" />
        <StatCard label="Active Advisory" value={stats.projects} icon="⬡" />
        <StatCard label="Alert Signals" value={stats.tasks} icon="⚡" color={stats.tasks > 0 ? '#ef4444' : '#10b981'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-2">
            <AttackSurfaceMap />
         </div>
         <div>
            <ComplianceScorecard />
         </div>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Security Engagements</h3>
          </div>
          <Badge label="Operational" variant="active" />
        </div>
        <div className="p-8">
           <ClientEngagements compact />
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Live Threat Feed</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Global intelligence · Curated security advisories for your organization</p>
          </div>
          <span className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
          </span>
        </div>
        <div className="p-6">
          <ThreatFeedWidget />
        </div>
      </div>
    </div>
  );
}

// ── ENGAGEMENT HUB ────────────────────────────────────────────────────────────
export function ClientEngagements() {
  const [engagements, setEngagements] = useState([]);
  
  useEffect(() => {
    api.get('/api/portal/engagements').then(r => setEngagements(r.data.engagements)).catch(()=>{});
  }, []);

  return (
    <div className="card">
       <div className="flex justify-between items-center mb-6">
          <h2 className="page-title">Project Tracker</h2>
          <button className="btn btn-primary btn-sm">New Request</button>
       </div>
       <div className="table-wrap">
          <table className="data-table">
             <thead>
                <tr>
                   <th>Engagement</th>
                   <th>Status</th>
                   <th>Progress</th>
                   <th>Assigned Analyst</th>
                   <th>Deadline</th>
                </tr>
             </thead>
             <tbody>
                {engagements.map(e => (
                   <tr key={e.id}>
                      <td>{e.title}</td>
                      <td><Badge type={e.status==='active'?'success':'indigo'}>{e.status}</Badge></td>
                      <td>{e.progress}%</td>
                      <td>{e.analyst_name || 'Pending'}</td>
                      <td>{e.end_date || 'TBD'}</td>
                   </tr>
                ))}
                {engagements.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-500">No active engagements found.</td></tr>}
             </tbody>
          </table>
       </div>
    </div>
  );
}

// ── SERVICE HUB ───────────────────────────────────────────────────────────────
export function ServiceHub() {
  const [services, setServices] = useState([]);
  const [requestModal, setRequestModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    api.get('/api/portal/services').then(r => setServices(r.data.services)).catch(()=>{});
  }, []);

  const handleRequest = async () => {
     try {
        await api.post('/api/portal/engagements', { service_id: selectedService.id, title: selectedService.name });
        toast.success("Engagement request submitted");
        setRequestModal(false);
     } catch {
        toast.error("Failed to submit request");
     }
  };

  return (
    <div className="grid grid-stats">
       {services.map(s => (
          <div key={s.id} className="card glass flex flex-col justify-between">
             <div>
                <h3 className="text-lg font-bold text-indigo-400 mb-2">{s.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{s.description}</p>
             </div>
             <button className="btn btn-outline btn-full" onClick={() => { setSelectedService(s); setRequestModal(true); }}>Request Service</button>
          </div>
       ))}
       
       <Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title={`Request ${selectedService?.name}`}>
          <div className="space-y-4 pt-4">
             <p className="text-sm text-gray-400">This will notify our analysts team. We will review your requirements and reach out within 24 hours.</p>
             <button className="btn btn-primary btn-full" onClick={handleRequest}>Confirm Request</button>
          </div>
       </Modal>
    </div>
  );
}

// ── DOCUMENT VAULT ────────────────────────────────────────────────────────────
export function DocumentVault() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = () => api.get('/api/portal/documents').then(r => setDocs(r.data.documents)).catch(()=>{});
  useEffect(() => { fetchDocs(); }, []);

  const onUpload = async (e) => {
     const file = e.target.files[0];
     if (!file) return;
     const formData = new FormData();
     formData.append('file', file);
     formData.append('title', file.name);
     
     setUploading(true);
     try {
        await api.post('/api/portal/documents', formData);
        toast.success("Document uploaded successfully");
        fetchDocs();
     } catch {
        toast.error("Upload failed");
     } finally {
        setUploading(false);
     }
  };

  return (
    <div className="card">
       <div className="flex justify-between items-center mb-6">
          <h2 className="page-title">Evidence & Policy Vault</h2>
          <label className="btn btn-indigo btn-sm cursor-pointer">
             {uploading ? 'Uploading...' : 'Upload Document'}
             <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
       </div>
       <div className="table-wrap">
          <table className="data-table">
             <thead>
                <tr>
                   <th>Document Name</th>
                   <th>Category</th>
                   <th>Date Uploaded</th>
                   <th>Uploader</th>
                   <th>Actions</th>
                </tr>
             </thead>
             <tbody>
                {docs.map(d => (
                   <tr key={d.id}>
                      <td>{d.title}</td>
                      <td><Badge>{d.category}</Badge></td>
                      <td>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td>{d.uploader_name}</td>
                      <td>
                         <button className="text-indigo-400 hover:text-indigo-300" onClick={() => window.open(`${api.defaults.baseURL}/api/portal/documents/${d.id}/download`, '_blank')}>Download</button>
                      </td>
                   </tr>
                ))}
                {docs.length === 0 && <tr><td colSpan="5" className="text-center py-8 text-gray-500">Vault is empty.</td></tr>}
             </tbody>
          </table>
       </div>
    </div>
  );
}

// ── CONSULTATION REQUEST ──────────────────────────────────────────────────────
export function ConsultationCenter() {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [requests, setRequests] = useState([]);

  useEffect(() => {
     // In real app, fetch existing requests
  }, []);

  const handleSubmit = async (e) => {
     e.preventDefault();
     try {
        await api.post('/api/portal/consultations', form);
        toast.success("Consultation request sent");
        setForm({ subject: '', message: '' });
     } catch {
        toast.error("Failed to send request");
     }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <div className="card glass">
          <h3 className="text-lg font-bold mb-4">Book Advisor Consultation</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="label">Subject</label>
                <input className="input" value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} placeholder="e.g. ISO Readiness Review" required/>
             </div>
             <div>
                <label className="label">Requirement Details</label>
                <textarea className="input" rows={5} value={form.message} onChange={e=>setForm({...form, message:e.target.value})} placeholder="Explain what help you need..." required/>
             </div>
             <button type="submit" className="btn btn-primary btn-full">Submit Request</button>
          </form>
       </div>
       <div className="card">
          <h3 className="text-lg font-bold mb-4">Upcoming Meetings</h3>
          <div className="text-center py-12 text-gray-500">
             <div className="text-4xl mb-2">📅</div>
             <p>No scheduled consultations at this time.</p>
          </div>
       </div>
    </div>
  );
}

// ── BILLING ───────────────────────────────────────────────────────────────────
export function BillingCenter() {
   const [invoices, setInvoices] = useState([]);
   const { user } = useAuth();

   // Sample invoice data to test the integration flow
   useEffect(() => {
     setInvoices([
        { id: 'INV-2024-001', service: 'Cyber Assurance Audit', amount: 5000, status: 'unpaid', due_date: new Date(Date.now() + 86400000).toISOString() }
     ]);
   }, []);

   const handlePayment = async (invoice) => {
      try {
         const { data } = await api.post('/api/portal/payments/initialize', {
            amount: invoice.amount,
            email: user?.email,
            invoice_id: invoice.id
         });
         // Redirect user to Paystack checkout page
         if (data?.data?.authorization_url) {
            window.location.href = data.data.authorization_url;
         }
      } catch (err) {
         toast.error("Failed to initialize secure payment. Ensure API keys are valid.");
      }
   };
   
   return (
      <div className="card">
          <div className="page-header">
            <h1 className="page-title text-2xl font-black text-white uppercase tracking-tighter">Billing & Subscriptions</h1>
            <p className="page-sub text-slate-500 font-bold uppercase tracking-widest text-[10px]">Secure payment gateway powered by Paystack</p>
          </div>
          <div className="table-wrap">
             <table className="data-table">
                <thead>
                   <tr>
                      <th>Invoice #</th>
                      <th>Service</th>
                      <th>Amount (GHS)</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Action</th>
                   </tr>
                </thead>
                <tbody>
                   {invoices.map(inv => (
                      <tr key={inv.id}>
                         <td className="font-mono text-xs">{inv.id}</td>
                         <td className="font-bold">{inv.service}</td>
                         <td className="text-emerald-400 font-bold">₵{inv.amount.toLocaleString()}</td>
                         <td><Badge label={inv.status} variant={inv.status==='unpaid'?'danger':'success'} /></td>
                         <td className="text-xs text-slate-400">{new Date(inv.due_date).toLocaleDateString()}</td>
                         <td>
                            {inv.status === 'unpaid' ? (
                               <button onClick={() => handlePayment(inv)} className="btn btn-primary btn-sm px-4 uppercase tracking-widest text-[10px]">Pay Now</button>
                            ) : (
                               <button disabled className="btn btn-ghost btn-sm">Paid</button>
                            )}
                         </td>
                      </tr>
                   ))}
                   {invoices.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-500">No pending invoices.</td></tr>}
                </tbody>
             </table>
          </div>
      </div>
   );
}
