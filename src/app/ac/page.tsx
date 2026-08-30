'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

type ListingType = 'scholarship' | 'job' | 'enrollment';

interface Listing {
  _id: string;
  organizationName: string;
  title: string;
  description: string;
  type: ListingType;
  category?: string;
  location?: string;
  deadline?: string;
  externalUrl: string;
  logo?: string;
}

const TAB_META: Record<ListingType, { headline: string; sub: string; animation: string; bottom: string }> = {
  scholarship: {
    headline: 'Best courses are <span class="muted">waiting to enrich</span> your skill<span class="plus-row">+ + +</span>',
    sub: 'Provides you with the latest online learning system and material that help your knowledge growing.',
    animation: 'https://lottie.host/a21acb63-aa26-4153-9ed6-50c446c94703/oAhWLXTO6h.lottie',
    bottom: '0px',
  },
  job: {
    headline: 'Find the <span class="muted">right job</span> for your skill set<span class="plus-row">+ + +</span>',
    sub: 'Explore thousands of job listings tailored to graduates from our partner courses.',
    animation: 'https://lottie.host/668de4a5-2e23-4e06-81d9-d27373f78780/S4FcYtE8wS.lottie',
    bottom: '-60px',
  },
  enrollment: {
    headline: 'Enroll today and <span class="muted">start learning</span> for free<span class="plus-row">+ + +</span>',
    sub: 'Sign up in minutes and get instant access to our full course library.',
    animation: 'https://lottie.host/d3b5717d-ef91-40da-a08b-87dff49a858f/GWI9gbpEHH.lottie',
    bottom: '-15px',
  },
};

const PATTERNS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

export default function AcademicPage() {
  const [activeType, setActiveType] = useState<ListingType>('scholarship');
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const gradAnimRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch(`/api/listings?type=${activeType}`)
      .then((res) => res.json())
      .then((data) => setListings(data.listings || []));
  }, [activeType]);

  const switchTab = (type: ListingType) => {
    const el = gradAnimRef.current;
    if (el) {
      el.classList.add('fade-out');
      setTimeout(() => {
        el.setAttribute('src', TAB_META[type].animation);
        (el as any).style.bottom = TAB_META[type].bottom;
        el.classList.remove('fade-out');
      }, 250);
    }
    setActiveType(type);
  };

  const meta = TAB_META[activeType];
  const filtered = search.trim()
    ? listings.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()) || l.organizationName.toLowerCase().includes(search.toLowerCase()))
    : listings;

  return (
    <div className="ac-root">
      <Script src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.4/dist/dotlottie-wc.js" type="module" strategy="afterInteractive" />

      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            
            <h1 className="headline" dangerouslySetInnerHTML={{ __html: meta.headline }} />
            <p className="hero-sub">{meta.sub}</p>
            <div className="search-bar">
              <span className="search-icon">&#128269;</span>
              <input type="text" placeholder="Want to learn?" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="search-btn" type="button">Explore</button>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-blob">
              <span className="decor card" />
              <span className="decor star">
                <svg viewBox="0 0 24 24"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.6L5.7 21l2.3-7.2-6-4.6h7.6z" /></svg>
              </span>
              <span className="decor dot" />

              <div className="grad-figure">
                {/* @ts-expect-error custom element */}
                <dotlottie-wc
                  ref={gradAnimRef}
                  id="gradAnim"
                  src={meta.animation}
                  style={{ width: '250px', maxWidth: '250px', height: '250px', position: 'relative', bottom: meta.bottom }}
                  autoplay
                  loop
                />
              </div>
            </div>
          </div>
        </div>

        <div className="wrap partners-section">
          <div className="partners-box">
            <span className="p-arrow">&#8249;</span>
            <span className="partners-label">Our Course Partners</span>
            <div className="partners-list">
              <span>&#9673; HubSpot</span>
              <span>&#10038; loom</span>
              <span>&#9670; GitLab</span>
              <span>&#128172; LiveChat</span>
              <span>&#9642; monday.com</span>
            </div>
            <span className="p-arrow">&#8250;</span>
          </div>
        </div>
      </section>

      <section className="courses-section">
        <div className="wrap">
          <div className="courses-head">
            <h2 className="section-title">Popular <span className="accent">{activeType === 'scholarship' ? 'Scholarships' : activeType === 'job' ? 'Jobs' : 'Enrollments'}</span></h2>
            <div className="tabs">
              <button className={`tab${activeType === 'scholarship' ? ' active' : ''}`} onClick={() => switchTab('scholarship')}>Scholarship</button>
              <button className={`tab${activeType === 'job' ? ' active' : ''}`} onClick={() => switchTab('job')}>Jobs</button>
              <button className={`tab${activeType === 'enrollment' ? ' active' : ''}`} onClick={() => switchTab('enrollment')}>Enrollment</button>
            </div>
          </div>

          <div className="course-grid">
            {filtered.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', color: 'var(--grey)', textAlign: 'center', padding: '40px 0' }}>
                No listings yet — check back soon.
              </p>
            ) : (
              filtered.map((l, i) => (
                <div className="course-card" key={l._id}>
                  <div className={`thumb ${l.logo ? '' : PATTERNS[i % PATTERNS.length]}`} style={l.logo ? { backgroundImage: `url(${l.logo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                    {l.category && <span className="tag">{l.category}</span>}
                  </div>
                  <div className="card-body">
                    <div className="card-title">{l.title}</div>
                    <div className="card-author">
                      <div className="avatar">{l.organizationName.slice(0, 2).toUpperCase()}</div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div className="author-name">{l.organizationName}</div>
                        {l.location && <div className="author-role">{l.location}</div>}
                      </div>
                      {l.deadline && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                          <span className="student-count">Due {new Date(l.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <a href={l.externalUrl} target="_blank" rel="noopener noreferrer" className="enroll">
                        Enroll Now
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
            .ac-root {
          --bg: var(--bg-base);
          --panel: var(--bg-card);
          --panel-2: var(--bg-card-deep, var(--bg-card));
          --line: var(--border);
          --white: var(--text-primary);
          --grey: var(--text-muted);
          --grey-dim: var(--text-dim, var(--text-muted));
          --accent: var(--text-primary);
          --radius: 22px;

          background: var(--bg);
          color: var(--white);
          font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        .ac-root :global(a) { color: inherit; text-decoration: none; }
        .ac-root :global(button) { font-family: inherit; cursor: pointer; border: none; }

        .wrap { max-width: 1200px; margin: 0 auto; padding: 0 clamp(10px, 5vw, 32px); }

        .hero { padding: clamp(36px, 8vw, 70px) 0 0; position: relative; overflow: hidden; }
        .hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: clamp(14px, 4vw, 40px); align-items: center; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: clamp(11.5px, 1.6vw, 13px); color: var(--grey);
          border: 1px solid var(--line); padding: 6px clamp(10px,2vw,14px);
          border-radius: 999px; margin-bottom: clamp(14px, 3vw, 22px);
        }
        .hero-eyebrow::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--white); display: inline-block; flex-shrink: 0; }
        .headline { font-size: clamp(28px, 5.2vw, 52px); line-height: 1.15; font-weight: 700; letter-spacing: -0.5px; max-width: 600px; }
        .headline :global(.muted) { color: var(--grey-dim); font-weight: 500; }
        .headline :global(.plus-row) { display: inline-flex; gap: 6px; margin-left: 10px; vertical-align: middle; color: var(--grey-dim); font-size: clamp(18px, 3vw, 26px); font-weight: 300; }
        .hero-sub { margin-top: clamp(14px, 3vw, 22px); color: var(--grey); font-size: clamp(13.5px, 1.8vw, 15.5px); max-width: 430px; }

        .search-bar {
          margin-top: clamp(14px, 4vw, 34px); display: flex; flex-wrap: nowrap; align-items: center;
          background: var(--white); border-radius: 999px;
          padding: clamp(4px,1.5vw,6px) clamp(4px,1.5vw,6px) clamp(4px,1.5vw,6px) clamp(10px,3vw,22px);
          max-width: 460px; gap: clamp(4px,1.5vw,10px);
        }
        .search-bar input { border: none; outline: none; flex: 1; width: auto; flex-basis: auto; font-size: clamp(10px, 1.8vw, 14.5px); background: transparent; color: var(--bg-base); padding: clamp(7px,2vw,12px) 0; min-width: 0; }
        .search-bar input::placeholder { color: #8a8a8a; }
        .search-icon { color: #8a8a8a; font-size: 16px; flex-shrink: 0; }
                .search-btn { background: var(--text-primary); color: var(--bg-base); padding: clamp(7px,2vw,13px) clamp(10px,3vw,26px); border-radius: 999px; font-size: clamp(10px, 1.7vw, 14px); font-weight: 600; white-space: nowrap; flex-shrink: 0; }
        .search-btn:hover { opacity: 0.85; }

        .hero-art { position: relative; display: flex; justify-content: center; align-items: center; height: clamp(140px, 40vw, 420px); }
        .art-blob { width: clamp(190px, 32vw, 300px); height: clamp(255px, 42vw, 400px); border-radius: 150px 150px 60px 60px; background: linear-gradient(160deg,#2a2a2a,#111 70%); border: 1px solid var(--line); position: relative; display: flex; align-items: flex-end; justify-content: center; overflow: visible; }
        .decor { position: absolute; border: 1.5px solid var(--grey-dim); opacity: 0.9; }
        .decor.card { width: clamp(42px,9vw,64px); height: clamp(30px,6.2vw,44px); border-radius: 8px; top: 10%; left: clamp(-24px,-8vw,-40px); transform: rotate(-14deg); background: var(--panel-2); }
        .decor.star { top: 40%; left: clamp(-36px,-10vw,-60px); width: 0; height: 0; border: none; }
        .decor.star :global(svg) { width: clamp(28px,6vw,44px); height: clamp(28px,6vw,44px); fill: var(--grey-dim); }
        .decor.dot { width: clamp(11px,2.5vw,16px); height: clamp(11px,2.5vw,16px); border-radius: 50%; background: var(--panel-2); border: 1px solid var(--line); top: 10px; right: clamp(-6px,-2vw,-10px); }

        .grad-figure { width: clamp(140px, 24vw, 210px); display: flex; flex-direction: column; align-items: center; margin-bottom: 0; }

        .partners-section { margin-top: clamp(36px, 7vw, 64px); }
        .partners-box { border: 1px solid var(--line); border-radius: 999px; padding: clamp(8px,2.5vw,16px) clamp(10px,3vw,26px); display: flex; align-items: center; gap: clamp(8px, 3vw, 26px); flex-wrap: nowrap; }
        .partners-label { display: flex; align-items: center; gap: 8px; font-size: clamp(9px, 1.6vw, 13.5px); color: var(--grey); white-space: nowrap; padding-right: clamp(6px,2.5vw,20px); border-right: 1px solid var(--line); width: auto; }
        .partners-label::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--grey-dim); flex-shrink: 0; }
        .partners-list { display: flex; align-items: center; justify-content: space-between; flex: 1; gap: clamp(10px, 2.5vw, 20px); color: var(--grey); font-weight: 600; font-size: clamp(12px, 1.8vw, 15.5px); overflow-x: auto; scrollbar-width: none; }
        .partners-list::-webkit-scrollbar { display: none; }
        .partners-list :global(span) { display: flex; align-items: center; gap: 8px; opacity: 0.85; white-space: nowrap; }
        .partners-list :global(span):hover { opacity: 1; color: var(--white); }
        .p-arrow { width: clamp(26px,5vw,34px); height: clamp(26px,5vw,34px); border-radius: 50%; border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; color: var(--grey); flex-shrink: 0; }

        .courses-section { margin-top: clamp(48px, 9vw, 80px); padding-bottom: clamp(56px, 10vw, 100px); }
        .courses-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: clamp(14px, 3vw, 20px); margin-bottom: clamp(24px, 5vw, 40px); }
        .section-title { font-size: clamp(24px, 4vw, 34px); font-weight: 700; }
        .section-title :global(.accent) { color: var(--grey-dim); }

        .tabs { display: flex; background: var(--panel); border: 1px solid var(--line); border-radius: 999px; padding: 5px; gap: 2px; overflow-x: auto; scrollbar-width: none; max-width: 100%; }
        .tabs::-webkit-scrollbar { display: none; }
        .tab { padding: clamp(8px,1.8vw,10px) clamp(13px,2.6vw,20px); font-size: clamp(12px, 1.6vw, 13.5px); color: var(--grey); border-radius: 999px; background: transparent; white-space: nowrap; flex-shrink: 0; }
        .tab.active { background: var(--white); color: var(--bg-base); font-weight: 600; }
        .tab:hover:not(.active) { color: var(--white); }
.course-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: clamp(6px, 3vw, 26px);
        }
        .course-card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; transition: transform .25s ease, border-color .25s ease; }
        .course-card:hover { transform: translateY(-6px); border-color: #4a4a4a; }
        .thumb { position: relative; height: clamp(60px, 20vw, 180px); display: flex; align-items: flex-start; justify-content: space-between; padding: clamp(6px, 2.5vw, 16px); }
        .tag { background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.25); color: var(--white); font-size: clamp(6.5px, 1.4vw, 11.5px); padding: clamp(2px,1vw,5px) clamp(5px,1.8vw,12px); border-radius: 999px; z-index: 2; align-self: flex-start; white-space: nowrap; }
        .card-body { padding: clamp(6px,3vw,20px) clamp(6px,3vw,20px) clamp(8px,3.4vw,22px); }
        .card-title { font-size: clamp(8.5px, 2vw, 16px); font-weight: 700; line-height: 1.3; margin-bottom: clamp(6px,2.5vw,16px); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
        .card-author { display: flex; align-items: center; gap: clamp(4px,1.5vw,10px); padding-bottom: clamp(6px,2.2vw,14px); margin-bottom: clamp(6px,2.2vw,14px); border-bottom: 1px solid var(--line); flex-wrap: nowrap; }
        .avatar { width: clamp(16px,4.5vw,32px); height: clamp(16px,4.5vw,32px); border-radius: 50%; background: var(--panel-2); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; font-size: clamp(6.5px,1.4vw,11px); font-weight: 700; color: var(--grey); flex-shrink: 0; }
        .author-name { font-size: clamp(7px, 1.7vw, 13.5px); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .author-role { font-size: clamp(6px, 1.4vw, 11.5px); color: var(--grey); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-footer { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
        .student-count { font-size: clamp(6px, 1.3vw, 12px); color: var(--grey); white-space: nowrap; flex-shrink: 0; }
        .enroll { font-size: clamp(6.5px, 1.5vw, 12.5px); font-weight: 700; color: var(--white); border-bottom: 1px solid var(--white); padding-bottom: 2px; white-space: nowrap; }
        .enroll:hover { color: var(--grey); border-color: var(--grey); }

        .p1 { background: radial-gradient(circle at 30% 20%, #3a3a3a, #0d0d0d 70%); }
        .p2 { background: repeating-linear-gradient(115deg, #050505 0 10px, #1a1a1a 10px 20px); }
        .p3 { background: linear-gradient(135deg, #d9d9d9, #8a8a8a 45%, #1a1a1a 100%); }
        .p4 { background: radial-gradient(circle at 70% 70%, #e8e8e8, #4a4a4a 60%, #0a0a0a 100%); }
        .p5 { background: linear-gradient(160deg, #232323, #050505); }
        .p6 { background: conic-gradient(from 180deg at 50% 50%, #050505, #2c2c2c, #050505); }

        :global(#gradAnim) { transition: opacity 0.25s ease, transform 0.25s ease; opacity: 1; transform: scale(1); }
        :global(#gradAnim.fade-out) { opacity: 0; transform: scale(0.92); }

        @media (max-width: 768px) {
          .course-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}