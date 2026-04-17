import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';

export default function Terms() {
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
        <h1 className="text-4xl font-black text-white mb-8 tracking-tighter uppercase">Terms of Service</h1>
        <p className="text-sm border-l-2 border-cyan-500 pl-4 mb-12 text-slate-400 italic">Last Updated: April 9, 2026</p>

        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">1. Agreement to Terms</h2>
            <p className="leading-relaxed">
              By accessing or using the Chayil SecureX platform and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the services. These terms apply to all users, visitors, and requesting entities of our platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">2. Use of Services</h2>
            <p className="leading-relaxed">
              Our services are intended for professional use by organisations seeking GRC and Cybersecurity assurance. You are responsible for maintaining the confidentiality of your operator credentials (access keys) and for all activities that occur under your account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">3. Intellectual Property</h2>
            <p className="leading-relaxed">
              The Chayil SecureX platform, its content, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio) are owned by Chayil SecureX Limited and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">4. Prohibited Activities</h2>
            <p className="leading-relaxed">
              Users are prohibited from attempting to bypass technical security measures, performing unauthorized vulnerability assessments on our infrastructure, or using the platform for any illegal activities. Any breach of this section will result in immediate termination of access and potential legal action.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">5. Limitation of Liability</h2>
            <p className="leading-relaxed">
              Chayil SecureX provides cybersecurity assurance based on the data and access provided. While we strive for technical excellence, we do not guarantee that our services will uncover every potential vulnerability or prevent every cyber incident. Our liability is limited to the fees paid for the specific service engagement.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
