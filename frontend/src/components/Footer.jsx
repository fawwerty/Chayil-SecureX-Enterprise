import SocialIcons from "./SocialIcons";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Footer() {
  const { isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");


  return (
    <footer
      className="bg-gray-950 text-gray-300 py-14 transition-all duration-300 border-t border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">

          {/* LOGO */}
          <div>
            <div className="flex items-center mb-2">
              <img
                src="/logo.jpg"
                alt="Chayil SecureX Logo"
                className="h-8 w-8 rounded-full border border-gray-700 object-cover"
              />
              <span className="ml-2 text-base font-bold tracking-wide">
                Chayil SecureX
              </span>
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              Pioneering sovereign cybersecurity standards across Africa through uncompromising assurance and technical excellence.
            </p>
            <div className="mt-4">
              <SocialIcons />
            </div>
          </div>

          {/* ARCHITECTURE */}
          <div>
            <h3 className="font-semibold text-sm mb-4 tracking-wide uppercase opacity-90">
              Architecture
            </h3>
            <ul className="space-y-2 text-sm opacity-80">
              {[
                ['#services', 'Services'],
                ['#platform', 'The Platform'],
                ['#', 'Documentation'],
                ['#', 'Security Bot'],
              ].map(([path, label]) => (
                <li key={label}>
                  <a
                    href={path}
                    className="hover:text-teal-400 transition-colors duration-200 no-underline"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ORGANISATION */}
          <div>
            <h3 className="font-semibold text-sm mb-4 tracking-wide uppercase opacity-90">
              Organisation
            </h3>
            <ul className="space-y-2 text-sm opacity-80">
              {[
                ['#about',   'Who We Are'],
                ['#team',    'Trustees'],
                ['#clients', 'Client Success'],
                ['#',        'Careers'],
              ].map(([path, label]) => (
                <li key={label}>
                  <a
                    href={path}
                    className="hover:text-teal-400 transition-colors duration-200 no-underline"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h3 className="font-semibold text-sm mb-4 tracking-wide uppercase opacity-90">
              Newsletter
            </h3>
            <p className="text-sm opacity-80 mb-3">
              Join our mailing list for updates.
            </p>

            <div className="flex md:justify-start">
              <div className="flex items-center w-full max-w-md bg-gray-800
                              backdrop-blur-md rounded-full px-3 py-2 border
                              border-gray-700 shadow-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 bg-transparent text-sm px-3 py-2 outline-none
                             placeholder-gray-400
                             text-gray-200"
                />
                <button
                  onClick={() => {
                    const trimmed = email.trim();
                    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                      setStatus("error");
                      setMessage("Invalid email");
                      return;
                    }
                    try {
                      const list = JSON.parse(localStorage.getItem("newsletter") || "[]");
                      if (!list.includes(trimmed)) list.push(trimmed);
                      localStorage.setItem("newsletter", JSON.stringify(list));
                      setEmail("");
                      setStatus("success");
                      setMessage("Subscribed!");
                      setTimeout(() => { setStatus("idle"); setMessage(""); }, 2500);
                    } catch {
                      setStatus("error");
                      setMessage("An error occurred");
                    }
                  }}
                  className="ml-2 px-5 py-2 rounded-full text-xs font-semibold text-white
                             bg-gradient-to-r from-teal-500 to-cyan-500
                             hover:from-teal-400 hover:to-cyan-400
                             active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Subscribe
                </button>
              </div>
            </div>

            {status === "error" && (
              <p className="text-xs text-red-400 mt-2">{message}</p>
            )}
            {status === "success" && (
              <p className="text-xs text-green-400 mt-2">{message}</p>
            )}
          </div>
        </div>

        {/* COMPLIANCE ROW */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Compliance</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['ISO 27001','SOC 2 Type II','Ghana NDPA','Privacy Hub'].map(f => (
              <span key={f} className="px-4 py-1.5 rounded-xl border border-current opacity-40 text-[10px] font-bold uppercase tracking-tight hover:opacity-70 transition-opacity cursor-pointer">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* DIVIDER */}
        <div
          className="border-t border-gray-700 my-2"
        />

        {/* BOTTOM */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-xs opacity-70">
            © {new Date().getFullYear()} CHAYIL SECUREX LIMITED. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            {[
              ['/privacy', 'Privacy'],
              ['/terms', 'Terms'],
              ['/security', 'Security'],
              ['/login', 'PORTAL LOGIN']
            ].map(([h, l]) => (
              <a key={l} href={h} className="text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 hover:text-teal-400 transition-all no-underline">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
