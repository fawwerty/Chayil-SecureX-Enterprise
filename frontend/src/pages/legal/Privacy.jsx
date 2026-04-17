import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

export default function Privacy() {
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
        <h1 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase">Privacy Policy</h1>
        <p className="text-sm border-l-2 border-cyan-500 pl-4 mb-12 text-slate-400 italic">Last Updated: April 9, 2026</p>

        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">1. Introduction</h2>
            <p className="leading-relaxed">
              Chayil SecureX Limited ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our GRC and Cybersecurity platform, in alignment with the Ghana Data Protection Act (NDPA) and international standards such as GDPR.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">2. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              We collect information that you provide directly to us, such as when you request an audit, register for an account, or contact our support team.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Personal identifiers (Name, Email, Phone Number)</li>
              <li>Professional information (Job Title, Organisation)</li>
              <li>Platform usage data (Log files, IP addresses, browser types)</li>
              <li>Security telemetry required for auditing and assurance services</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">3. How We Use Your Information</h2>
            <p className="leading-relaxed">
              We use the collected information to provide and improve our services, communicate with you about your security posture, perform regulatory compliance audits, and protect against fraudulent or illegal activities. Your data is used exclusively for the delivery of cybersecurity and assurance services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">4. Data Security</h2>
            <p className="leading-relaxed">
              As a cybersecurity firm, we implement industry-leading technical and organisational measures to protect your data. This includes end-to-end encryption, multi-factor authentication, and continuous monitoring of our infrastructure. However, no method of transmission over the internet is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">5. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection Officer at <span className="text-cyan-400">chayilsecurex@gmail.com</span>.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
