import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/* ━━━ Navbar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'Services', href: '#services' },
    { label: 'Platform', href: '#platform' },
    { label: 'About', href: '#about' },
    { label: 'Team', href: '#team' },
    { label: 'Clients', href: '#clients' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`glass-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container flex items-center justify-between">
        <a href="#hero" className="flex items-center gap-3 no-underline group translate-y-[-2px]">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-lg group-hover:bg-indigo-500/40 transition-colors" />
            <img src="/logo.jpg" alt="Chayil SecureX" className="relative w-10 h-10 rounded-lg object-cover border border-white/10"
              onError={e => { e.target.style.display='none'; }} />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-white uppercase flex flex-col leading-none">
            <span className="text-cyan-400 text-[10px] tracking-[0.2em] font-mono mb-1">CHAYIL</span>
            <span>SECUREX</span>
          </span>
        </a>

        <div className="flex items-center gap-8">
          <ul className={`hidden lg:flex items-center gap-6 list-none m-0 p-0`}>
            {links.map(l => (
              <li key={l.label}>
                <a href={l.href} className="nav-link-bold no-underline">{l.label}</a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <button
              className="text-xs font-semibold transition-colors bg-transparent border-none cursor-pointer"
              style={{ color:'rgba(255,255,255,0.45)' }}
              onMouseEnter={e=>e.target.style.color='#fff'}
              onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.45)'}
              onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button
              className="portal-btn-premium cursor-pointer border-none"
              onClick={() => navigate('/portal')}>
              PORTAL →
            </button>
          </div>
        </div>

        <button className="lg:hidden flex flex-col gap-1 b-none bg-transparent cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
          <div className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <div className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <div className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`absolute top-[80px] left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-b border-indigo-500/20 lg:hidden transition-all duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto max-h-[400px]' : 'opacity-0 pointer-events-none max-h-0'}`}>
        <ul className="list-none p-6 space-y-4">
          {links.map(l => (
            <li key={l.label}>
              <a href={l.href} className="block text-sm font-bold text-white no-underline py-2" onClick={() => setMenuOpen(false)}>{l.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/* ━━━ Three.js Hero Canvas ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HeroCanvas() {
  const ref = useRef();
  useEffect(() => {
    if (!window.THREE) return;
    const THREE = window.THREE;
    const canvas = ref.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const indigo = new THREE.Color(0x6366f1);
    const violet = new THREE.Color(0x8b5cf6);

    // Globe wireframe
    const globeGeo = new THREE.IcosahedronGeometry(1.8, 4);
    const globeMat = new THREE.MeshBasicMaterial({
      color: indigo, wireframe: true, transparent: true, opacity: 0.15
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Inner glow sphere
    const innerGeo = new THREE.SphereGeometry(1.7, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: violet, transparent: true, opacity: 0.04
    });
    scene.add(new THREE.Mesh(innerGeo, innerMat));

    // Orbital rings
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.016, 16, 120),
      new THREE.MeshBasicMaterial({ color: indigo, transparent: true, opacity: 0.4 })
    );
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.75, 0.010, 16, 120),
      new THREE.MeshBasicMaterial({ color: violet, transparent: true, opacity: 0.3 })
    );
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 6;
    scene.add(ring2);

    const ring3 = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.007, 16, 120),
      new THREE.MeshBasicMaterial({ color: indigo, transparent: true, opacity: 0.15 })
    );
    ring3.rotation.x = Math.PI / 5;
    ring3.rotation.y = Math.PI / 3;
    scene.add(ring3);

    // Particles
    const pCount = 2500;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const col = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 3 + Math.random() * 8;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(p) * Math.cos(t);
      pos[i*3+1] = r * Math.sin(p) * Math.sin(t);
      pos[i*3+2] = r * Math.cos(p);
      const mix = Math.random();
      const c = indigo.clone().lerp(violet, mix);
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(pGeo,
      new THREE.PointsMaterial({
        size: 1.6, vertexColors: true,
        transparent: true, opacity: 0.8,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    scene.add(pts);

    // Grid floor
    const grid = new THREE.GridHelper(50, 60, indigo, new THREE.Color(0x020205));
    grid.position.y = -4;
    grid.material.transparent = true;
    grid.material.opacity = 0.1;
    scene.add(grid);

    // Mouse tracking
    let mx = 0, my = 0;
    const onMouse = e => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    document.addEventListener('mousemove', onMouse);

    const clock = new THREE.Clock();
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      globe.rotation.y = t * 0.09;
      globe.rotation.x = Math.sin(t * 0.06) * 0.1;
      ring1.rotation.z = t * 0.1;
      ring2.rotation.z = -t * 0.07;
      ring3.rotation.y = t * 0.05;
      pts.rotation.y   = t * 0.02;
      camera.position.x += (mx * 0.3 - camera.position.x) * 0.025;
      camera.position.y += (-my * 0.2 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousemove', onMouse);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} id="heroCanvas" />;
}

/* ━━━ Stat Counter ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StatCounter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        obs.disconnect();
        const dur = 2200, start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setVal(Math.floor(eased * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref} className="hero-stat-num">{val}{suffix}</span>;
}

/* ━━━ Reveal ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const siblings = e.target.parentElement?.querySelectorAll('.reveal') || [];
          const idx = Array.from(siblings).indexOf(e.target);
          setTimeout(() => e.target.classList.add('visible'), idx * 90);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ━━━ Contact Form ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ContactForm() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', company:'', service:'', message:'' });
  const [status, setStatus] = useState('');
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    setStatus('sending');
    try {
      await axios.post(`${API}/api/contact`, form);
      setStatus('success');
      setForm({ name:'', email:'', phone:'', company:'', service:'', message:'' });
    } catch { setStatus('error'); }
  };
  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
        <div>
          <label className="label">Full Name</label>
          <input className="input" name="name" value={form.name} onChange={handle} placeholder="Kwame Mensah" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" name="email" value={form.email} onChange={handle} placeholder="kwame@company.com" required />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
          <input className="input" name="phone" value={form.phone} onChange={handle} placeholder="+233 24 075 4253" />
        <div>
          <label className="label">Organisation</label>
          <input className="input" name="company" value={form.company} onChange={handle} placeholder="Company Ltd" />
        </div>
      </div>
      <div>
        <label className="label">Service of Interest</label>
        <select className="select input" name="service" value={form.service} onChange={handle}>
          <option value="">Select a service</option>
          {['Cyber Assurance','IT & Security Auditing','Risk Management','Compliance & Regulatory','Vulnerability Assessment','CISO Advisory & Strategy'].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Message</label>
        <textarea className="textarea input" name="message" value={form.message} onChange={handle} rows={4} placeholder="Tell us about your security needs..." required />
      </div>
      <button type="submit" className="btn btn-primary btn-full" disabled={status==='sending'}>
        {status === 'sending' ? 'Sending…' : status === 'success' ? '✓ Message Sent!' : 'Send Secure Message'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs text-center mt-2">
          Failed to send. Email us directly at chayilsecurex@gmail.com
        </p>
      )}
    </form>
  );
}

/* ━━━ Platform Feature Card ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function PlatformCard({ icon, title, desc, tag }) {
  return (
    <div className="service-card reveal">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'18px' }}>
        <div className="service-icon-wrap" style={{ background:'rgba(212,168,67,0.08)', borderColor:'rgba(212,168,67,0.2)', color:'var(--gold)' }}>
          {icon}
        </div>
        <span style={{
          fontSize:10, padding:'3px 10px', borderRadius:'50px',
          background:'rgba(212,168,67,0.1)', color:'var(--gold)',
          border:'1px solid rgba(212,168,67,0.2)',
          fontFamily:'var(--font-mono)', letterSpacing:'1px'
        }}>{tag}</span>
      </div>
      <div className="service-title">{title}</div>
      <div className="service-desc">{desc}</div>
    </div>
  );
}

export default function Landing() {
  useReveal();
  const navigate = useNavigate();

  const services = [
    {
      id:'assurance',
      icon:<svg viewBox="0 0 48 48" fill="none"><path d="M24 4l18 10v14c0 10-18 16-18 16S6 38 6 28V14L24 4z" stroke="currentColor" strokeWidth="2"/><path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      title:'Cyber Assurance',
      desc:'Independent assurance over security controls, policies, and processes — giving boards measurable confidence in your cyber posture.'
    },
    {
      id:'audit',
      icon:<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="6" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M18 18h12M18 24h12M18 30h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      title:'IT & Security Auditing',
      desc:'Comprehensive IT general controls audits aligned to ISO 27001, COBIT, NIST, and Ghana CSIRT standards.'
    },
    {
      id:'risk',
      icon:<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/><path d="M24 14v10l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      title:'Risk Management',
      desc:'Enterprise risk assessments, risk register development, treatment planning, and continuous monitoring aligned to ISO 31000.'
    },
    {
      id:'compliance',
      icon:<svg viewBox="0 0 48 48" fill="none"><path d="M12 34a8 8 0 01-1-15.9A12 12 0 0135 20a8 8 0 01-1 15.9H12z" stroke="currentColor" strokeWidth="2"/></svg>,
      title:'Compliance & Regulatory',
      desc:'Navigate SOC 2, ISO 27001, GDPR, NDPA Ghana, and PCI-DSS requirements with expert governance consulting.'
    },
    {
      id:'vuln',
      icon:<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/><circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2"/><path d="M24 8v6M24 34v6M8 24h6M34 24h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      title:'Vulnerability Assessment',
      desc:'Technical vulnerability assessments and penetration testing with risk-rated remediation roadmaps.'
    },
    {
      id:'ciso',
      icon:<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2"/><path d="M8 42c0-8.8 7.2-16 16-16s16 7.2 16 16" stroke="currentColor" strokeWidth="2"/></svg>,
      title:'CISO Advisory & Strategy',
      desc:'Virtual CISO services, security program maturity assessments, and board-level strategic roadmap development.'
    },
  ];

  const platformFeatures = [
    { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title:'Real-Time SOC', desc:'Live SIEM with continuous monitoring, alert triage, and incident response workflows.', tag:'SOC' },
    { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>, title:'OSINT Intelligence', desc:'Domain, IP, email, and hash intelligence gathering with automated threat enrichment.', tag:'OSINT' },
    { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>, title:'Kali Tool Suite', desc:'8 enterprise Kali Linux tools including nmap, nuclei, sqlmap — sandboxed and authorized.', tag:'VA/PT' },
    { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>, title:'Threat Intelligence', desc:'Live IOC database, threat feeds, and AI-powered threat correlation across your environment.', tag:'TI' },
    { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title:'IAM & Access Control', desc:'Role-based access with JWT, MFA support, and complete audit trails for every user action.', tag:'IAM' },
    { icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, title:'Reports Engine', desc:'Automated compliance reports for ISO 27001, SOC 2, PCI-DSS, GDPR, and Ghana NDPA.', tag:'GRC' },
  ];

  const team = [
    { initials:'CH', photo:'/ceo.jpg',             name:'Charles Fiifi Hagan', role:'Chief Executive Officer (CEO)',        bio:'Chartered Accountant and cybersecurity leader. 15+ years experience in GRC, Cyber Assurance, and Corporate Governance across West Africa.' },
    { initials:'EO', photo:'/Ebenezer.jpg',        name:'Ebenezer Oduro',      role:'Chief Operations Officer (COO)',       bio:'Specialist in Audit and Operational Risk. Lead auditor for ISO 27001 with a track record of implementing security frameworks for major financial institutions.' },
    { initials:'SA', photo:'/Silas.jpg',           name:'Silas Asani Abudu',   role:'Chief Technology Officer (CTO)',       bio:'Cybersecurity engineer and technical auditor. Expert in vulnerability management, SOC orchestration, and designing resilient technical architectures.' },
    { initials:'NO', photo:'/Noah.jpg',            name:'Noah Ofori',          role:'Head of Risk & Compliance',            bio:'Expert in enterprise risk frameworks, ISO 31000 implementation, and regulatory compliance for banking and telecoms across sub-Saharan Africa.' },
    { initials:'JD', photo:'/tech-lead.jpg', name:'Operations Lead',     role:'Senior Security Strategist',              bio:'Expert in cybersecurity governance, audit coordination, and delivering strategic risk management solutions for global enterprises.' },
  ];

  const testimonials = [
    { initials:'KA', name:'Kwabena Asante', org:'CISO, GCB Bank', text:'Chayil SecureX uncovered critical control gaps our previous assessors missed for years. Their thoroughness helped us achieve ISO 27001 certification on the first attempt.' },
    { initials:'AM', name:'Abena Mensah', org:'CRO, Stanbic Ghana', text:'Their risk management framework transformed how our board views cyber risk. We went from reactive firefighting to proactive, measurable risk reduction across the enterprise.' },
    { initials:'DB', name:'David Boateng', org:'CISO, MTN Ghana', text:"Chayil SecureX's assurance program gave us the confidence to present our security posture to regulators. Their SOC 2 engagement cut our compliance timeline by 60%." },
  ];

  return (
    <>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js" />
      <Navbar />

      {/* ━━━ HERO ━━━ */}
      <section id="hero" className="hero min-h-screen section-bg-wrapper">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/background4.jpg")' }} />
        <div className="section-bg-overlay opacity-90" />
        <HeroCanvas />
        
        {/* Ambient orbs */}
        <div className="orb orb-indigo w-[600px] h-[600px] top-[10%] left-[5%] opacity-20" />
        <div className="orb orb-violet w-[400px] h-[400px] bottom-[20%] right-[10%] opacity-15" />

        <div className="container relative z-10 flex flex-col items-center justify-center min-h-screen text-center pt-64 pb-20">
          <div className="reveal">
            <h1 className="hero-title text-xl md:text-3xl font-black text-white leading-tight tracking-tighter mb-5 max-w-2xl mx-auto uppercase">
               Chayil SecureX — Africa’s Trusted <br /> 
               Partner in GRC & Cybersecurity
            </h1>

            <p className="hero-sub max-w-lg mx-auto mb-10 leading-relaxed">
              We provide integrated risk management and resilience for Africa's leading enterprises,
              delivering measurable security confidence through technical excellence.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
              <button
                onClick={() => navigate('/signup')}
                style={{ background:'#fff', color:'#09090f', padding:'12px 32px', borderRadius:6, fontSize:12, fontWeight:800, letterSpacing:'0.08em', border:'none', cursor:'pointer', transition:'opacity 0.18s' }}
                onMouseEnter={e=>e.target.style.opacity='0.9'}
                onMouseLeave={e=>e.target.style.opacity='1'}>
                REQUEST AN AUDIT →
              </button>
              <a href="#platform"
                style={{ display:'inline-flex', alignItems:'center', padding:'12px 32px', borderRadius:6, fontSize:12, fontWeight:700, letterSpacing:'0.06em', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.8)', textDecoration:'none', transition:'all 0.18s' }}>
                EXPLORE PLATFORM
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
          <div className="w-px h-16 bg-gradient-to-b from-transparent to-white/50" />
          <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-white">SCROLL</span>
        </div>
      </section>

      {/* ━━━ SERVICES ━━━ */}
      <section id="services" className="section section-bg-wrapper">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url("/bg_services.png")' }} />
        <div className="section-bg-overlay" />
        
        <div className="container relative z-10">
          <div className="max-w-3xl mb-16">
            <span className="section-tag reveal">// Core Strategy</span>
            <h2 className="section-title reveal text-white">
              Sovereign <span className="text-cyan-400">Cyber Assurance</span>
            </h2>
            <p className="section-sub reveal text-slate-300 font-medium">
              We deliver rigorous security control frameworks and independent auditing that 
              enable African organisations to meet global standards with local precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(s => (
              <div key={s.id} onClick={() => navigate('/signup')} className="glass-card clickable-card reveal p-8 group relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/5 blur-[60px] group-hover:bg-indigo-500/10 transition-all" />
                
                <div style={{ width:48, height:48, borderRadius:10, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#818cf8', marginBottom:24, transition:'all 0.3s' }} className="group-hover:scale-105 transition-all">
                  <div style={{ width:24, height:24, opacity:0.9 }}>{s.icon}</div>
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginBottom:10, letterSpacing:'-0.01em' }}>{s.title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.65, marginBottom:20 }}>{s.desc}</div>
                
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.16em', color:'rgba(255,255,255,0.3)', transition:'all 0.2s' }} className="group-hover:gap-8">
                  SECURE ACCESS <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PLATFORM ━━━ */}
      <section id="platform" className="section section-bg-wrapper">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url("/bg_platform.png")' }} />
        <div className="section-bg-overlay opacity-95" />
        
        <div className="container relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
            <div className="max-w-2xl">
              <span className="section-tag reveal">// The Engine</span>
              <h2 className="section-title reveal text-white">
                Next-Gen <span className="text-violet-400">GRC Automation</span>
              </h2>
              <p className="section-sub reveal text-slate-300 font-medium mb-0">
                Chayil SecureX digitises the entire risk lifecycle, connecting your assets, 
                vulnerabilities, and compliance requirements in a unified real-time portal.
              </p>
            </div>
            <button onClick={() => navigate('/portal')} className="portal-btn-premium px-10 py-4 text-[10px] text-white uppercase tracking-widest self-start lg:self-auto border-none cursor-pointer">
              ENTER PORTAL →
            </button>
          </div>

          <div className="reveal glass border-indigo-500/20 rounded-[32px] overflow-hidden mb-16">
            <div className="bg-slate-950/40 backdrop-blur-2xl p-1">
              <div className="bg-indigo-500/5 rounded-[30px] px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-lg">
                  <div className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">
                    Unified Security Intelligence
                  </div>
                  <div className="text-[13px] text-slate-400 leading-relaxed font-medium">
                    Integrated Threat Intelligence, Automated Compliance Scoring, and Real-time Auditor Collaboration 
                    designed to reduce manual overhead by 70%.
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {['ISO Readiness','SOC Visibility','Risk Registers','Live Forensics'].map(p => (
                    <span key={p} className="px-6 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[10px] font-black text-violet-300 uppercase tracking-widest">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {platformFeatures.map((f, i) => (
              <div key={i} className="glass-card reveal p-8 transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div style={{ width:40, height:40, borderRadius:8, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#a78bfa' }}>
                    <div style={{ width:20, height:20 }}>{f.icon}</div>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:4, background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.08)', letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:'var(--font-mono)' }}>{f.tag}</span>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:8, letterSpacing:'-0.01em' }}>{f.title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ ABOUT ━━━ */}
      <section id="about" className="section section-bg-wrapper">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url("/bg_about.png")' }} />
        <div className="section-bg-overlay" />
        
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="reveal">
              <span className="section-tag">// Heritage & Vision</span>
              <h2 className="section-title text-white">
                Trusted by <span className="text-cyan-400">Africa's</span> Foremost CISOs
              </h2>
              <p className="text-slate-300 mb-8 leading-relaxed text-base font-medium">
                Chayil SecureX was founded by Big-4 audit veterans and seasoned security architects 
                with a singular focus: establishing measurable resilience across the continent's 
                critical digital infrastructure.
              </p>
              <p className="text-slate-400 mb-12 leading-relaxed text-sm">
                Our advisors hold elite certifications (CISSP, CISM, ISO 27001 LA, CEH) and have 
                delivered strategic security roadmaps for top-tier banking, telecom, and government institutions.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#contact" className="portal-btn-premium px-10 py-4 text-[10px] text-white no-underline uppercase tracking-widest border-none cursor-pointer">
                  PARTNER WITH US →
                </a>
                <a href="#team" className="btn btn-outline px-10 py-4 text-[10px] text-white no-underline uppercase tracking-widest border-white/20">
                  MEET LEADERSHIP
                </a>
              </div>
            </div>

            <div className="reveal glass border-indigo-500/10 p-12 rounded-[40px] bg-slate-950/20 backdrop-blur-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 justify-items-center">
                {[
                  { pct:99, label:'Client Retention', cls:'ring-indigo' },
                  { pct:95, label:'Audit Pass Rate', cls:'ring-violet' },
                  { pct:87, label:'Risk Reduction', cls:'ring-indigo' },
                  { pct:100, label:'Integrity Score', cls:'ring-violet' },
                ].map(r => (
                  <div key={r.label} className="relative w-36 text-center" data-percent={r.pct}>
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#ffffff05" strokeWidth="6" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke={r.cls === 'ring-indigo' ? '#22d3ee' : '#8b5cf6'} strokeWidth="6" strokeLinecap="round" className="ring-fill transition-all duration-1000" data-percent={r.pct} style={{ strokeDasharray: 314, strokeDashoffset: 314 }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white tracking-tighter">{r.pct}%</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 leading-tight">{r.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ TEAM ━━━ */}
      <section id="team" className="section section-bg-wrapper">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url("/bg_team.png")' }} />
        <div className="section-bg-overlay" />
        
        <div className="container relative z-10">
          <div className="max-w-3xl mb-16">
            <span className="section-tag reveal">// The Experts</span>
            <h2 className="section-title reveal text-white">
              Strategic <span className="text-cyan-400">Leadership</span>
            </h2>
            <p className="section-sub reveal text-slate-300 font-medium">
              A collective of risk-oriented technologists dedicated to advancing the 
              cybersecurity posture of our enterprise partners.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((m, i) => (
              <div key={i} className="glass-card reveal px-8 py-10 text-center group flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-[-10px] bg-cyan-500/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                  <img
                    src={m.photo}
                    onError={e => { e.target.onerror=null; e.target.src=''; e.target.style.display='none'; e.target.parentElement.querySelector('.fallback-initials').style.display='flex'; }}
                    className="relative w-32 h-32 rounded-full object-cover object-top border-2 border-white/10 group-hover:scale-105 transition-all duration-500"
                    alt={m.name}
                  />
                  <div className="fallback-initials absolute inset-0 rounded-full bg-indigo-900 hidden items-center justify-center text-2xl font-black text-white border-2 border-white/10">
                    {m.initials}
                  </div>
                </div>
                <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:6, letterSpacing:'-0.01em' }} className="group-hover:text-cyan-400 transition-colors">{m.name}</div>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--cyan)', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>{m.role}</div>
                <div className="w-10 h-px bg-indigo-500/30 mb-5" />
                <p className="text-sm text-slate-400 leading-relaxed font-medium">{m.bio}</p>
                <div className="mt-auto pt-8 flex gap-4">
                  <a href="#" className="social-icon-box text-xs no-underline font-bold">in</a>
                  <a href="#" className="social-icon-box text-xs no-underline font-bold">X</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ TESTIMONIALS ━━━ */}
      <section id="clients" className="section section-bg-wrapper">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url("/bg_clients.png")' }} />
        <div className="section-bg-overlay opacity-90" />
        
        <div className="container relative z-10">
          <div className="max-w-3xl mb-20">
            <span className="section-tag reveal">// Global Validation</span>
            <h2 className="section-title reveal text-white">
              Sustaining Enterprise <span className="text-violet-400">Trust</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card reveal p-12 flex flex-col justify-between hover:bg-slate-900/40 transition-all border-white/5">
                <div>
                  <div className="flex gap-1 mb-8">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-cyan-400 text-xs text-shadow-glow">★</span>)}
                  </div>
                  <p className="text-base text-slate-200 font-medium italic leading-relaxed mb-10">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-5 border-t border-white/5 pt-8">
                  <div className="w-12 h-12 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 text-xs font-black">
                    {t.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-white leading-tight uppercase tracking-tight">{t.name}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{t.org}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal mt-16 text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Frameworks & Standards We Cover</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {['ISO 27001','SOC 2','PCI-DSS','GDPR','NIST CSF','COBIT','ISO 31000','Ghana NDPA','CISA','CISSP'].map(f => (
                <span key={f} className="px-5 py-2.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ CONTACT ━━━ */}
      <section id="contact" className="section section-bg-wrapper">
        <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url("/bg_contact.png")' }} />
        <div className="section-bg-overlay opacity-90" />
        
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            <div className="reveal">
              <span className="section-tag">// Professional Consultation</span>
              <h2 className="section-title text-white">Let's Secure <span className="text-cyan-400">Your</span> Infrastructure</h2>
              <p className="text-slate-300 mb-12 text-sm md:text-base leading-relaxed max-w-lg font-medium">
                Our advisors are ready to help you navigate complex regulatory landscapes and technical 
                security challenges. Reach out for a confidential strategy session.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon:'📧', label:'Strategic Inquiry', val:'chayilsecurex@gmail.com' },
                  { icon:'📱', label:'Direct Support', val:'+233 24 075 4253 / +233 26 215 3639' },
                  { icon:'📍', label:'Headquarters', val:'Accra Digital Centre, Accra - Ghana' },
                ].map((c, i) => (
                  <div key={i} className="glass-card p-5 flex items-center gap-5 hover:border-white/10 transition-all group">
                    <div className="text-2xl group-hover:scale-110 transition-transform">{c.icon}</div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{c.label}</div>
                      <div className="text-sm font-extrabold text-white">{c.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal glass-card p-8" style={{ background:'rgba(9,9,15,0.4)', borderColor:'rgba(255,255,255,0.07)' }}>
              <div className="mb-10">
                <h3 className="text-lg font-black text-white mb-2 tracking-tight uppercase">Confidential Inquiry</h3>
                <p className="text-xs text-slate-500 font-medium">Response time: Within 1 business day</p>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <Footer />

      <RingAnimator />
    </>
  );
}

function RingAnimator() {
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.ring-fill').forEach(fill => {
            const pct = parseInt(fill.dataset.percent);
            const circ = 314; // Based on r=50
            fill.style.strokeDashoffset = circ - (circ * pct / 100);
          });
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    // Look for the parent container of the rings
    document.querySelectorAll('[data-percent]').forEach(el => obs.observe(el.parentElement));
    return () => obs.disconnect();
  }, []);
  return null;
}
