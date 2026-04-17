import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const navGroups = [
  { label: 'Overview', items: [
    { path:'/admin',             label:'Dashboard',           icon:'▦',  exact:true },
    { path:'/admin/cyberscore',  label:'CyberScore Africa',   icon:'◉',  badge:'NEW' },
    { path:'/admin/ai-assistant',label:'AI Assistant',        icon:'✦',  badge:'AI' },
  ]},
  { label: 'Services', items: [
    { path:'/admin/cyber-assurance', label:'Cyber Assurance',     icon:'⬡' },
    { path:'/admin/it-auditing',     label:'IT & Security Audit',  icon:'◈' },
    { path:'/admin/risk-management', label:'Risk Management',      icon:'⬢' },
    { path:'/admin/compliance',      label:'Compliance',           icon:'⊞' },
    { path:'/admin/vulnerability',   label:'Vulnerability Scan',   icon:'⚡' },
    { path:'/admin/ciso-advisory',   label:'CISO Advisory',        icon:'◇' },
  ]},
  { label: 'SOC & Intel', items: [
    { path:'/admin/threat-intelligence', label:'Threat Intelligence', icon:'⬟', badge:'3' },
    { path:'/admin/incidents',           label:'Incident Response',   icon:'🔴', badge:'7' },
    { path:'/admin/network',             label:'Network Monitoring',  icon:'◈' },
    { path:'/admin/cloud',               label:'Cloud Security',      icon:'☁' },
  ]},
  { label: 'Platform', items: [
    { path:'/admin/assets',  label:'Asset Discovery', icon:'◉' },
    { path:'/admin/iam',     label:'IAM & Access',    icon:'⬟' },
    { path:'/admin/consultations', label:'Consultations', icon:'◈', badge:'REQ' },
    { path:'/admin/reports', label:'Reports Engine',  icon:'◈' },
  ]},
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState({ count: 0, items: [] });
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const r = await api.get('/api/dashboard/notifications');
      setNotifications({ count: r.data.count, items: r.data.notifications });
    } catch {}
  };

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);
  const handleLogout = () => { logout(); navigate('/login'); };
  const pageTitle = () => {
    const flat = navGroups.flatMap(g => g.items);
    return flat.find(i => isActive(i.path, i.exact))?.label || 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-[#020205] overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[199] lg:hidden" />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 w-60 bg-[var(--surface-1)] border-r border-[var(--border-subtle)] z-[200] transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="sidebar-header">
            <img src="/logo.jpg" className="sidebar-logo" alt="Logo" />
            <div>
              <div className="sidebar-brand">CHAYIL <span>SECUREX</span></div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Admin Portal</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide py-6">
            {navGroups.map(group => (
              <div key={group.label}>
                <div className="px-[18px] text-[9px] font-bold text-[rgba(255,255,255,0.2)] uppercase tracking-[0.2em] mb-[6px] mt-6">{group.label}</div>
                <div className="space-y-1">
                  {group.items.map(item => {
                    const active = isActive(item.path, item.exact);
                    return (
                      <div key={item.path}
                        onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                      className={`group flex items-center gap-3 cursor-pointer transition-all text-[13px] font-[500] ${
                        active
                          ? 'bg-[rgba(99,102,241,0.1)] text-white border-l-2 border-indigo-500 rounded-r-[8px] ml-0 pl-[16px] pr-4 py-2 mr-[8px]'
                          : 'text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(255,255,255,0.85)] rounded-[8px] mx-[8px] px-[18px] py-2'
                      }`}
                      >
                        <span className={`text-[14px] transition-colors w-[18px] text-center flex-shrink-0 ${active ? 'text-[var(--indigo)]' : 'text-[rgba(255,255,255,0.4)] group-hover:text-white'}`}>{item.icon}</span>
                        <span className="text-[13px] font-[500] leading-none flex-1">{item.label}</span>
                        {item.badge && <span className="px-[6px] py-[2px] rounded-[4px] bg-indigo-500/10 text-[rgba(99,102,241,0.9)] text-[9px] font-bold tracking-tight uppercase border border-indigo-500/15">{item.badge}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 p-2 rounded-[8px] border border-transparent hover:bg-[rgba(255,255,255,0.04)] transition-all cursor-pointer" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-black">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-[12px] font-bold text-white tracking-tight truncate">{user?.name || 'Admin User'}</div>
                <div className="text-[10px] font-medium text-[rgba(255,255,255,0.3)] truncate capitalize">{user?.role || 'operator'}</div>
              </div>
              <div className="text-[rgba(255,255,255,0.2)] group-hover:text-indigo-400 transition-colors">⚙</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[var(--bg-space)]">
        {/* Animated Background Blob */}
        <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <header className="h-14 bg-[rgba(3,3,5,0.9)] backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">☰</button>
            <div>
              <div className="text-base font-black text-white tracking-tighter leading-none mb-1">{pageTitle()}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Operations Panel</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Operational Hub</span>
            </div>
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all relative group ${showNotifications ? 'bg-indigo-500/10 border-indigo-500/30' : ''}`}
              >
                🔔
                {notifications.count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-[#020205] group-hover:scale-110 transition-transform shadow-lg shadow-red-500/20 animate-in zoom-in">
                    {notifications.count}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute top-14 right-0 w-80 bg-[#0A0A1F] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-4 duration-200">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Notifications Hub</span>
                      <span className="text-[9px] font-bold text-slate-500">{notifications.count} New Alerts</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.items.length > 0 ? notifications.items.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => { navigate('/admin/incidents'); setShowNotifications(false); }}
                          className="p-4 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer group"
                        >
                          <div className="flex gap-3">
                            <span className="text-base">{item.icon}</span>
                            <div className="flex-1">
                              <div className="text-[11px] font-bold text-white group-hover:text-indigo-400 transition-colors mb-1">{item.msg}</div>
                              <div className="text-[9px] font-bold text-slate-500 uppercase">{new Date(item.time).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="p-12 text-center">
                          <div className="text-2xl mb-2">🍹</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">All clear !</div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white/5 text-center">
                      <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">View All Alerts</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="relative">
              <div 
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                className={`w-10 h-10 rounded-xl border border-white/10 p-0.5 group cursor-pointer overflow-hidden transition-all ${showUserMenu ? 'ring-2 ring-indigo-500/50' : ''}`}
              >
                <div className="w-full h-full rounded-[9px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-black group-hover:scale-110 transition-transform">
                  {user?.name?.[0] || 'A'}
                </div>
              </div>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute top-14 right-0 w-56 bg-[#0A0A1F] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-4 duration-200">
                    <div className="p-5 border-b border-white/5 bg-white/5">
                      <div className="text-xs font-black text-white mb-0.5">{user?.name || 'Administrator'}</div>
                      <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{user?.role || 'Security Operator'}</div>
                    </div>
                    <div className="p-2">
                      <div 
                        onClick={() => { navigate('/admin/iam'); setShowUserMenu(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer group"
                      >
                        <span className="text-lg">👤</span>
                        <span>My Profile</span>
                      </div>
                      <div 
                        onClick={() => { navigate('/admin/iam'); setShowUserMenu(false); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer group"
                      >
                        <span className="text-lg">⚙</span>
                        <span>Settings</span>
                      </div>
                      <div className="h-px bg-white/5 my-2" />
                      <div 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer group"
                      >
                        <span className="text-lg">⇥</span>
                        <span>Sign Out</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>


        <section className="flex-1 overflow-y-auto p-8 relative z-0 hide-scrollbar scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
