'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styled from 'styled-components';
import { useCart } from '@/context/CartContext';
import { resolvePostLoginIntent } from '@/lib/cartIntent';
import { useNotification } from '@/context/NotificationContext';

/* ============================================================
   Role configuration
   ------------------------------------------------------------
   Admin is intentionally NOT included yet — no admin login
   component has been shared. Send that one next and I'll wire
   it in the same way (most likely sign-in only, no public
   sign-up, per the "admins are provisioned" plan).
   ============================================================ */

type Role = 'buyer' | 'seller' | 'delivery';
type Mode = 'signin' | 'signup';

interface RoleConfig {
  label: string;
  identifierField: 'email' | 'contact' | 'phone';
  identifierType: 'text' | 'tel';
  identifierPlaceholder: string;
  loginEndpoint: string;
  registerEndpoint: string;
  storageKey: 'customerId' | 'sellerId' | 'deliveryGuyId';
  redirectAfterLogin: string;
}



const ROLE_CONFIG: Record<Role, RoleConfig> = {
  buyer: {
    label: 'Buyer',
    identifierField: 'email',
    identifierType: 'text',
    identifierPlaceholder: 'Phone or email',
    loginEndpoint: '/api/customers/login',
    registerEndpoint: '/api/customers/register',
    storageKey: 'customerId',
    redirectAfterLogin: '/',
  },
  seller: {
    label: 'Seller',
    identifierField: 'contact',
    identifierType: 'text',
    identifierPlaceholder: 'Phone or email',
    loginEndpoint: '/api/sellers/login',
    registerEndpoint: '/api/sellers/register',
    storageKey: 'sellerId',
    redirectAfterLogin: '/seller/dashboard',
  },
  delivery: {
    label: 'Delivery',
    identifierField: 'contact',
    identifierType: 'text',
    identifierPlaceholder: 'Phone or email',
    loginEndpoint: '/api/delivery/login',
    registerEndpoint: '/api/delivery/register',
    storageKey: 'deliveryGuyId',
    redirectAfterLogin: '/delivery/dashboard',
  },
};

const ROLE_ORDER: Role[] = ['buyer', 'seller', 'delivery'];

/* ============================================================
   Jelly Triangle Loader
   ------------------------------------------------------------
   Ported 1:1 from the original <script> — same timers, same
   vectors, same reflow tricks. Only change: DOM lookups by id
   are now refs, and the destroy function is a normal effect
   cleanup instead of a window global.
   ============================================================ */

function JellyTriangleLoader() {
  const triangleRef = useRef<HTMLDivElement>(null);
  const oozeRef = useRef<HTMLDivElement>(null);
  const dotARef = useRef<HTMLDivElement>(null);
  const dotBRef = useRef<HTMLDivElement>(null);
  const dotCRef = useRef<HTMLDivElement>(null);
  const trackARef = useRef<HTMLDivElement>(null);
  const trackBRef = useRef<HTMLDivElement>(null);
  const travelerABRef = useRef<HTMLDivElement>(null);
  const travelerACRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triangle = triangleRef.current;
    const oozeWrapper = oozeRef.current;
    const dotA = dotARef.current;
    const dotB = dotBRef.current;
    const dotC = dotCRef.current;
    const trackA = trackARef.current;
    const trackB = trackBRef.current;
    const travelerAB = travelerABRef.current;
    const travelerAC = travelerACRef.current;

    if (!triangle || !oozeWrapper || !dotA || !dotB || !dotC || !trackA || !trackB || !travelerAB || !travelerAC) {
      return;
    }

   


    const triangleEl = triangle;
const oozeWrapperEl = oozeWrapper;
const dotAEl = dotA;
const dotBEl = dotB;
const dotCEl = dotC;
const trackAEl = trackA;
const trackBEl = trackB;
const travelerABEl = travelerAB;
const travelerACEl = travelerAC;


    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function readVar(name: string, fallback: number) {
      const raw = getComputedStyle(triangle as HTMLDivElement).getPropertyValue(name);
      const val = parseFloat(raw);
      return isNaN(val) ? fallback : val;
    }

    const travelMs = readVar('--uib-travel-ms', 3000);
    const holdMs = readVar('--uib-hold-ms', 2000);
    const imgStepMs = readVar('--uib-img-step-ms', 700);
    const travelScale = readVar('--uib-travel-scale', 1.35);

    // Equal-magnitude, mirrored vectors: same travel distance/angle for
    // both legs, just reflected left/right.
    const TRAVEL_DISTANCE = { x: 110, y: 175 };
    const A_TO_B = { x: TRAVEL_DISTANCE.x, y: TRAVEL_DISTANCE.y };
    const A_TO_C = { x: -TRAVEL_DISTANCE.x, y: TRAVEL_DISTANCE.y };

    function vecToTransform(v: { x: number; y: number }, scale: number) {
      return `translate(${v.x}%, ${v.y}%) scale(${scale})`;
    }

    let timers: ReturnType<typeof setTimeout>[] = [];
    let cycleInterval: ReturnType<typeof setInterval> | null = null;
    let destroyed = false;

    const legs = [
      { traveler: travelerAB, origin: dotA, dest: dotB, vector: A_TO_B, cycleTrack: trackB, otherTrack: trackA },
      { traveler: travelerAC, origin: dotA, dest: dotC, vector: A_TO_C, cycleTrack: trackA, otherTrack: trackB },
    ];

    let legIndex = 0;

    function schedule(fn: () => void, delay: number) {
      const id = setTimeout(() => {
        if (destroyed) return;
        fn();
      }, delay);
      timers.push(id);
      return id;
    }

    function forceReflow(el: HTMLElement) {
      void el.offsetWidth;
    }

    function resetTrack(track: HTMLDivElement) {
      track.style.transition = 'none';
      track.style.transform = 'translateY(0%)';
      forceReflow(track);
      track.style.transition = '';
    }

    function startImageCycle(track: HTMLDivElement) {
      let idx = 0;
      resetTrack(track);
      if (prefersReducedMotion) return; // keep first frame static
      cycleInterval = setInterval(() => {
        idx = (idx + 1) % 3;
        track.style.transform = `translateY(-${idx * 33.3333}%)`;
      }, imgStepMs);
    }

    function stopImageCycle(track: HTMLDivElement) {
      if (cycleInterval) {
        clearInterval(cycleInterval);
        cycleInterval = null;
      }
      resetTrack(track);
    }

    function runLeg(leg: (typeof legs)[number], delay: number, onDone: () => void) {
      const effectiveTravelMs = prefersReducedMotion ? 0 : travelMs;
      const forwardTransform = vecToTransform(leg.vector, travelScale);

      oozeWrapperEl.appendChild(leg.origin);
      oozeWrapperEl.appendChild(leg.dest);
      oozeWrapperEl.appendChild(leg.traveler);

      leg.traveler.style.transition = 'none';
      leg.traveler.style.opacity = '1';
      leg.traveler.style.transform = 'translate(0, 0) scale(1)';
      forceReflow(leg.traveler);
      leg.traveler.style.transition = '';

      resetTrack(leg.otherTrack);

      schedule(() => {
        oozeWrapperEl.classList.add('is-oozing');
        leg.dest.classList.add('is-growing');
        leg.traveler.style.transform = forwardTransform;
        startImageCycle(leg.cycleTrack);

        schedule(() => {
          leg.dest.classList.remove('is-growing');
          oozeWrapperEl.classList.remove('is-oozing');
          stopImageCycle(leg.cycleTrack);

          leg.traveler.style.transition = 'none';
          leg.traveler.style.opacity = '0';
          leg.traveler.style.transform = 'translate(0, 0) scale(1)';
          forceReflow(leg.traveler);
          leg.traveler.style.transition = '';

          triangleEl.appendChild(leg.origin);
          triangleEl.appendChild(leg.dest);
          triangleEl.appendChild(leg.traveler);

          onDone();
        }, effectiveTravelMs);
      }, delay);
    }

    function sequence(isFirst: boolean) {
      if (destroyed) return;
      const leg = legs[legIndex];
      const delay = isFirst ? holdMs : 0; // no gap between connections after the first
      runLeg(leg, delay, () => {
        legIndex = (legIndex + 1) % legs.length;
        sequence(false);
      });
    }

    sequence(true);

    return () => {
      destroyed = true;
      timers.forEach(clearTimeout);
      timers = [];
      if (cycleInterval) {
        clearInterval(cycleInterval);
        cycleInterval = null;
      }
      oozeWrapper.classList.remove('is-oozing');
      [dotA, dotB, dotC].forEach((dot) => dot.classList.remove('is-growing'));
      [travelerAB, travelerAC].forEach((t) => {
        t.style.transition = 'none';
        t.style.opacity = '0';
        t.style.transform = 'translate(0, 0) scale(1)';
      });
      resetTrack(trackA);
      resetTrack(trackB);
    };

    
    
  }, []);

  return (
    <div className="loader-zone">
      <div id="loaderSlot">
        <div className="jelly-triangle" ref={triangleRef}>
          <div className="jelly-triangle__dot jelly-triangle__dot--a" ref={dotARef}>
            <div className="jelly-triangle__img-track" ref={trackARef}>
              <img src="/a1.jpg" alt="" loading="lazy" />
              <img src="/a2.jpg" alt="" loading="lazy" />
              <img src="/a3.jpg" alt="" loading="lazy" />
            </div>
          </div>
          <div className="jelly-triangle__dot jelly-triangle__dot--b" ref={dotBRef}>
            <div className="jelly-triangle__img-track" ref={trackBRef}>
              <img src="/a4.jpg" alt="" loading="lazy" />
              <img src="/a5.jpg" alt="" loading="lazy" />
              <img src="/a6.jpg" alt="" loading="lazy" />
            </div>
          </div>
          <div className="jelly-triangle__dot jelly-triangle__dot--c" ref={dotCRef}>
            <img className="jelly-triangle__static-img" src="/icon.png" alt="" loading="lazy" />
          </div>

          <div className="jelly-triangle__ooze-wrapper" ref={oozeRef} />

          <div className="jelly-triangle__traveler jelly-triangle__traveler--ab" ref={travelerABRef} />
          <div className="jelly-triangle__traveler jelly-triangle__traveler--ac" ref={travelerACRef} />
        </div>

        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <defs>
            <filter id="uib-jelly-triangle-ooze">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
                result="ooze"
              />
              <feBlend in="SourceGraphic" in2="ooze" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

/* ============================================================
   Shared icon markup (unchanged from the original)
   ============================================================ */

const AppleIcon = () => (
  <svg className="icon-mark" viewBox="0 0 384 512" fill="#15141a">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27-32.1 24.5-61.4 23.7-71.9-23.8 1.4-51.3 16.4-67 34.9-17.3 19.8-27.5 44.3-25.3 71.2 25.9 2 49.5-11.4 68.6-34.2z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="icon-mark" viewBox="0 0 488 512">
    <path
      fill="#15141a"
      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 116.8 95.2 95.6 232.1c-21.3 138.6 103.2 246.8 220.4 178.3 27-15.6 45.8-39 53.9-67.7H248v-92.4h236.1c2.5 12.5 3.9 25.7 3.9 40.9z"
    />
  </svg>
);
/* ============================================================
   Upload / Capture buttons — black variants of the reference design
   ============================================================ */

const PhotoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={22} viewBox="0 0 24 24" height={22} fill="none" className="svg-icon">
    <g strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" stroke="#fff">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 15-5-5-9 9" />
    </g>
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={22} viewBox="0 0 24 24" height={22} fill="none" className="svg-icon">
    <g strokeWidth={2} strokeLinecap="round" stroke="#fff" fillRule="evenodd" clipRule="evenodd">
      <path d="m4 9c0-1.10457.89543-2 2-2h2l.44721-.89443c.33879-.67757 1.03131-1.10557 1.78889-1.10557h3.5278c.7576 0 1.4501.428 1.7889 1.10557l.4472.89443h2c1.1046 0 2 .89543 2 2v8c0 1.1046-.8954 2-2 2h-12c-1.10457 0-2-.8954-2-2z" />
      <path d="m15 13c0 1.6569-1.3431 3-3 3s-3-1.3431-3-3 1.3431-3 3-3 3 1.3431 3 3z" />
    </g>
  </svg>
);

function CaptureButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <CaptureButtonWrapper>
      <button type="button" className="button" onClick={onClick}>
        {icon}
        <span className="lable">{label}</span>
      </button>
    </CaptureButtonWrapper>
  );
}

const CaptureButtonWrapper = styled.div`
  .button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 9px 12px;
    gap: 8px;
    height: 40px;
    width: 100%;
    max-width: 220px;
    border: none;
    background: #15141a; /* black */
    border-radius: 20px;
    cursor: pointer;
  }
  .lable {
    line-height: 22px;
    font-size: 14px;
    color: #fff;
    font-family: sans-serif;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .button:hover {
    background: #000;
  }
  .button:hover .svg-icon {
    animation: flickering 2s linear infinite;
  }
  @keyframes flickering {
    0% { opacity: 1; } 50% { opacity: 1; } 52% { opacity: 1; }
    54% { opacity: 0; } 56% { opacity: 1; } 90% { opacity: 1; }
    92% { opacity: 0; } 94% { opacity: 1; } 96% { opacity: 0; }
    98% { opacity: 1; } 99% { opacity: 0; } 100% { opacity: 1; }
  }
`;
/* ============================================================
   Main component
   ============================================================ */
function ResendOtpButton({ contact, purpose }: { contact: string; purpose: 'signup-verify' | 'password-reset' | 'login-verify' }) {
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    setMsg('');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, purpose }),
      });
      const data = await res.json().catch(() => ({}) as Record<string, string>);
      setMsg(data.message || '');
      setCooldown(30);
    } catch {
      setMsg('Network error — please try again.');
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <button
        type="button"
        className="link-small"
        disabled={cooldown > 0}
        onClick={resend}
        style={{ opacity: cooldown > 0 ? 0.5 : 1 }}
      >
        {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
      </button>
      {msg && <p className="form-sub" style={{ marginTop: 4 }}>{msg}</p>}
    </div>
  );
}


function AuthGateway() {
  const router = useRouter();


  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('signin');
  const [role, setRole] = useState<Role>('buyer');
  const [otpOpen, setOtpOpen] = useState(false);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');


  // 2FA login flow — used by all three roles
  const [loginOtpPending, setLoginOtpPending] = useState<{ contact: string; role: Role } | null>(null);
  const [loginOtpCode, setLoginOtpCode] = useState('');

  // "Verify now" prompt shown on the sign-in form when login is blocked
  // because the contact was never verified
  const [pendingVerifyContact, setPendingVerifyContact] = useState<string | null>(null);

  // Seller KYC + signup verification
  const [ecocashNumber, setEcocashNumber] = useState('');
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [livePhotoFile, setLivePhotoFile] = useState<File | null>(null);
  const idPhotoInputRef = useRef<HTMLInputElement | null>(null);

const [cameraOpen, setCameraOpen] = useState(false);
const liveVideoRef = useRef<HTMLVideoElement | null>(null);
const liveStreamRef = useRef<MediaStream | null>(null);
  const [signupStep, setSignupStep] = useState<'form' | 'verify' | 'pending'>('form');
  const [signupOtp, setSignupOtp] = useState('');
  const [verifiedContact, setVerifiedContact] = useState('');

  // Forgot-password mini-flow — separate from the signin identifier field,
  // since the user may click this before typing anything there.
  const [fpPhase, setFpPhase] = useState<'idle' | 'code-sent'>('idle');
  const [fpContact, setFpContact] = useState('');
  const [fpCode, setFpCode] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMessage, setFpMessage] = useState('');


  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  function resetFields() {
    setName('');
    setBusinessName('');
    setIdentifier('');
    setPassword('');
    setError('');
    setSuccess('');
    setEcocashNumber('');
    setIdPhotoFile(null);
    setLivePhotoFile(null);
    setSignupStep('form');
    setSignupOtp('');
  }

  function resetForgotPassword() {
    setFpPhase('idle');
    setFpContact('');
    setFpCode('');
    setFpNewPassword('');
    setFpMessage('');
  }

  function openSheet(initialMode: Mode) {
    setMode(initialMode);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setOtpOpen(false);
    resetFields();
    resetForgotPassword();
    setLoginOtpPending(null);
    setLoginOtpCode('');
    setPendingVerifyContact(null);
  }

  function switchRole(next: Role) {
    setRole(next);
    resetFields();
  }

    const searchParams = useSearchParams();
  const { addToCart, buyNow } = useCart();
  const { notify } = useNotification();

  useEffect(() => {
    const googleError = searchParams.get('googleError');
    if (googleError) setError(googleError);
  }, [searchParams]);

    useEffect(() => {
    const presetRole = searchParams.get('role');
    const presetMode = searchParams.get('mode');
    if (presetRole === 'buyer' || presetRole === 'seller' || presetRole === 'delivery') {
      setRole(presetRole);
      setMode(presetMode === 'signup' ? 'signup' : 'signin');
      setSheetOpen(true);
    }
  }, [searchParams]);

    useEffect(() => {
    if (cameraOpen && liveVideoRef.current && liveStreamRef.current) {
      liveVideoRef.current.srcObject = liveStreamRef.current;
      liveVideoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);


  function continueWithGoogle() {
    window.location.href = '/api/auth/google';
  }


  async function openLiveCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });
    liveStreamRef.current = stream;
    setCameraOpen(true);
    // Attachment now happens in the useEffect above, which fires
    // after React has actually mounted the <video> element — the
    // setTimeout(...,0) approach raced the DOM update and silently
    // failed most of the time, producing a blank camera view.
  } catch (err) {
    console.error('Camera access denied or unavailable:', err);
    setError('Camera access is required to take a live photo.');
  }
}

function stopLiveCamera() {
  liveStreamRef.current?.getTracks().forEach((t) => t.stop());
  liveStreamRef.current = null;
  setCameraOpen(false);
}

function captureLivePhoto() {
  const video = liveVideoRef.current;
  if (!video) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')?.drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `live-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setLivePhotoFile(file);
    stopLiveCamera();
  }, 'image/jpeg', 0.9);
}


 async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const cfg = ROLE_CONFIG[role];

    try {
      if (mode === 'signin') {
        const res = await fetch(cfg.loginEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [cfg.identifierField]: identifier, password }),
        });
        const data = await res.json().catch(() => ({}) as Record<string, string>);

        if (res.ok && data.requiresOtp) {
          // Password correct — now needs the second factor.
          setLoginOtpPending({ contact: data.contact, role: (data.role as Role) ?? role });
          setSuccess(data.message || 'Enter the code we sent to finish signing in.');
          return;
        }

        if (!res.ok && data.needsVerification) {
          // Account exists and password matched, but the contact itself
          // was never OTP-verified after signup. Show a "Verify now"
          // button rather than silently redirecting.
          setPendingVerifyContact(data.contact);
          setError(data.message || 'Please verify your account.');
          return;
        }

        if (res.ok) {
          // Fallback path — shouldn't normally hit this now that every
          // login route returns requiresOtp, but kept for safety.
          localStorage.setItem(cfg.storageKey, data[cfg.storageKey] ?? '');
          setSuccess('Signed in — redirecting…');
          setTimeout(() => router.push(cfg.redirectAfterLogin), 600);
        } else {
          setError(data.message || 'Invalid credentials. Please try again.');
        }
        return;
      }

      // ---- signup ----
      // ---- signup ----
      if (role === 'seller' || role === 'delivery') {
        if (!idPhotoFile || !livePhotoFile) {
          setError('Please upload both your ID photo and a live photo.');
          return;
        }
        const fd = new FormData();
        fd.append('name', name);
        if (role === 'seller') {
          fd.append('businessName', businessName);
          fd.append('ecocashNumber', ecocashNumber);
        }
        fd.append('contact', identifier);
        fd.append('password', password);
        fd.append('idPhoto', idPhotoFile);
        fd.append('livePhoto', livePhotoFile);

        const res = await fetch(cfg.registerEndpoint, { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}) as Record<string, string>);

        if (res.ok) {
          setVerifiedContact(identifier);
          setSignupStep('verify');
          setSuccess(data.message || 'Enter the code we sent to verify your contact.');
        } else {
          setError(data.message || 'Registration failed. Please try again.');
        }
        return;
      }

      // ---- buyer / delivery signup (unchanged JSON path) ----
      const res = await fetch(cfg.registerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, [cfg.identifierField]: identifier, password }),
      });
      const data = await res.json().catch(() => ({}) as Record<string, string>);

      if (res.ok) {
        setSuccess('Account created — you can sign in now.');
        setTimeout(() => {
          setMode('signin');
          resetFields();
        }, 900);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error — please check your connection.');
    } finally {
      setLoading(false);
    }
  }


  async function handleVerifyLoginOtp(e: React.FormEvent) {
    
    e.preventDefault();
    if (!loginOtpPending) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: loginOtpPending.role,
          contact: loginOtpPending.contact,
          code: loginOtpCode,
        }),
      });
      const data = await res.json().catch(() => ({}) as Record<string, string>);
      if (res.ok) {
        const loginCfg = ROLE_CONFIG[loginOtpPending.role];
        localStorage.setItem(loginCfg.storageKey, data[loginCfg.storageKey] ?? '');

        // Only buyers can have a pending cart intent — sellers/delivery
        // logins never set one.
        if (loginOtpPending.role === 'buyer') {
          const resumed = await resolvePostLoginIntent(addToCart, buyNow);
          if (resumed) {
            setSuccess(
              resumed.type === 'buy-now'
                ? 'Signed in — taking you to checkout…'
                : 'Signed in — added your item to cart.'
            );
            setTimeout(
              () => router.push(resumed.type === 'buy-now' ? '/cart' : loginCfg.redirectAfterLogin),
              600
            );
            return;
          }
        }

        setSuccess('Signed in — redirecting…');
        notify('Welcome back!', 'success');
        setTimeout(() => router.push(loginCfg.redirectAfterLogin), 600);
      } else {
        setError(data.message || 'Invalid code.');
      }
    } catch {
      setError('Network error — please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function cancelLoginOtp() {
    setLoginOtpPending(null);
    setLoginOtpCode('');
    setError('');
    setSuccess('');
  }


  async function handleVerifySignupOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: verifiedContact, code: signupOtp }),
      });
      const data = await res.json().catch(() => ({}) as Record<string, string>);
      if (res.ok) {
        setSignupStep('pending');
        setSuccess('');
      } else {
        setError(data.message || 'Invalid code.');
      }
    } catch {
      setError('Network error — please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendResetCode(e: React.FormEvent) {
    e.preventDefault();
    setFpLoading(true);
    setFpMessage('');
    try {
            const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: fpContact, role }),
      });
      const data = await res.json().catch(() => ({}) as Record<string, string>);
      setFpMessage(data.message || 'If that account exists, a code has been sent.');
      setFpPhase('code-sent');
    } catch {
      setFpMessage('Network error — please try again.');
    } finally {
      setFpLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setFpLoading(true);
    setFpMessage('');
    try {
            const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: fpContact, code: fpCode, newPassword: fpNewPassword, role }),
      });
      const data = await res.json().catch(() => ({}) as Record<string, string>);
      if (res.ok) {
        setFpMessage('Password updated — you can sign in now.');
        setTimeout(() => {
          setOtpOpen(false);
          resetForgotPassword();
        }, 1200);
      } else {
        setFpMessage(data.message || 'Reset failed.');
      }
    } catch {
      setFpMessage('Network error — please try again.');
    } finally {
      setFpLoading(false);
    }
  }

  function handleOtpChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const digit = e.target.value.replace(/\D/g, '').slice(0, 1);
    e.target.value = digit;
    if (digit && otpRefs.current[i + 1]) otpRefs.current[i + 1]!.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpRefs.current[i]?.value && otpRefs.current[i - 1]) {
      otpRefs.current[i - 1]!.focus();
    }
  }

  const cfg = ROLE_CONFIG[role];

  return (
    <PageWrapper>
      <Phone className="phone">
        <JellyTriangleLoader />

        <div className="stage">
          {/* ---------- START SCREEN (unchanged) ---------- */}
          <div className="start-screen" aria-hidden={sheetOpen || undefined}>
            <h1>Dealo</h1>
            <p className="subtitle">
              Get started with Premium quality products and services. Sign in or create an account to continue.
            </p>

            <div className="btn-stack">
              {/*<button className="btn btn--light" type="button">
                <AppleIcon />
                Continue with Apple
              </button>*/}
              <button className="btn btn--outline" type="button" onClick={continueWithGoogle}>
          <GoogleIcon />
          Continue with Google
        </button>

              <div style={{ height: 4 }} />

              <button className="btn btn--solid" type="button" onClick={() => openSheet('signin')}>
                Sign In
              </button>
              <button className="btn btn--outline-one" type="button" onClick={() => openSheet('signup')}>
                Sign Up
              </button>
            </div>
          </div>

          {/* ---------- AUTH SHEET ---------- */}
          <div className={`auth-sheet${sheetOpen ? ' is-open' : ''}`}>
            <div className="sheet-panel">
              <div className="sheet-grabber" />
              <button className="sheet-back" type="button" onClick={closeSheet}>
                &#8249; Back
              </button>

              {/* Role switcher — the one addition needed to merge the
                  three access points into a single sheet. */}
              <div className="role-tabs">
                {ROLE_ORDER.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`role-tab${role === r ? ' is-active' : ''}`}
                    onClick={() => switchRole(r)}
                  >
                    {ROLE_CONFIG[r].label}
                  </button>
                ))}
              </div>

              {loginOtpPending ? (
                <form className="auth-form is-active" onSubmit={handleVerifyLoginOtp} noValidate>
                  <h2>Confirm it's you</h2>
                  <p className="form-sub">Enter the 6-digit code sent to {loginOtpPending.contact}.</p>
                  {error && <p className="alert-msg alert-msg--error">{error}</p>}
                  {success && <p className="alert-msg alert-msg--success">{success}</p>}
                  <input
                    className="field"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={loginOtpCode}
                    onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                  <ResendOtpButton contact={loginOtpPending.contact} purpose="login-verify" />
                  <button className="btn btn--solid" type="submit" disabled={loading}>
                    {loading ? 'Verifying…' : 'Confirm'}
                  </button>
                  <button type="button" className="link-small" style={{ alignSelf: 'center' }} onClick={cancelLoginOtp}>
                    Cancel
                  </button>
                </form>
              ) : mode === 'signin' ? (
                <form className="auth-form is-active" onSubmit={handleSubmit} noValidate>
                  <h2>Sign in</h2>
                  <p className="form-sub">Welcome back — pick up right where you left off.</p>

                  {error && <p className="alert-msg alert-msg--error">{error}</p>}
                  {success && <p className="alert-msg alert-msg--success">{success}</p>}
                  {pendingVerifyContact && (
                    <button
                      type="button"
                      className="btn btn--outline"
                      onClick={() => {
                        setVerifiedContact(pendingVerifyContact);
                        setSignupStep('verify');
                        setPendingVerifyContact(null);
                        setError('');
                        setMode('signup'); // reuses the same verify-step UI
                      }}
                    >
                      Verify my account
                    </button>
                  )}

                  <input
                    className="field"
                    type={cfg.identifierType}
                    placeholder={cfg.identifierPlaceholder}
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                  <input
                    className="field"
                    type="password"
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <div className="row-between">
                    <button className="link-small" type="button" onClick={() => setOtpOpen((v) => !v)}>
                      Forgot password?
                    </button>
                  </div>

                  <div className={`otp-panel${otpOpen ? ' is-open' : ''}`}>
                    <div className="otp-inner">
                      <div className="otp-body">
                        {fpPhase === 'idle' ? (
                          <>
                            <p>Enter your email or phone and we'll send you a reset code.</p>
                            <input
                              className="field"
                              type="text"
                              placeholder="Phone or email"
                              value={fpContact}
                              onChange={(e) => setFpContact(e.target.value)}
                            />
                            {fpMessage && <p className="form-sub">{fpMessage}</p>}
                            <button
                              className="btn btn--outline"
                              type="button"
                              style={{ padding: 10 }}
                              disabled={fpLoading || !fpContact}
                              onClick={handleSendResetCode}
                            >
                              {fpLoading ? 'Sending…' : 'Send code'}
                            </button>
                          </>
                        ) : (
                          <>
                            <p>Enter the code we sent, and your new password.</p>
                            <input
                              className="field"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="6-digit code"
                              value={fpCode}
                              onChange={(e) => setFpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            />
                            <input
                              className="field"
                              type="password"
                              placeholder="New password"
                              value={fpNewPassword}
                              onChange={(e) => setFpNewPassword(e.target.value)}
                            />
                            {fpMessage && <p className="form-sub">{fpMessage}</p>}
                            <button
                              className="btn btn--outline"
                              type="button"
                              style={{ padding: 10 }}
                              disabled={fpLoading || !fpCode || !fpNewPassword}
                              onClick={handleResetPassword}
                            >
                              {fpLoading ? 'Resetting…' : 'Reset password'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button className="btn btn--solid" type="submit" style={{ marginTop: 4 }} disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                  </button>

                  {role === 'buyer' && (
                    <>
                      <div className="divider-row">or</div>
                      <button className="btn btn--outline" type="button" onClick={continueWithGoogle}>
                        <GoogleIcon />
                        Continue with Google
                      </button>
                    </>
                  )}

                  <p className="switch-line">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        resetFields();
                      }}
                    >
                      Sign up
                    </button>
                  </p>
                </form>
              ) : (role === 'seller' || role === 'delivery') && signupStep === 'verify' ? (
                <form className="auth-form is-active" onSubmit={handleVerifySignupOtp} noValidate>
                  <h2>Verify your contact</h2>
                  <p className="form-sub">Enter the 6-digit code sent to {verifiedContact}.</p>
                  {error && <p className="alert-msg alert-msg--error">{error}</p>}
                  {success && <p className="alert-msg alert-msg--success">{success}</p>}
                  <input
                    className="field"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                  <ResendOtpButton contact={verifiedContact} purpose="signup-verify" />
                  <button className="btn btn--solid" type="submit" disabled={loading}>
                    {loading ? 'Verifying…' : 'Verify'}
                  </button>
                  <button
                    type="button"
                    className="link-small"
                    style={{ alignSelf: 'center' }}
                    onClick={() => setSignupStep('form')}
                  >
                    ← Back, edit my details
                  </button>
                </form>
              ) : (role === 'seller' || role === 'delivery') && signupStep === 'pending' ? (
                <div className="auth-form is-active">
                  <h2>Verification pending</h2>
                  <p className="form-sub">
                    Your contact is verified. Our team is reviewing your ID and photo — you'll be able to sign in
                    and start selling once your account is approved.
                  </p>
                  <button
                    className="btn btn--solid"
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      resetFields();
                    }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form className="auth-form is-active" onSubmit={handleSubmit} noValidate>
                  <h2>Create account</h2>
                  <p className="form-sub">Get started with Premium services</p>

                  {error && <p className="alert-msg alert-msg--error">{error}</p>}
                  {success && <p className="alert-msg alert-msg--success">{success}</p>}

                  <input
                    className="field"
                    type="text"
                    placeholder="Full name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  {role === 'seller' && (
                    <input
                      className="field"
                      type="text"
                      placeholder="Business name"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  )}

                  {role === 'seller' && (
                    <input
                      className="field"
                      type="text"
                      placeholder="EcoCash number"
                      required
                      value={ecocashNumber}
                      onChange={(e) => setEcocashNumber(e.target.value)}
                    />
                  )}
                  {(role === 'seller' || role === 'delivery') && (
  <>
    <div className="upload-field">
      <span>ID photo (front, clearly visible)</span>
      <input
        ref={idPhotoInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => setIdPhotoFile(e.target.files?.[0] ?? null)}
      />
      <CaptureButton
        icon={<PhotoIcon />}
        label={idPhotoFile ? 'Change ID photo' : 'Upload ID Photo'}
        onClick={() => idPhotoInputRef.current?.click()}
      />
      {idPhotoFile && <span style={{ fontSize: 11 }}>Selected: {idPhotoFile.name}</span>}
    </div>

    <div className="upload-field">
      <span>Live photo (selfie, taken now)</span>
      <CaptureButton
        icon={<CameraIcon />}
        label={livePhotoFile ? 'Retake Photo' : 'Take a Photo'}
        onClick={openLiveCamera}
      />
      {livePhotoFile && <span style={{ fontSize: 11 }}>Captured ✓</span>}
    </div>
  </>
)}

                  

                  <input
                    className="field"
                    type={cfg.identifierType}
                    placeholder={cfg.identifierPlaceholder}
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                  <input
                    className="field"
                    type="password"
                    placeholder="Password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button className="btn btn--solid" type="submit" style={{ marginTop: 4 }} disabled={loading}>
                    {loading ? 'Creating account…' : 'Create account'}
                  </button>

                  {role === 'buyer' && (
                    <>
                      <div className="divider-row">or</div>
                      <button className="btn btn--outline" type="button" onClick={continueWithGoogle}>
                        <GoogleIcon />
                        Continue with Google
                      </button>
                    </>
                  )}

                  <p className="switch-line">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        resetFields();
                      }}
                    >
                      Sign in
                    </button>
                  </p>
                  <div className='spacer'>.</div>
                </form>
              )}
            </div>
          </div>
        </div>

        {cameraOpen && (
  <CameraOverlay>
    <video ref={liveVideoRef} autoPlay playsInline muted />
    <div className="camera-actions">
      <button type="button" className="btn btn--solid" onClick={captureLivePhoto}>
        Capture
      </button>
      <button type="button" className="btn btn--outline" onClick={stopLiveCamera}>
        Cancel
      </button>
    </div>
  </CameraOverlay>
)}



      </Phone>
    </PageWrapper>
  );
}

/* ============================================================
   Styles — ported line-for-line from the original <style> block.
   :root / html / body rules are scoped onto PageWrapper / Phone
   instead of the document root, so this drops into an existing
   app without leaking CSS variables or resetting box-sizing
   globally.
   ============================================================ */

const PageWrapper = styled.div`
  min-height: 100dvh;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif;
`;

const Phone = styled.div`
  /* ---- login component vars (unchanged) ---- */
  --bg-1: #ffffff;
  --bg-2: #f4f3f2;
  --bg-3: #17151a;
  --ink: #15141a;
  --ink-dim: #6b6873;
  --line: rgba(0, 0, 0, 0.14);
  --pill-light: #ffffff;
  --sheet-bg: rgba(255, 255, 255, 0.86);
  --sheet-radius: 28px;

  /* ---- jelly triangle loader vars (unchanged logic, sizes now responsive) ---- */
  --uib-size: clamp(15rem, 20vw, 10rem);
  --uib-color: #000;
  --uib-travel-ms: 10000ms;
  --uib-hold-ms: 1000ms;
  --uib-grow-scale: 1.15;
  --uib-img-step-ms: 2000ms;
  --uib-travel-scale: 1.35;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  position: relative;
  width: 100%;
  max-width: 100vw;
  height: 100dvh;
  overflow: hidden;  
  color: var(--ink);
  display: flex;
  flex-direction: column;
  isolation: isolate;

  @media (max-width: 430px) {
    border-radius: 0;
  }

  @media (min-width: 700px) {
    max-width: 480px;
    max-height: 900px;
    margin: 0 auto;
    border-radius: 32px;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);

    .start-screen h1 {
      font-size: 34px;
    }

    .upload-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--ink-dim);
  }

  .upload-field input[type='file'] {
    border: 1px dashed var(--line);
    border-radius: 14px;
    padding: 10px 12px;
    font-size: 13px;
    color: var(--ink);
    background: rgba(0, 0, 0, 0.02);
  }

  
    .start-screen p.subtitle {
      font-size: 16px;
      max-width: 340px;
    }
    .btn {
      padding: 16px 20px;
      font-size: 16px;
    }
    .auth-form h2 {
      font-size: 26px;
    }
    .auth-form .form-sub {
      font-size: 14.5px;
    }
    .field {
      font-size: 16px;
      padding: 15px 18px;
    }
    .otp-inputs input {
      font-size: 20px;
    }
  }

  /* ---------- loader placeholder ---------- */
  .loader-zone {
    position: relative;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    padding-top: clamp(8px, 3dvh, 20px);
    z-index: 30;
  }

  #loaderSlot {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--uib-size);
    height: var(--uib-size);
  }

  /* ---------- scroll area holding start screen + sheet ---------- */
  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  /* ---------- start screen ---------- */
  .start-screen {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 8px 28px 28px;
    z-index: 10;
    transition: transform 420ms ease, opacity 420ms ease;
  }

  .start-screen h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 4px 0 10px;
    letter-spacing: -0.01em;
  }
.start-screen h1{
color: var(--text-primary);

}
  .start-screen p.subtitle {
    color: var(--ink-dim);
    font-size: 14.5px;
    line-height: 1.5;
    margin: 0 0 30px;
    max-width: 300px;
  }

  .btn-stack {
    width: 100%;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
  }

  .btn {
    appearance: none;
    border: none;
    width: 100%;
    padding: 14px 18px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: transform 120ms ease, filter 120ms ease;
  }
  .btn:active {
    transform: scale(0.98);
  }

  .btn--light {
    background: var(--pill-light);
    color: var(--ink);
    border: 1px solid var(--line);
  }
  .btn--outline {
    background: transparent;
    color: var(--ink);
    border: 1px solid var(--line);
  }
  .btn--outline-one {
    background: transparent;
    color: #969595;
    border: 1px solid var(--line);
  }
  .btn--solid {
    background: var(--ink);
    color: #fff;
  }
  .btn--solid:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  .btn--ghost-link {
    background: none;
    border: none;
    color: var(--ink-dim);
    font-size: 13.5px;
    font-weight: 500;
    padding: 6px;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .icon-mark {
    width: 16px;
    height: 16px;
    display: inline-flex;
    flex-shrink: 0;
  }

  /* ---------- auth sheet ---------- */
  .auth-sheet {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: flex-end;
    transform: translateY(100%);
    transition: transform 460ms cubic-bezier(0.32, 0.72, 0, 1);
    pointer-events: none;
  }
  .auth-sheet.is-open {
    transform: translateY(0%);
    pointer-events: auto;
  }

  .sheet-panel {
    width: 100%;
    min-height: 105%;
    max-height: 105%;
    background: var(--sheet-bg);
    backdrop-filter: blur(18px);
    border-top-left-radius: var(--sheet-radius);
    border-top-right-radius: var(--sheet-radius);
    border-top: 1px solid var(--line);
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.12);
    padding: 18px 24px calc(14px + env(safe-area-inset-bottom));
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    margin-bottom: -4px; /* hide the sheet's bottom border behind the phone bezel */
  }

  .sheet-grabber {
    width: 40px;
    height: 4px;
    border-radius: 4px;
    background: var(--line);
    margin: 0 auto 14px;
  }

  .sheet-back {
    background: none;
    border: none;
    color: var(--ink-dim);
    font-size: 14px;
    align-self: flex-start;
    margin-bottom: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
  }

  /* ---------- role tabs (new — the merge point for buyer/seller/delivery) ---------- */
  .role-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }
  .role-tab {
    flex: 1;
    appearance: none;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink-dim);
    border-radius: 999px;
    padding: 8px 0;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 150ms ease, color 150ms ease;
  }
  .role-tab.is-active {
    background: var(--ink);
    color: #fff;
    border-color: var(--ink);
  }

  .auth-form {
    display: none;
    flex-direction: column;
    gap: 12px;
  }
  .auth-form.is-active {
    display: flex;
  }

  .auth-form h2 {
    margin: 2px 0 2px;
    font-size: 22px;
    font-weight: 700;
  }
  .auth-form .form-sub {
    color: var(--ink-dim);
    font-size: 13.5px;
    margin: 0 0 8px;
  }

  /* ---------- alert banners (new — original had no real submission, so no error/success UI existed) ---------- */
  .alert-msg {
    margin: 0;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.4;
  }
  .alert-msg--error {
    background: rgba(200, 30, 30, 0.08);
    border: 1px solid rgba(200, 30, 30, 0.25);
    color: #a12626;
  }
  .alert-msg--success {
    background: rgba(20, 140, 90, 0.08);
    border: 1px solid rgba(20, 140, 90, 0.25);
    color: #14804f;
  }

  .upload-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    color: var(--ink-dim);
  }
  .upload-field input[type='file'] {
    border: 1px dashed var(--line);
    border-radius: 14px;
    padding: 10px 12px;
    font-size: 13px;
    color: var(--ink);
    background: rgba(0, 0, 0, 0.02);
  }
    
  .field {
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 13px 16px;
    color: var(--ink);
    font-size: 15px;
    width: 100%;
    outline: none;
    transition: border-color 150ms ease, background 150ms ease;
  }
  .field::placeholder {
    color: #948f9c;
  }
  .field:focus {
    border-color: rgba(0, 0, 0, 0.45);
    background: rgba(0, 0, 0, 0.06);
  }

  .row-between {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: -4px;
  }
  .link-small {
    background: none;
    border: none;
    color: var(--ink-dim);
    font-size: 13px;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
    padding: 2px;
  }

  .divider-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 4px 0;
    color: var(--ink-dim);
    font-size: 12.5px;
  }
  .divider-row::before,
  .divider-row::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--line);
  }

  .switch-line {
    text-align: center;
    font-size: 13.5px;
    color: var(--ink-dim);
    margin-top: 4px;
    
  }
  .switch-line button {
    background: none;
    border: none;
    color: var(--ink);
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    font-size: 13.5px;
    padding: 0;
  }

  .spacer{
    height: 200px;
  }

  /* ---------- OTP panel (forgot password) ---------- */
  .otp-panel {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 320ms ease;
  }
  .otp-panel.is-open {
    grid-template-rows: 1fr;
  }
  .otp-panel > .otp-inner {
    overflow: hidden;
  }

  .otp-body {
    border: 1px dashed var(--line);
    border-radius: 14px;
    padding: 14px;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .otp-body p {
    margin: 0;
    font-size: 13px;
    color: var(--ink-dim);
  }

  .otp-inputs {
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }
  .otp-inputs input {
    width: 100%;
    aspect-ratio: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 600;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--ink);
    outline: none;
  }
  .otp-inputs input:focus {
    border-color: rgba(0, 0, 0, 0.45);
  }

  /* ================================================================
     Jelly Triangle Loader styles (unchanged)
     ================================================================ */

  .jelly-triangle {
    position: relative;
    height: var(--uib-size);
    width: var(--uib-size);
  }

  .jelly-triangle__ooze-wrapper {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .jelly-triangle__ooze-wrapper.is-oozing {
    filter: url('#uib-jelly-triangle-ooze');
  }

  .jelly-triangle__dot {
    position: absolute;
    width: 29%;
    height: 29%;
    border: 4px solid #000;
    border-radius: 50%;
    overflow: hidden;
    background: #fff;
    transition: transform var(--uib-travel-ms) ease;
    will-change: transform;
    z-index: 2;
  }

  .jelly-triangle__dot img.jelly-triangle__static-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .jelly-triangle__img-track {
    width: 100%;
    height: 300%;
    display: flex;
    flex-direction: column;
    transform: translateY(0%);
    transition: transform var(--uib-img-step-ms) ease;
  }

  .jelly-triangle__img-track img {
    width: 100%;
    height: 33.3333%;
    object-fit: cover;
    display: block;
    flex-shrink: 0;
  }

  .jelly-triangle__dot.is-growing {
    transform: scale(var(--uib-grow-scale));
  }

  .jelly-triangle__dot--a {
    top: 10%;
    left: 30%;
    width: 38%;
    height: 38%;
  }
  .jelly-triangle__dot--b {
    bottom: 25%;
    right: 13%;
  }
  .jelly-triangle__dot--c {
    bottom: 25%;
    left: 13%;
  }

  .jelly-triangle__traveler {
    position: absolute;
    width: 15%;
    height: 18%;
    background: #000;
    border-radius: 50%;
    transition: transform var(--uib-travel-ms) ease;
    will-change: transform;
    opacity: 0;
    z-index: 1;
  }

  .jelly-triangle__traveler--ab {
    top: 19%;
    left: 43%;
  }
  .jelly-triangle__traveler--ac {
    top: 19%;
    left: 39%;
  }

  @media (prefers-reduced-motion: reduce) {
    .jelly-triangle__dot,
    .jelly-triangle__traveler,
    .jelly-triangle__img-track {
      transition-duration: 0.01ms !important;
    }
  }
`;


const CameraOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 50;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;

  video {
    width: 100%;
    max-height: 70%;
    object-fit: cover;
    transform: scaleX(-1); /* mirror selfie view */
  }

  .camera-actions {
    display: flex;
    gap: 12px;
  }
`;

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthGateway />
    </Suspense>
  );
}