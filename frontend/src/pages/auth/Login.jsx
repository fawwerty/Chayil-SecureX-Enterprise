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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/background4.jpg')" }} />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,2,5,0.7),rgba(2,2,5,0.95))] backdrop-blur-sm z-0" />
      
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] relative z-10 p-10 rounded-[32px] bg-slate-900/40 backdrop-blur-2xl border border-white/5 shadow-[0_0_80px_rgba(79,70,229,0.15)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50" />
        
        <div className="relative z-10">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="relative group mb-6">
              <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-2xl group-hover:bg-indigo-500/40 transition-colors" />
              <img src="/logo.jpg" className="relative w-14 h-14 rounded-2xl object-cover border border-white/10" alt="Logo" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Secure Gateway</h2>
            <p className="text-slate-400 font-medium text-xs leading-relaxed max-w-[260px]">
              Authenticate to access the Chayil SecureX cyber assurance portal.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-red-900/30 border border-red-500/20 rounded-xl mb-6 overflow-hidden"
              >
                <div className="text-[11px] font-bold text-red-300 flex items-center justify-center gap-2 uppercase tracking-wide">
                  <span className="text-sm">⚠</span> {error}
                </div>
              </motion.div>
            )}
            {successMsg && !error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-green-900/30 border border-green-500/20 rounded-xl mb-6 overflow-hidden"
              >
                <div className="text-[11px] font-bold text-green-300 flex items-center justify-center gap-2 uppercase tracking-wide">
                  <span className="text-sm">✓</span> {successMsg}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Operator Identity</label>
              <input 
                className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all font-medium" 
                type="email" name="email" value={form.email} onChange={handle} placeholder="admin@chayilsecurex.com" required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Access Key</label>
              </div>
              <input 
                className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all font-medium tracking-widest" 
                type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••••••" required
              />
            </div>
            
            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-white text-slate-950 text-[11px] font-black tracking-[0.2em] uppercase hover:bg-slate-200 active:scale-[0.98] transition-all border-none cursor-pointer flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                disabled={loading}
              >
                {loading ? <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 animate-spin rounded-full" /> : 'AUTHENTICATE →'}
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
              <span className="text-slate-600">No Access?</span>
              <button onClick={() => navigate('/signup')} className="text-indigo-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 font-black">
                ENROLL HERE
              </button>
            </div>
            <button onClick={() => navigate('/')} className="text-[9px] font-black text-slate-600 hover:text-white uppercase tracking-[0.2em] transition-colors bg-transparent border-none cursor-pointer">
              ← RETURN TO SURFACE
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
