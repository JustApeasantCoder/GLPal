import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

// SEO: update document head when landing mounts
const useSeo = () => {
  React.useEffect(() => {
    // Title and description (SEO-first storytelling)
    const title = 'GLPal — Privacy-first Health Tracking for Real People';
    const description = 'Take control of weight, GLP-1 dosing, and peptide tracking with GLPal. Local data, simple insights, and a frictionless journey to healthier outcomes.';
    const canonical = window.location.origin;

    // Helpers to upsert meta tags
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    const setProperty = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', prop);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Basic SEO tags
    document.title = title;
    setMeta('description', description);
    setMeta('viewport', 'width=device-width, initial-scale=1');
    // Canonical link
    let can = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!can) {
      can = document.createElement('link');
      can.rel = 'canonical';
      document.head.appendChild(can);
    }
    can.href = canonical;

    // Open Graph / Twitter
    setProperty('og:title', title);
    setProperty('og:description', description);
    setProperty('og:type', 'website');
    setProperty('og:url', canonical);
    setProperty('og:image', `${canonical}/og-image.png`);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    // JSON-LD for SEO
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'GLPal',
      'url': canonical,
      'description': description,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${canonical}/#/?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    } as any;
    let script = document.getElementById('ld-json');
    if (!script) {
      script = document.createElement('script');
      script.id = 'ld-json';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    (script as HTMLScriptElement).text = JSON.stringify(ld);
  }, []);
};

type LandingProps = {
  onNavigate: (path: string) => void;
};

const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  useSeo();
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="landing-root" style={{ padding: 0 }}>
      {/* Header mimics app header to maintain branding consistency on landing */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, padding: '1rem 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="#/" aria-label="Go to landing" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 800, fontSize: 20 }}>GLPal</a>
          <div>
            <button onClick={toggleTheme} aria-label="Toggle theme" style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
              {theme === 'dark' ? 'Light' : 'Dark'} mode
            </button>
          </div>
          <nav>
            <a href="#features" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginLeft: 12 }}>Features</a>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <section aria-label="Hero" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 32, alignItems: 'center', padding: '60px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <div>
          <h1 style={{ fontSize: '3rem', lineHeight: 1.05, margin: 0, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            Privacy-first Health Tracking
            <span style={{ display: 'block', color: 'var(--accent-mint)' }}>Locally Stored • On Your Device</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1.6, marginTop: 16 }}>
            GLPal empowers you to monitor weight, GLP-1 medications, and peptides with absolute privacy. No accounts, no cloud-logging—just your data, on your terms.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
            <button onClick={() => onNavigate('/app')} style={{ padding: '14px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--accent-mint), #4FD99C)', color: '#0b0b0b', fontWeight: 700, cursor: 'pointer' }}>
              Get Started
            </button>
            <a href="#/app" style={{ alignSelf: 'center', padding: '14px 22px', borderRadius: 12, textDecoration: 'none', color: 'var(--text-primary)', border: '2px solid var(--border-color)' }}>
              Learn More
            </a>
          </div>
        </div>
        <div aria-label="Hero visual" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'linear-gradient(135deg, rgba(177,156,217,0.25), rgba(79, 209, 154, 0.25))', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>📈</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-secondary)' }}>Your Health, Your Data</div>
          </div>
        </div>
      </section>

      {/* Why GLPal (SEO-rich storytelling) */}
      <section id="why" aria-label="Why GLPal" style={{ padding: '40px 20px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, marginBottom: 12, color: 'var(--text-primary)' }}>Why GLPal?</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 16 }}>
            In a world where health data is often trapped in cloud silos, GLPal puts privacy first. This is a lightweight, on-device health tracker that gives you complete control over your data while delivering powerful insights.
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li>Local data storage by default — no accounts, no cloud by default</li>
            <li>Installable as a Progressive Web App for a native-like feel</li>
            <li>Open, transparent UX with clear data ownership and control</li>
          </ul>
        </div>
      </section>
      {/* Customer Stories (SEO-rich storytelling) */}
      <section id="stories" aria-label="Customer Stories" style={{ padding: '40px 20px', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, marginBottom: 12, color: 'var(--text-primary)' }}>Real Stories from Real People</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 16, marginBottom: 16 }}>
            Meet users who chose privacy, control, and clarity. GLPal helped them stay on track without sacrificing data ownership.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              {
                name: 'Alex, Busy Professional',
                quote: 'GLPal keeps my weight goals in check while my data stays private on my device. I don’t worry about cloud accounts or sharing info.'
              },
              {
                name: 'Priya, Health-conscious Parent',
                quote: 'I track my GLP-1 schedule and weight without any extra apps. It just works, offline and secure.'
              },
              {
                name: 'Marco, Fitness Enthusiast',
                quote: 'Clear visuals, easy logging, and total data ownership. It’s a relief to have a private tool that’s powerful.'
              }
            ].map((t, idx) => (
              <div key={idx} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.name}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{t.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Features preview */}
      <section aria-label="Features" style={{ padding: '40px 20px 80px', background: 'radial-gradient(circle at 20% -20%, rgba(177,156,217,0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(74,222,168,0.25), transparent 40%)', }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { t: 'Weight Tracking', d: 'Daily logs, goals, and long-term trends.' },
            { t: 'Medication & Peptide', d: 'GLP-1 doses, peptides, and protocols.' },
            { t: 'Privacy First', d: 'All data stays on-device by default.' },
            { t: 'Offline & PWA', d: 'Installable on mobile, works offline.' },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{f.t}</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: 14 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section aria-label="CTA" style={{ padding: '40px 20px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, marginBottom: 12, color: 'var(--text-primary)' }}>Take control of your health data today</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>GLPal stays private by design. Install as a Progressive Web App to enjoy offline access, home screen launches, and a full-screen experience.</p>
          <a href="#/app" className="btn-primary" style={{ padding: '12px 24px', borderRadius: 10, textDecoration: 'none', color: '#0b0b0b', fontWeight: 700, background: 'linear-gradient(135deg, var(--accent-mint), #4FD99C)', display: 'inline-block' }}>Open GLPal</a>
        </div>
      </section>

      <footer style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
        <span>GLPal • Privacy-first health tracking</span>
      </footer>
    </div>
  );
};

export default Landing;
