import { Database, Twitter, Linkedin, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const cols = [
  { title: 'About', links: ['Our Story', 'Team', 'Careers', 'Blog', 'Press'] },
  { title: 'Quick Links', links: ['Dashboard', 'Analytics', 'Reports', 'API Docs', 'Status'] },
  { title: 'Resources', links: ['Documentation', 'Tutorials', 'Community', 'Templates', 'Changelog'] },
  { title: 'Contact', links: ['Support', 'Sales', 'Partnerships', 'Enterprise', 'Security'] },
];

export default function Footer() {
  return (
    <footer style={{ background: '#060C1A', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="relative z-10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 pb-12 border-b border-white/5">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}>
                <Database size={18} color="#fff" />
              </div>
              <span className="font-black text-xl text-white">DQ<span className="text-gradient">ai</span></span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-5">Enterprise AI-Powered Analytics Platform. Transform raw data into intelligent decisions.</p>
            <div className="flex gap-3">
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-white/40 hover:text-white hover:border-blue-500/40 transition-all">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {cols.map(col => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
          <p className="text-sm text-white/30">© 2026 DQai — Powered by Artificial Intelligence</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
              <a key={l} href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
