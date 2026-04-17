import React from 'react';
import { motion } from 'framer-motion';
import { FaTwitter, FaLinkedin, FaFacebook, FaInstagram, FaEnvelope, FaPhone } from 'react-icons/fa';

const socials = [
  { icon: <FaTwitter />, color: '#1da1f2', name: 'Twitter', href: 'https://x.com/chayilsecurex?s=21' },
  { icon: <FaLinkedin />, color: '#0a66c2', name: 'LinkedIn', href: 'https://www.linkedin.com/company/chayil-securex/' },
  { icon: <FaFacebook />, color: '#1877f2', name: 'Facebook', href: 'https://www.facebook.com/share/16Fugw5xgH/?mibextid=wwXIfr' },
  { icon: <FaInstagram />, color: 'rgba(175, 27, 118, 1)', name: 'Instagram', href: 'https://www.instagram.com/chayilsecurex?igsh=MTdvdWI2a2Y2aDh5Zg==' },
  { icon: <FaEnvelope />, color: '#EA4335', name: 'Email', href: 'mailto:chayilsecurex@gmail.com' },
  { icon: <FaPhone />, color: '#34A853', name: 'Phone', href: 'tel:+233240754253' },
];

export default function SocialIcons() {
  return (
    <div className="flex gap-4 justify-start mt-6">
      {socials.map((s, i) => (
        <motion.a
          key={i}
          href={s.href}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400"
          whileHover={{ 
            backgroundColor: s.color, 
            color: '#fff', 
            y: -5,
            borderColor: 'transparent',
            boxShadow: `0 10px 20px ${s.color}44` 
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          aria-label={s.name}
          target={s.href.startsWith('http') ? '_blank' : undefined}
          rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          <div className="text-base">{s.icon}</div>
        </motion.a>
      ))}
    </div>
  );
}
