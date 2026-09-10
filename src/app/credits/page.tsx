"use client";

import Image from "next/image";

interface SocialLink {
  name: string;
  href: string;
  className: string;
  path: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/nomadmediahousee?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==",
    className: "ig",
    path: "M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 2 .25 2.5.42.6.24 1 .53 1.5 1 .47.47.76.9 1 1.5.17.5.36 1.3.42 2.5.07 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 2-.42 2.5a4 4 0 0 1-1 1.5c-.47.47-.9.76-1.5 1-.5.17-1.3.36-2.5.42-1.3.07-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-2-.25-2.5-.42a4 4 0 0 1-1.5-1 4 4 0 0 1-1-1.5c-.17-.5-.36-1.3-.42-2.5C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-2 .42-2.5.24-.6.53-1 1-1.5.47-.47.9-.76 1.5-1 .5-.17 1.3-.36 2.5-.42C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.52 0-4.76.07-1 .05-1.55.22-1.9.36-.48.19-.82.4-1.18.77-.37.36-.58.7-.77 1.18-.14.35-.3.9-.36 1.9C3 9.28 3 9.65 3 12s0 3.52.07 4.76c.05 1 .22 1.55.36 1.9.19.48.4.82.77 1.18.36.37.7.58 1.18.77.35.14.9.3 1.9.36C7.48 21 7.85 21 11 21h1c3.15 0 3.52 0 4.76-.07 1-.05 1.55-.22 1.9-.36.48-.19.82-.4 1.18-.77.37-.36.58-.7.77-1.18.14-.35.3-.9.36-1.9.07-1.24.07-1.61.07-4.76s0-3.52-.07-4.76c-.05-1-.22-1.55-.36-1.9a3.2 3.2 0 0 0-.77-1.18 3.2 3.2 0 0 0-1.18-.77c-.35-.14-.9-.3-1.9-.36C15.52 4 15.15 4 12 4zm0 3.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2zm0 1.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm4.85-2.05a1.08 1.08 0 1 1 0 2.15 1.08 1.08 0 0 1 0-2.15z",
  },
  {
    name: "TikTok",
    href: "https://nomadservices.netlify.app",
    className: "tiktok",
    path: "M14 3c.4 2 1.9 3.6 4 3.9v2.6c-1.4 0-2.8-.4-4-1.2v6.4a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.06v2.7a3 3 0 1 0 2.1 2.86V3H14z",
  },
  {
    name: "Facebook",
    href: "https://nomadservices.netlify.app",
    className: "fb",
    path: "M13.5 21v-7.6h2.6l.4-3H13.5V8.3c0-.9.25-1.5 1.55-1.5H16.6V4.2A21 21 0 0 0 14.3 4c-2.3 0-3.9 1.4-3.9 4v2.4H7.8v3h2.6V21h3.1z",
  },
  {
    name: "X (Twitter)",
    href: "https://nomadservices.netlify.app",
    className: "x",
    path: "M3 3h4.3l4 5.4L15.9 3H19l-6.2 7.7L19.5 21h-4.3l-4.3-5.9L6.1 21H3l6.6-8.2L3 3z",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/263775580320?utm_source=chatgpt.com",
    className: "wa",
    path: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.4A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 0 1 6.9 12.6l-.3.5.9 3.3-3.4-.9-.5.3A8.2 8.2 0 1 1 12 3.8zm-3.3 4.1c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.1 1.8 2.9 4.5 4 2.2.9 2.7.7 3.1.7.7-.1 1.6-.6 1.8-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.4-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.7-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.6-.9-2.1-.2-.5-.4-.4-.6-.4h-.5z",
  },
];

export default function Credits() {
  return (
    <main className="body">
      <div className="poster">
        <div className="brandHeader">CREDITS&nbsp;TO&nbsp;NOMAD SYSTEMS</div>

        <div className="card">
          <div className="dots">
            <span />
            <span />
            <span />
          </div>

          <div className="content">
            <div className="photoFrame">
              <Image
                src="/dealologo.png"
                alt="Portrait of the Homie Graphfix Arts founder in a black suit"
                fill
                sizes="(max-width: 560px) 100vw, 260px"
                priority
              />
            </div>

            <div className="copy">
              <h1>
                NOMAD
                <br />
                SYSTEMS
              </h1>
              <p>
                Dealo is a specialized venture within the Nomad ecosystem, created to transform how people discover, buy, sell, and move products.

              </p>
              <p>
                Dealo is not simply another online marketplace. It is a commerce system designed around the belief that buying and selling should be simple, accessible, reliable, and efficient.
              
              Nomad is built around a simple philosophy: we build systems, not just products.
<br/>
<br/>
Dealo is one of those systems.
<br/>
<br/>
Where Nomad creates the broader ecosystem and infrastructure, Dealo specializes in connecting vendors, customers, deals, payments, and logistics into one experience.
             
             <br/>
             <br/>
             <strong>Nomad builds the ecosystem.</strong><br/>
<strong>Dealo builds the commerce experience within it.</strong>
              </p>
            </div>
          </div>

          {/* Credits — logo mark centered at the bottom of the white card */}
          <div className="credits">
            <div className="creditsLogo">
              <Image
                src="/nomadlogo.png"
                alt="DeaLo logo"
                fill
                sizes="56px"
              />
            </div>
          </div>

          {/* Corner badge — original circular logo mark, kept in place at the bottom-right corner */}
          <div className="cornerBadge">
            <Image
              src="/dealoshortwhite.png"
              alt="Dealo logo"
              fill
              sizes="68px"
              style={{backgroundColor:'black'}}
            />
          </div>
        </div>

        <div className="footer">
          <div className="socials">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                className={social.className}
                href={social.href}
                aria-label={social.name}
              >
                <svg viewBox="0 0 24 24">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
          <p className="handle">@nomad_systems</p>
          <p className="phone">+263 775 580 320</p>
        </div>
      </div>

      <style jsx>{`
                .body {
          display: flex;
          justify-content: center;
          padding: 48px 20px;
          min-height: 100vh;
          background: var(--bg-base);
          font-family: "Baloo 2", "Poppins", sans-serif;
          color: var(--text-primary);
        }

        .poster {
          position: relative;
          width: 100%;
          max-width: 620px;
        }

                .brandHeader {
          text-align: center;
          color: var(--text-primary);
          font-family: "Poppins", sans-serif;
          font-weight: 500;
          font-size: 15px;
          letter-spacing: 10px;
          margin-bottom: 26px;
          padding-left: 10px;
        }

                .card {
          position: relative;
          background: var(--bg-card);
          border-radius: 28px;
          padding: 46px 40px 38px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45);
        }

        .dots {
          position: absolute;
          top: -14px;
          left: 40px;
          display: flex;
          gap: 8px;
        }

               .dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--border);
          display: block;
        }

        .content {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 28px;
          align-items: start;
        }

        .photoFrame {
          position: relative;
          background: #0e0e0e;
          border-radius: 18px;
          overflow: hidden;
          aspect-ratio: 3 / 4.4;
        }

        .photoFrame :global(img) {
          object-fit: cover;
          filter: grayscale(0.5) brightness(0.9);
        }

               .copy h1 {
          font-family: "Poppins", sans-serif;
          font-weight: 800;
          font-size: 56px;
          line-height: 0.98;
          letter-spacing: -1px;
          margin: 0 0 22px;
          text-transform: uppercase;
          color: var(--text-primary);
        }

                .copy p {
          font-size: 15px;
          line-height: 1.5;
          margin: 0 0 18px;
          color: var(--text-muted);
        }

        .copy p:last-child {
          margin-bottom: 0;
        }

                .credits {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 34px;
          padding-top: 26px;
          border-top: 1px solid var(--border);
        }

        .creditsLogo {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        }

        .creditsLogo :global(img) {
          object-fit: cover;
        }

        .cornerBadge {
          position: absolute;
          right: 30px;
          bottom: -26px;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
        }

        .cornerBadge :global(img) {
          object-fit: cover;
        }

                .footer {
          text-align: center;
          margin-top: 54px;
          color: var(--text-primary);
        }

        .socials {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .socials :global(a) {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          text-decoration: none;
          transition: transform 0.15s ease;
        }

        .socials :global(a:hover) {
          transform: translateY(-3px);
        }

        .socials :global(a:focus-visible) {
          outline: 2px solid #f2f7f7;
          outline-offset: 3px;
        }

        .socials :global(svg) {
          width: 18px;
          height: 18px;
          fill: #fff;
        }

        .socials :global(.ig) {
          background: radial-gradient(
            circle at 30% 110%,
            #ffdb8b 0%,
            #ee2a7b 45%,
            #6228d7 90%
          );
        }
        .socials :global(.tiktok) {
          background: #010101;
        }
        .socials :global(.fb) {
          background: #1877f2;
        }
        .socials :global(.x) {
          background: #1a1a1a;
        }
        .socials :global(.wa) {
          background: #25d366;
        }

        .handle {
          font-family: "Poppins", sans-serif;
          font-weight: 700;
          font-size: 26px;
          margin: 0 0 6px;
        }

              .phone {
          font-family: "Poppins", sans-serif;
          font-weight: 600;
          font-size: 17px;
          color: var(--text-muted);
          margin: 0;
          letter-spacing: 0.5px;
        }

        @media (max-width: 560px) {
          .content {
            grid-template-columns: 1fr;
          }
          .photoFrame {
            aspect-ratio: 4 / 3;
          }
          .copy h1 {
            font-size: 44px;
          }
          .brandHeader {
            letter-spacing: 6px;
            font-size: 12px;
          }
          .cornerBadge {
            right: 18px;
            width: 54px;
            height: 54px;
            bottom: -20px;
          }
        }
      `}</style>
    </main>
  );
}