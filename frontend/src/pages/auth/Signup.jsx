import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', organization: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  
  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/signup`, form);
      navigate('/login', { state: { message: 'Enrollment successful. You can now authenticate.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Intelligence Enrollment Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-cyan-500/10 blur-[150px] rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 auth-card relative z-10"
      >
        {/* Left Panel: Brand & Mission */}
        <div className="hidden lg:flex flex-col justify-between p-16 border-r border-white/5 relative bg-gradient-to-br from-cyan-500/10 to-transparent">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 mb-20"
            >
              <img src="/logo.jpg" className="w-12 h-12 rounded-2xl shadow-2xl border border-white/10" alt="Logo" />
              <div className="text-2xl font-black text-white tracking-tighter uppercase">CHAYIL <span className="text-cyan-400">SECUREX</span></div>
            </motion.div>

            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] text-shadow-glow">Operator Enrollment</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-black text-white leading-[1.05] tracking-tighter"
              >
                Join the <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Vanguard.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-400 font-medium leading-relaxed max-w-sm text-lg"
              >
                Request your credentials for Africa's most advanced cybersecurity and GRC orchestration network.
              </motion.p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative grid grid-cols-2 gap-10"
          >
            {[
              { v: 'Real-time', l: 'Assurance' },
              { v: 'Global', l: 'Alignment' }
            ].map(s => (
              <div key={s.l}>
                <div className="text-xl font-black text-white tracking-tight leading-none mb-2">{s.v}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Panel: Form */}
        <div className="p-10 lg:p-20 flex flex-col justify-center bg-slate-950/20">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black text-white tracking-tight mb-3 uppercase">Enrollment</h2>
              <p className="text-slate-500 font-medium text-sm">Initialize your operator identity to proceed.</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-8 overflow-hidden"
                >
                  <div className="text-xs font-bold text-red-100 flex items-center gap-3">
                    <span className="text-base">⚠</span> {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Full Name</label>
                <input 
                  className="w-full auth-input px-5 text-white placeholder:text-slate-700 outline-none" 
                  name="name" value={form.name} onChange={handle} placeholder="Kwame Mensah" required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Organisation</label>
                <input 
                  className="w-full auth-input px-5 text-white placeholder:text-slate-700 outline-none" 
                  name="organization" value={form.organization} onChange={handle} placeholder="Company Ltd" required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Work Email</label>
                <input 
                  className="w-full auth-input px-5 text-white placeholder:text-slate-700 outline-none" 
                  type="email" name="email" value={form.email} onChange={handle} placeholder="kwame@company.com" required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Access Key</label>
                <input 
                  className="w-full auth-input px-5 text-white placeholder:text-slate-700 outline-none" 
                  type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••••••" required
                />
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full auth-btn bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/25 active:scale-[0.98] border-none cursor-pointer"
                  disabled={loading}
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full mx-auto" /> : 'REQUEST ENROLLMENT →'}
                </button>
              </div>
            </form>

            <div className="mt-12 text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">Already authenticated?</p>
              <button onClick={() => navigate('/login')} className="text-[10px] font-black text-cyan-500 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto bg-transparent border-none cursor-pointer">
                SIGN IN AS OPERATOR →
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <button onClick={() => navigate('/')} className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto bg-transparent border-none cursor-pointer">
                ← RETURN TO SURFACE
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
