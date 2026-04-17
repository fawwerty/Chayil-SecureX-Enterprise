import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

export default function Security() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#020205] text-slate-300 font-sans">
      <nav className="glass-header scrolled">
        <div className="container flex items-center justify-between">
           <button onClick={() => navigate('/')} className="text-white font-black tracking-tighter uppercase bg-transparent border-none cursor-pointer flex items-center gap-2">
             <img src="/logo.jpg" className="w-8 h-8 rounded-lg" alt="Logo" />
             CHAYIL <span className="text-cyan-400">SECUREX</span>
           </button>
        </div>
      </nav>

      <div className="container pt-40 pb-20 max-w-4xl">
        <h1 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase">Security & Vulnerability</h1>
        <p className="text-sm border-l-2 border-cyan-500 pl-4 mb-12 text-slate-400 italic">Last Updated: April 9, 2026</p>

        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">1. Our Security Posture</h2>
            <p className="leading-relaxed">
              At Chayil SecureX, we "eat our own dog food." Our platform is built on a Zero Trust architecture, utilizing strict IAM policies, encrypted telemetry, and continuous automated auditing. All data at rest is encrypted using AES-256, and all data in transit is protected via TLS 1.3.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">2. Coordinated Disclosure</h2>
            <p className="leading-relaxed">
              We take security researchers and their contributions seriously. If you believe you have found a security vulnerability in our platform, we encourage you to notify us as part of our Coordinated Vulnerability Disclosure (CVD) program.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">3. Reporting a Vulnerability</h2>
            <p className="leading-relaxed mb-4">
              To report a vulnerability, please email <span className="text-cyan-400">chayilsecurex@gmail.com</span> with the subject line "Vulnerability Disclosure". Please include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Description of the vulnerability</li>
              <li>Steps to reproduce (including screenshots or POV)</li>
              <li>Potential impact and remediation suggestions</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">4. Safe Harbor</h2>
            <p className="leading-relaxed">
              We will not take legal action against individuals who perform security research in good faith, provided that they do not harm our users, disrupt our services, or leak any sensitive data. We ask for a reasonable timeframe to remediate any reported issues before public disclosure.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">5. Infrastructure Compliance</h2>
            <p className="leading-relaxed">
              Our infrastructure is hosted in SOC 2 and ISO 27001 compliant data centers. We undergo regular internal and independent audits to maintain the highest levels of technical assurance and regional regulatory alignment.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
