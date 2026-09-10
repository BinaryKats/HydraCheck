/**
 * AboutView — Binary Kats team landing page.
 * Full port of E:\SIH-26\trying_qwen.html into React.
 * Styles live in about-binarykats.css (prefixed with bk-*).
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import './about-binarykats.css'

/* ——— reveal wrapper: IntersectionObserver toggles bk-active ——— */
function Reveal({ children, className = '' }) {
  const ref = useRef(null)
  const [active, setActive] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(true)
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`bk-reveal${active ? ' bk-active' : ''} ${className}`}>
      {children}
    </div>
  )
}

/* ——— count-up stat: animates 0 → target once when visible ——— */
function StatNumber({ target }) {
  const ref = useRef(null)
  const [value, setValue] = useState(0)
  const animated = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !animated.current) {
            animated.current = true
            io.disconnect()
            const t0 = performance.now()
            const D = 1600
            const tick = (now) => {
              const p = Math.min((now - t0) / D, 1)
              const eased = 1 - Math.pow(1 - p, 3)
              setValue(Math.floor(eased * target))
              if (p < 1) requestAnimationFrame(tick)
              else setValue(target)
            }
            requestAnimationFrame(tick)
          }
        }
      },
      { threshold: 0.5 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [target])
  return <div ref={ref} className="bk-stat-number">{value}</div>
}

const MARQUEE_ITEMS = [
  'Binary Kats now shipping v2.0',
  'Meow-driven development',
  '9 lives, infinite deploys',
  'Open source. Open naps.',
  'Proudly remote since 2024',
  'Code with care. Ship with pride.',
]

const BUILD_CARDS = [
  { num: '01', title: 'Product design',    desc: 'From napkin sketch to shippable Figma. We design systems, not just screens. Every button, every modal, every micro-interaction gets the same attention.',         ctrl: <path d="M6 10 L16 4 L26 10 L26 22 L16 28 L6 22 Z" stroke="#000" strokeWidth="2" fill="none" /> },
  { num: '02', title: 'Web engineering',   desc: 'Fast, accessible, and boring in the best way. React, Next.js, TypeScript, and the occasional Svelte when the project calls for it. We ship pixels that load in under 2 seconds.',   ctrl: <path d="M10 8 L4 16 L10 24 M22 8 L28 16 L22 24" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /> },
  { num: '03', title: 'Mobile apps',       desc: 'Native-feeling iOS and Android with React Native and Swift. We ship on both stores and we ship on time. Gesture-based UX, dark mode out of the box.',   ctrl: <><rect x="8" y="4" width="16" height="24" rx="3" stroke="#000" strokeWidth="2" fill="none" /><circle cx="16" cy="24" r="1.5" fill="#000" /></> },
  { num: '04', title: 'Brand systems',     desc: 'Logos, type, color, motion. The kind of identity you recognize before you read the name. We build design systems that scale from a landing page to a 50-page app.',    ctrl: <><circle cx="16" cy="16" r="10" stroke="#000" strokeWidth="2" fill="none" /><path d="M16 10 L16 16 L21 18" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" /></> },
  { num: '05', title: 'Growth ops',        desc: "Analytics, funnels, email, onboarding flows. We measure what matters and ignore what doesn't. PostHog, Mixpanel, custom event tracking — we speak the language.", ctrl: <path d="M6 22 L12 14 L18 18 L26 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /> },
  { num: '06', title: 'AI integrations',   desc: 'Practical LLM features, not chatbot theater. We wire Claude, GPT-4, and open models into real workflows. Semantic search, summarization, and code generation where it matters.',   ctrl: <path d="M16 4 L20 12 L28 13 L22 19 L24 28 L16 23 L8 28 L10 19 L4 13 L12 12 Z" stroke="#fff" strokeWidth="2" fill="none" /> },
]

/* ——— team member avatars ——— */
function CatAvatarA() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 40 L25 20 L40 32 L60 32 L75 20 L75 40 L75 70 Q75 82 63 82 L37 82 Q25 82 25 70 Z" fill="#000" />
      <circle cx="40" cy="52" r="4" fill="#fff" />
      <circle cx="60" cy="52" r="4" fill="#fff" />
      <path d="M45 68 Q50 72 55 68" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}
function PawAvatar() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="60" rx="22" ry="18" fill="#000" />
      <ellipse cx="32" cy="38" rx="8" ry="11" fill="#000" />
      <ellipse cx="50" cy="30" rx="8" ry="11" fill="#000" />
      <ellipse cx="68" cy="38" rx="8" ry="11" fill="#000" />
    </svg>
  )
}
function YarnAvatar() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="28" fill="#000" />
      <path d="M26 44 Q50 30 74 44 M26 56 Q50 70 74 56 M36 26 Q38 50 36 74 M64 26 Q62 50 64 74" stroke="#e9ccff" strokeWidth="3" fill="none" />
    </svg>
  )
}
function FishAvatar() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 Q35 30 55 40 L75 28 L70 50 L75 72 L55 60 Q35 70 20 50 Z" fill="#000" />
      <circle cx="62" cy="46" r="3" fill="#ffd731" />
    </svg>
  )
}
function CheckAvatar() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="30" width="50" height="50" rx="10" fill="#000" />
      <path d="M35 45 L45 55 L65 40" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
const TEAM = [
  { name: 'Aasim',  role: 'Frontend & Design Lead',          bio: 'Notices when something is 2 pixels off. Spends hours on colors nobody else sees.',                            Av: CatAvatarA },
  { name: 'Ramiz',  role: 'Backend & Systems Lead',         bio: 'Debugs at 3 AM in pajamas. His jokes are terrible but his servers never crash.',                                            Av: PawAvatar },
  { name: 'Rabia',  role: 'Data & Evaluation Lead',          bio: 'Can spot a typo in 10,000 rows before you finish your coffee. Dreams in spreadsheets.',                                  Av: YarnAvatar },
  { name: 'Mahiba', role: 'ML & Intelligence Lead',          bio: 'Teaches computers to predict floods. Tried the same with coffee. One worked better.',                                    Av: FishAvatar },
  { name: 'Ahad',   role: 'Full-Stack & Ingestion Architect',bio: 'Builds the impossible. Makes it look easy. The one everyone calls when things get real.',                              Av: CheckAvatar },
  { name: 'Saquib', role: 'Pitch & QA Defense',              bio: 'Thinks of every \u2018what if\u2019 before you do. Practices presentations in the shower.',                        Av: () => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 40 L25 20 L40 32 L60 32 L75 20 L75 40 L75 70 Q75 82 63 82 L37 82 Q25 82 25 70 Z" fill="#000" />
      <circle cx="40" cy="52" r="4" fill="#fff" />
      <circle cx="60" cy="52" r="4" fill="#fff" />
      <path d="M50 65 L50 72" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  ) },
]

function CatLogo({ boxSize = 26 }) {
  return (
    <svg width={boxSize} height={boxSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 10 L6 4 L11 8 L21 8 L26 4 L26 10 L26 24 Q26 28 22 28 L10 28 Q6 28 6 24 Z" fill="#000" />
      <circle cx="12" cy="17" r="1.8" fill="#fff" />
      <circle cx="20" cy="17" r="1.8" fill="#fff" />
      <path d="M14 22 Q16 24 18 22" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function AboutView({ onClose }) {
  const [showModal, setShowModal] = useState(false)
  const modalRef = useRef(null)

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // backdrop click closes modal
  const handleModalBackdrop = useCallback((e) => {
    if (e.target === modalRef.current) setShowModal(false)
  }, [])

  // esc closes modal then the about screen
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showModal) setShowModal(false)
        else if (onClose) onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal, onClose])

  const handleStickerClick = useCallback((e) => {
    const el = e.currentTarget
    el.style.animationPlayState = 'paused'
    el.style.transform = `scale(1.3) rotate(${Math.random() * 720 - 360}deg)`
    setTimeout(() => {
      el.style.animationPlayState = ''
      el.style.transform = ''
    }, 480)
  }, [])

  return (
    <div className="fixed inset-0 z-[1200] bg-white">
      {/* Google Fonts — lives in the document so the overlay can use them */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <link
        href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Inter:wght@400;500;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="bk-root h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain">
        {/* ===== MARQUEE ===== */}
        <div className="bk-marquee">
          <div className="bk-marquee-track">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        </div>

        {/* ===== NAV ===== */}
        <nav className="bk-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={onClose} className="bk-back" aria-label="Back to map">
              <span aria-hidden="true" style={{ display: 'inline-block', transform: 'translateY(-0.5px)' }}>←</span>
            </button>
            <button type="button" onClick={() => scrollTo('bk-top')} className="bk-logo" aria-label="Back to top">
              <CatLogo />
            </button>
          </div>
          <div className="bk-nav-links">
            <button type="button" onClick={() => scrollTo('bk-about')} className="bk-pill-link">About</button>
            <button type="button" onClick={() => scrollTo('bk-builds')} className="bk-pill-link">Builds</button>
            <button type="button" onClick={() => scrollTo('bk-team')} className="bk-pill-link">Team</button>
            <button type="button" onClick={() => scrollTo('bk-manifesto')} className="bk-pill-link">Manifesto</button>
            <button type="button" onClick={() => scrollTo('bk-contact')} className="bk-pill-link">Contact</button>
          </div>
          <button type="button" onClick={() => setShowModal(true)} className="bk-cta-filled">Join the pride →</button>
        </nav>

        {/* anchor for logo → top */}
        <div id="bk-top" />

        {/* ===== HERO ===== */}
        <section className="bk-hero">
          {/* 3D ribbon SVG */}
          <svg className="bk-ribbon bk-ribbon-hero" viewBox="0 0 1200 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <filter id="bk-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
                <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0" />
                <feComposite in2="SourceGraphic" operator="in" />
              </filter>
            </defs>
            <path d="M -50 380 Q 200 480 400 360 T 800 320 Q 1000 300 1250 400" stroke="#2a7fd4" strokeWidth="110" fill="none" strokeLinecap="round" />
            <path d="M -50 360 Q 200 460 400 340 T 800 300 Q 1000 280 1250 380" stroke="#4da2ff" strokeWidth="100" fill="none" strokeLinecap="round" />
            <path d="M -50 330 Q 200 430 400 310 T 800 270 Q 1000 250 1250 350" stroke="#7fbfff" strokeWidth="30" fill="none" strokeLinecap="round" opacity="0.9" />
            <path d="M -50 315 Q 200 415 400 295 T 800 255 Q 1000 235 1250 335" stroke="#b3dcff" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M -50 360 Q 200 460 400 340 T 800 300 Q 1000 280 1250 380" stroke="#000" strokeWidth="100" fill="none" strokeLinecap="round" filter="url(#bk-grain)" opacity="0.35" />
          </svg>

          {/* stickers */}
          <button type="button" onClick={handleStickerClick} className="bk-sticker bk-sticker-cat" aria-label="Sticker" title="Meow! 🐱">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 20 L12 8 L22 16 L42 16 L52 8 L52 20 L52 44 Q52 52 44 52 L20 52 Q12 52 12 44 Z" fill="#fff" />
              <circle cx="24" cy="32" r="3" fill="#000" />
              <circle cx="40" cy="32" r="3" fill="#000" />
              <path d="M28 42 Q32 46 36 42" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M20 38 L14 36 M44 38 L50 36" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" onClick={handleStickerClick} className="bk-sticker bk-sticker-paw" aria-label="Sticker" title="Paw print!">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="32" cy="40" rx="14" ry="12" fill="#000" />
              <ellipse cx="18" cy="24" rx="6" ry="8" fill="#000" />
              <ellipse cx="32" cy="18" rx="6" ry="8" fill="#000" />
              <ellipse cx="46" cy="24" rx="6" ry="8" fill="#000" />
            </svg>
          </button>
          <button type="button" onClick={handleStickerClick} className="bk-sticker bk-sticker-fish" aria-label="Sticker" title="Fish! 🐟">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 32 Q20 16 40 24 L54 14 L50 32 L54 50 L40 40 Q20 48 8 32 Z" fill="#000" />
              <circle cx="44" cy="30" r="2.5" fill="#ffd731" />
            </svg>
          </button>
          <button type="button" onClick={handleStickerClick} className="bk-sticker bk-sticker-binary" aria-label="Sticker" title="Binary Code">
            <span style={{ fontFamily: 'var(--font-aeonik-pro)', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', lineHeight: 1.2, textAlign: 'center' }}>01010<br />10101</span>
          </button>
          <button type="button" onClick={handleStickerClick} className="bk-sticker bk-sticker-yarn" aria-label="Sticker" title="Yarn ball 🧶">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="22" fill="#000" />
              <path d="M14 28 Q32 18 50 28 M14 36 Q32 46 50 36 M20 16 Q22 32 20 48 M44 16 Q42 32 44 48" stroke="#e9ccff" strokeWidth="2" fill="none" />
            </svg>
          </button>
          <button type="button" onClick={handleStickerClick} className="bk-sticker bk-sticker-code" aria-label="Sticker" title="Code!">&lt;/&gt;</button>

          <div className="bk-hero-inner">
            <div className="bk-hero-tag">Est. 2024 · Remote · 9 lives</div>
            <h1 className="bk-display">
              BINARY
              <span className="bk-line-2">KATS</span>
            </h1>
            <p className="bk-tagline">A small team of engineers, designers, and troublemakers shipping software with the focus of a cat staring at a laser dot.</p>
            <div className="bk-hero-ctas">
              <button type="button" onClick={() => scrollTo('bk-builds')} className="bk-cta-filled">See our work →</button>
              <button type="button" onClick={() => scrollTo('bk-manifesto')} className="bk-cta-ghost">Read the manifesto</button>
            </div>
          </div>
        </section>

        {/* ===== ABOUT ===== */}
        <section id="bk-about" className="bk-section bk-section-about">
          <div className="bk-section-inner">
            <Reveal>
              <div className="bk-about-display">WE<br />BUILD<br />THINGS<br />THAT<br />PURR.</div>
            </Reveal>
            <Reveal>
              <div className="bk-about-copy">
                <p><strong>Binary Kats</strong> is a product studio of six humans (and one office cat, Miso) who believe software should feel as delightful as it is reliable.</p>
                <p>We partner with early-stage teams and ambitious independents to design, build, and ship products that people actually want to open twice a day. No bloat. No dark patterns. Just sharp tools, soft edges, and the occasional cat GIF in the README.</p>
                <p>Founded in 2024, we&rsquo;ve shipped products used by over <strong>2 million people</strong> across <strong>11 countries</strong>. Every project we take on gets the same care: thoughtful design, clean code, and documentation good enough that you won&rsquo;t need us six months later (but we hope you&rsquo;ll call us anyway).</p>
              </div>
              <div className="bk-stats-grid">
                <div className="bk-stat-card">
                  <StatNumber target={42} />
                  <div className="bk-stat-label">Products Shipped</div>
                </div>
                <div className="bk-stat-card">
                  <StatNumber target={2} />
                  <div className="bk-stat-label">Million Users</div>
                </div>
                <div className="bk-stat-card">
                  <StatNumber target={11} />
                  <div className="bk-stat-label">Countries</div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== BUILDS ===== */}
        <section id="bk-builds" className="bk-section bk-section-builds">
          <div className="bk-section-inner">
            <Reveal className="bk-section-head">
              <div>
                <div className="bk-section-eyebrow">What we build</div>
                <h2 className="bk-section-title">Six things.<br />Done well.</h2>
                <p className="bk-section-sub">We don&rsquo;t do everything. We do these six things, and we do them until they feel inevitable.</p>
              </div>
            </Reveal>
            <div className="bk-builds-grid">
              {BUILD_CARDS.map((c) => (
                <Reveal key={c.num} className="bk-build-card">
                  <div>
                    <div className="bk-build-icon">
                      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {c.ctrl}
                      </svg>
                    </div>
                    <div className="bk-build-num">{c.num}</div>
                    <div className="bk-build-title">{c.title}</div>
                    <div className="bk-build-desc">{c.desc}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TEAM ===== */}
        <section id="bk-team" className="bk-section bk-section-team">
          <div className="bk-section-inner">
            <Reveal className="bk-section-head">
              <div>
                <div className="bk-section-eyebrow">The pride</div>
                <h2 className="bk-section-title">Meet the cats.</h2>
                <p className="bk-section-sub">Six humans. One cat. Zero middle managers. Everyone ships.</p>
              </div>
            </Reveal>
            <div className="bk-team-grid">
              {TEAM.map(({ name, role, bio, Av }) => (
                <Reveal key={name} className="bk-team-card">
                  <div>
                    <div className="bk-team-avatar"><Av /></div>
                    <div className="bk-team-name">{name}</div>
                    <div className="bk-team-role">{role}</div>
                    <div className="bk-team-bio">{bio}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== MANIFESTO ===== */}
        <section id="bk-manifesto" className="bk-section bk-section-cta" style={{ background: 'var(--color-lavender)' }}>
          <Reveal className="bk-section-inner">
            <div>
              <h2 className="bk-cta-display">The<br />Binary Kats<br />Manifesto</h2>
              <div className="bk-manifesto-list">
                <p><strong>1. Ship real products.</strong> Not vaporware. Not MVPs that never ship. Not &ldquo;coming soon&rdquo; pages that age like milk. We build things people can use today.</p>
                <p><strong>2. Design is not decoration.</strong> Every pixel serves a purpose. If we can&rsquo;t explain why something exists, it doesn&rsquo;t belong in the interface.</p>
                <p><strong>3. Code with care.</strong> We write code like someone will read it at 2 AM during an outage. Because someone will. (Probably us.)</p>
                <p><strong>4. No dark patterns.</strong> We don&rsquo;t hide unsubscribe buttons. We don&rsquo;t make cancellation a treasure hunt. If your business model requires tricking users, find a better business model.</p>
                <p><strong>5. Remote, but together.</strong> Async by default, sync when it matters. We don&rsquo;t worship at the altar of the office, but we also don&rsquo;t ghost each other on Slack.</p>
                <p><strong>6. Open source what you can.</strong> We contribute back to the tools we use. Not everything needs to be MIT-licensed, but if it helps someone else, why wouldn&rsquo;t we share?</p>
                <p><strong>7. Naps are infrastructure.</strong> Creativity doesn&rsquo;t punch a clock. Sometimes the best thing you can do for a project is close the laptop and stare at the ceiling.</p>
                <p><strong>8. Measure twice, ship once.</strong> Fast beats perfect, but broken beats neither. We test in production, but we also test before production.</p>
              </div>
              <div className="bk-cta-buttons" style={{ marginTop: 48 }}>
                <button type="button" onClick={() => setShowModal(true)} className="bk-cta-filled">We&rsquo;re hiring →</button>
                <a href="mailto:hello@binarykats.dev" className="bk-cta-ghost">hello@binarykats.dev</a>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ===== CONTACT CTA ===== */}
        <section id="bk-contact" className="bk-section bk-section-cta" style={{ background: 'var(--color-mint-pop)' }}>
          <Reveal className="bk-section-inner">
            <div>
              <h2 className="bk-cta-display">Let&rsquo;s<br />build<br />something.</h2>
              <p className="bk-cta-sub">Got a product idea, a stuck roadmap, or a team that needs a second brain? We take on four clients per quarter. Currently booking Q4 2026.</p>
              <div className="bk-cta-buttons">
                <button type="button" onClick={() => setShowModal(true)} className="bk-cta-filled">Start a project →</button>
                <a href="mailto:hello@binarykats.dev" className="bk-cta-ghost">Email us</a>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="bk-footer">
          <div className="bk-footer-inner">
            <div>
              <div className="bk-footer-brand">
                <span className="bk-logo" aria-hidden="true"><CatLogo /></span>
                <div className="bk-footer-brand-name">BINARY KATS</div>
              </div>
              <p className="bk-footer-tagline">A small product studio. Big opinions about kerning. Based nowhere, shipping everywhere. Est. 2024.</p>
            </div>
            <div className="bk-footer-col">
              <h4>Studio</h4>
              <ul>
                <li><button type="button" onClick={() => scrollTo('bk-about')} style={{ background: 'none', border: 0, color: 'inherit', padding: 0, fontSize: 14, cursor: 'pointer' }}>About</button></li>
                <li><button type="button" onClick={() => scrollTo('bk-team')} style={{ background: 'none', border: 0, color: 'inherit', padding: 0, fontSize: 14, cursor: 'pointer' }}>Team</button></li>
                <li><button type="button" onClick={() => scrollTo('bk-manifesto')} style={{ background: 'none', border: 0, color: 'inherit', padding: 0, fontSize: 14, cursor: 'pointer' }}>Manifesto</button></li>
                <li><button type="button" onClick={() => setShowModal(true)} style={{ background: 'none', border: 0, color: 'inherit', padding: 0, fontSize: 14, cursor: 'pointer' }}>Careers</button></li>
              </ul>
            </div>
            <div className="bk-footer-col">
              <h4>Work</h4>
              <ul>
                <li><button type="button" onClick={() => scrollTo('bk-builds')} style={{ background: 'none', border: 0, color: 'inherit', padding: 0, fontSize: 14, cursor: 'pointer' }}>Services</button></li>
                <li><span style={{ fontSize: 14, opacity: 0.9 }}>Case studies (Soon)</span></li>
                <li><a href="https://github.com/binarykats" target="_blank" rel="noreferrer">Open source</a></li>
                <li><span style={{ fontSize: 14, opacity: 0.9 }}>Lab experiments</span></li>
              </ul>
            </div>
            <div className="bk-footer-col">
              <h4>Say hi</h4>
              <ul>
                <li><a href="mailto:hello@binarykats.dev">hello@binarykats.dev</a></li>
                <li><a href="https://twitter.com/binarykats" target="_blank" rel="noreferrer">Twitter / X</a></li>
                <li><a href="https://github.com/binarykats" target="_blank" rel="noreferrer">GitHub</a></li>
                <li><span style={{ fontSize: 14, opacity: 0.9 }}>Read.cv</span></li>
              </ul>
            </div>
          </div>
          <div className="bk-footer-bottom">
            <div>© 2026 Binary Kats Studio · All rights reserved</div>
            <div>Made with 🐾 and too much coffee in 11 countries</div>
          </div>
        </footer>
      </div>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div
          ref={modalRef}
          className="bk-modal bk-modal-active"
          onClick={handleModalBackdrop}
          role="dialog"
          aria-modal="true"
        >
          <div className="bk-modal-content">
            <button type="button" className="bk-modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            <div className="bk-modal-title">Join Us! 🐱</div>
            <div className="bk-modal-text">
              <p style={{ marginBottom: 16 }}>We&rsquo;re currently hiring for <strong>Senior Full-Stack Engineers</strong> and <strong>Product Designers</strong> who care about craft.</p>
              <p style={{ marginBottom: 8 }}><strong>What we offer:</strong></p>
              <ul style={{ marginLeft: 20, marginBottom: 16 }}>
                <li>Fully remote, async-first culture</li>
                <li>Competitive salary + equity</li>
                <li>4-day work weeks (yes, really)</li>
                <li>Unlimited PTO (we actually mean it)</li>
                <li>$2k/year learning budget</li>
                <li>Work on products people love</li>
              </ul>
              <p>Interested? Email us at <strong>careers@binarykats.dev</strong> with your portfolio and why you&rsquo;d be a good fit.</p>
            </div>
            <a href="mailto:careers@binarykats.dev" className="bk-cta-filled" style={{ width: '100%', display: 'block', textAlign: 'center' }}>Send your portfolio →</a>
          </div>
        </div>
      )}
    </div>
  )
}
