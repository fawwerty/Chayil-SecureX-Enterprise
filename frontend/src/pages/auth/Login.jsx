import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message;

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  
  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/analyst');
    } catch (err) {
      setError(err.response?.data?.error || 'Intelligence Access Denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 auth-card relative z-10"
      >
        {/* Left Panel: Visual & Brand */}
        <div className="hidden lg:flex flex-col justify-between p-16 border-r border-white/5 relative bg-gradient-to-br from-indigo-500/10 to-transparent">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          
          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 mb-20"
            >
              <img src="/logo.jpg" className="w-12 h-12 rounded-2xl shadow-2xl border border-white/10" alt="Logo" />
              <div className="text-2xl font-black text-white tracking-tighter uppercase">CHAYIL <span className="text-cyan-400">SECUREX</span></div>
            </motion.div>

            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] text-shadow-glow">Cyber Assurance Hub</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-6xl font-black text-white leading-[1.05] tracking-tighter"
              >
                Africa's <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Cyber Shield.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-slate-400 font-medium leading-relaxed max-w-sm text-lg"
              >
                Secure your enterprise with sovereign intelligence and automated GRC orchestration.
              </motion.p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="relative grid grid-cols-2 gap-10"
          >
            {[
              { v: 'SOC 2', l: 'Compliant' },
              { v: 'ISO 27001', l: 'Assurance' }
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
            <div className="mb-12">
              <h2 className="text-3xl font-black text-white tracking-tight mb-3 uppercase">Welcome Back</h2>
              <p className="text-slate-500 font-medium text-sm">Enter your operator credentials to access the portal.</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-8 overflow-hidden"
                >
                  <div className="text-xs font-bold text-red-400 flex items-center gap-3">
                    <span className="text-base">⚠</span> {error}
                  </div>
                </motion.div>
              )}
              {successMsg && !error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl mb-8 overflow-hidden"
                >
                  <div className="text-xs font-bold text-green-400 flex items-center gap-3">
                    <span className="text-base">✓</span> {successMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Operator Identity</label>
                <input 
                  className="w-full auth-input px-5 text-white placeholder:text-slate-700 outline-none" 
                  type="email" name="email" value={form.email} onChange={handle} placeholder="admin@chayilsecurex.com" required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Key</label>
                  <button type="button" className="text-[10px] font-black text-cyan-500 hover:text-white uppercase tracking-widest transition-colors bg-transparent border-none cursor-pointer">Recover Key</button>
                </div>
                <input 
                  className="w-full auth-input px-5 text-white placeholder:text-slate-700 outline-none" 
                  type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••••••" required
                />
              </div>
              <button 
                type="submit" 
                className="w-full auth-btn bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] border-none cursor-pointer"
                disabled={loading}
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full mx-auto" /> : 'AUTHENTICATE →'}
              </button>
            </form>

            <div className="mt-16 text-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">No Access Repository?</p>
              <button onClick={() => navigate('/signup')} className="text-[10px] font-black text-cyan-500 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto bg-transparent border-none cursor-pointer">
                REQUEST ENROLLMENT →
              </button>
            </div>

            <div className="mt-10 pt-10 border-t border-white/5 text-center">
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
