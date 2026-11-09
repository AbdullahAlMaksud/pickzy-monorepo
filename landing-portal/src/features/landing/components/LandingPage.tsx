'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Database,
  Download,
  FileSpreadsheet,
  Globe,
  Layers,
  Lock,
  Play,
  RotateCw,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  WifiOff,
  Zap,
} from 'lucide-react';
import { BrandMark } from '@/components/shared/BrandMark';
import { Button } from '@/components/ui/button';

const DEMO_NAMES = ['Sophia', 'Alex', 'Fatima', 'Liam', 'Zainab', 'Noah'];
const DEMO_COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#1e293b', '#020617'];

export function LandingPage() {
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    };
  }, []);

  const handleDemoSpin = () => {
    if (spinning) return;
    setWinner(null);
    setSpinning(true);

    const sliceAngle = 360 / DEMO_NAMES.length;
    const randomIndex = Math.floor(Math.random() * DEMO_NAMES.length);
    // Extra 5 full rotations + offset for the selected slice
    const targetSliceRotation = 360 * 5 + (360 - randomIndex * sliceAngle - sliceAngle / 2);
    const newTotalRotation = wheelRotation + targetSliceRotation;

    setWheelRotation(newTotalRotation);

    spinTimeoutRef.current = setTimeout(() => {
      setSpinning(false);
      const chosen = DEMO_NAMES[randomIndex];
      setWinner(chosen);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0f172a', '#334155', '#64748b', '#94a3b8'],
        });
      } catch {
        // Safe fallback if confetti canvas cannot load
      }
    }, 3200);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Grid background layer on pure white */}
      <div className="fixed inset-0 pointer-events-none bg-grid-subtle opacity-70" aria-hidden="true" />

      {/* Floating Marketing Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-950">
            <BrandMark className="size-8" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">Pickzy</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition-colors hover:text-slate-950">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-slate-950">
              How It Works
            </a>
            <a href="#demo" className="transition-colors hover:text-slate-950">
              Live Demo
            </a>
            <a href="#mobile-app" className="transition-colors hover:text-slate-950">
              Mobile App
            </a>
            <a href="#faq" className="transition-colors hover:text-slate-950">
              FAQ
            </a>
            <Link href="/privacy" className="transition-colors hover:text-slate-950">
              Privacy
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex border-slate-300 text-slate-800 hover:bg-slate-100">
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
            <Button asChild size="sm" className="bg-slate-950 text-white hover:bg-slate-800">
              <Link href="/app" className="inline-flex items-center gap-1.5">
                <span>Launch Web App</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Ambient subtle light glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 size-[420px] rounded-full bg-slate-200/50 blur-3xl pointer-events-none animate-pulse-subtle" />

        <div className="mx-auto max-w-5xl text-center">
          {/* Eyebrow badge */}
          <div className="animate-slide-up-fade inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50/90 px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-xs transition-transform duration-200 hover:scale-105">
            <span className="flex size-2 rounded-full bg-slate-950 animate-pulse" />
            <span>Pickzy 2.0 · 100% Offline-First Winner Picker</span>
            <Sparkles className="size-3.5 text-slate-600" />
          </div>

          <h1 className="animate-slide-up-fade [animation-delay:100ms] mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl lg:text-7xl">
            Fair, Fast & Transparent
            <br />
            <span className="text-slate-700">Random Winner Picker</span>
          </h1>

          <p className="animate-slide-up-fade [animation-delay:200ms] mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg md:text-xl leading-relaxed">
            The modern decision and raffle wheel designed for events, classrooms, giveaways, and contests.
            Run draws completely offline with zero tracking, custom multi-winner rules, and instant file imports.
          </p>

          <div className="animate-slide-up-fade [animation-delay:300ms] mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button asChild size="lg" className="bg-slate-950 px-6 text-white shadow-md transition-all duration-200 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-98">
              <Link href="/app" className="inline-flex items-center gap-2">
                <span>Open Web Portal</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-300 bg-white px-6 text-slate-900 transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 hover:-translate-y-0.5 active:translate-y-0">
              <a href="#demo" className="inline-flex items-center gap-2">
                <Play className="size-4 fill-current" />
                <span>Try Live Demo</span>
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg" className="bg-slate-100 text-slate-900 transition-all duration-200 hover:bg-slate-200 hover:-translate-y-0.5 active:translate-y-0">
              <a href="#mobile-app" className="inline-flex items-center gap-2">
                <Smartphone className="size-4" />
                <span>Mobile App</span>
              </a>
            </Button>
          </div>

          {/* Trust Highlights */}
          <div className="animate-slide-up-fade [animation-delay:400ms] mt-12 grid grid-cols-2 gap-3 text-left sm:grid-cols-4 sm:gap-4 max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3.5 backdrop-blur-sm shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-slate-950 font-semibold text-sm">
                <WifiOff className="size-4 text-slate-700" />
                <span>100% Offline</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Zero cloud dependency. Runs in your browser and phone.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3.5 backdrop-blur-sm shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-slate-950 font-semibold text-sm">
                <Cpu className="size-4 text-slate-700" />
                <span>Crypto Random</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Uniform cryptographically secure randomness.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3.5 backdrop-blur-sm shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-slate-950 font-semibold text-sm">
                <Lock className="size-4 text-slate-700" />
                <span>Private & Safe</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">No telemetry, cookies, or account sign-ups.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3.5 backdrop-blur-sm shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-slate-950 font-semibold text-sm">
                <Trophy className="size-4 text-slate-700" />
                <span>Multi-Winner</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Draw 1st, 2nd, 3rd place with immutable history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Section */}
      <section id="demo" className="relative border-y border-slate-200 bg-slate-50/70 py-16 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
            Interactive Preview
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            See the Spin Wheel in Action
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600 text-sm sm:text-base">
            Test the wheel right here. Click Spin to see physics-inspired easing, sound cues, and immediate winner selection.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center">
            {/* Wheel Canvas Container */}
            <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-300 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:border-slate-400">
              {/* Top pointer marker */}
              <div className={`z-20 -mb-3 flex flex-col items-center transition-transform duration-100 ${spinning ? 'scale-110 -rotate-6' : ''}`}>
                <div className="h-0 w-0 border-x-8 border-x-transparent border-t-[16px] border-t-slate-950 drop-shadow-sm" />
              </div>

              {/* The Spinning Wheel */}
              <div className="relative size-64 sm:size-72 flex items-center justify-center overflow-hidden rounded-full border-4 border-slate-950 shadow-inner">
                <svg
                  viewBox="0 0 100 100"
                  className="size-full transition-transform ease-out"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transitionDuration: spinning ? '3200ms' : '0ms',
                    transitionTimingFunction: 'cubic-bezier(0.15, 0.85, 0.25, 1)',
                  }}
                  aria-hidden="true"
                >
                  {DEMO_NAMES.map((name, i) => {
                    const count = DEMO_NAMES.length;
                    const angle = 360 / count;
                    const startAngle = (i * angle - 90) * (Math.PI / 180);
                    const endAngle = ((i + 1) * angle - 90) * (Math.PI / 180);
                    const x1 = 50 + 50 * Math.cos(startAngle);
                    const y1 = 50 + 50 * Math.sin(startAngle);
                    const x2 = 50 + 50 * Math.cos(endAngle);
                    const y2 = 50 + 50 * Math.sin(endAngle);

                    const textAngle = i * angle + angle / 2;
                    const rad = textAngle * (Math.PI / 180);
                    const tx = 50 + 32 * Math.cos(rad);
                    const ty = 50 + 32 * Math.sin(rad);

                    return (
                      <g key={name}>
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                          fill={DEMO_COLORS[i % DEMO_COLORS.length]}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                        <text
                          x={tx}
                          y={ty}
                          fill="#ffffff"
                          fontSize="5.5"
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textAngle + 90}, ${tx}, ${ty})`}
                        >
                          {name}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="50" cy="50" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                </svg>
              </div>

              {/* Spin Trigger Button */}
              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  onClick={handleDemoSpin}
                  disabled={spinning}
                  size="lg"
                  className="bg-slate-950 text-white px-8 font-semibold hover:bg-slate-800 shadow-md"
                >
                  <RotateCw className={`size-4 mr-2 ${spinning ? 'animate-spin' : ''}`} />
                  <span>{spinning ? 'Spinning...' : 'Spin Demo Wheel'}</span>
                </Button>

                {/* Winner Card */}
                {winner && (
                  <div className="animate-in fade-in zoom-in-95 duration-200 mt-2 flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-slate-900 shadow-xs">
                    <Trophy className="size-5 text-slate-950" />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected Winner</span>
                      <p className="text-base font-bold text-slate-950">{winner} (1st Place)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hint */}
            <p className="mt-4 text-xs text-slate-500">
              The full app supports up to thousands of names, multiple winners, duplicate policies, and history saving.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Enterprise Grade Simplicity</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Engineered for Complete Fairness
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Every feature is built around reliability, user privacy, and zero surprises during live events.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-slate-300">
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white transition-transform duration-300 group-hover:scale-110">
                <Database className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">100% Offline-First Storage</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                IndexedDB on the web and SQLite on mobile ensure all your data stays stored strictly on your local device.
                No network connection required after initial load.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-slate-300">
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white transition-transform duration-300 group-hover:scale-110">
                <Cpu className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">Cryptographic Randomness</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Uses the browser’s built-in <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800">crypto.getRandomValues</code> API.
                Eliminates algorithmic bias and guarantees uniform probability for every entry.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-slate-300">
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white transition-transform duration-300 group-hover:scale-110">
                <Award className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">Multi-Winner Draws</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Draw 1st place, then continue for 2nd, 3rd, and beyond. Configure whether winners stay in the pool
                or are removed from future spins in that session.
              </p>
            </div>

            {/* Card 4 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-slate-300">
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white transition-transform duration-300 group-hover:scale-110">
                <FileSpreadsheet className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">Excel, CSV & TXT Import</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Import large rosters effortlessly. Smart column detection, automated duplicate handling,
                and instant name normalization without third-party services.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-slate-300">
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white transition-transform duration-300 group-hover:scale-110">
                <Layers className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">Tamper-Proof History</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Finished draws create an immutable snapshot with timestamp, participant roster, rules, and winners.
                Future edits to projects do not alter past history.
              </p>
            </div>

            {/* Card 6 */}
            <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-slate-300">
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white transition-transform duration-300 group-hover:scale-110">
                <Globe className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">Bilingual: English & বাংলা</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Complete localized user interface with Bengali numerals, localized dates, and bundled web fonts
                (Inter and Noto Sans Bengali) without external CDN requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative border-y border-slate-200 bg-slate-50 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Step-by-Step</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              How Pickzy Works
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              Three simple steps from participant roster to winning celebration.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-md hover:border-slate-300">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Step 01</span>
              <div className="mt-4 flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-950">
                <Users className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">Create & Add Names</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Name your project and paste participants or upload an Excel, CSV, or TXT file. Pickzy cleans whitespace and detects duplicates.
              </p>
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-md hover:border-slate-300">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Step 02</span>
              <div className="mt-4 flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-950">
                <Play className="size-5 fill-current" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">Spin & Pick Winner</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Hit Spin. The winner is cryptographically computed and saved first, then visualized with a smooth physics-based wheel animation.
              </p>
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-md hover:border-slate-300">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Step 03</span>
              <div className="mt-4 flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-950">
                <Trophy className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">Record & Celebrate</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Celebrate with confetti, continue spinning for 2nd or 3rd place, and store a permanent frozen record in your local History tab.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Spotlight Section */}
      <section id="mobile-app" className="relative py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800">
                  <Smartphone className="size-3.5" />
                  <span>Cross-Platform Monorepo</span>
                </div>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  Pickzy on Your Phone & Desktop
                </h2>
                <p className="mt-3 text-slate-600 leading-relaxed">
                  The Pickzy ecosystem includes both this Next.js web portal and the native Expo React Native mobile app.
                  Take it anywhere—flights, outdoor events, classrooms, or conferences with zero cell service.
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
                    <CheckCircle2 className="size-4 text-slate-950" />
                    <span>Native SQLite on iOS and Android</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
                    <CheckCircle2 className="size-4 text-slate-950" />
                    <span>Haptic feedback and 60 FPS smooth physics</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
                    <CheckCircle2 className="size-4 text-slate-950" />
                    <span>Web portal runs on all modern browsers with IndexedDB</span>
                  </li>
                </ul>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
                    <Link href="/app" className="inline-flex items-center gap-2">
                      <span>Open Web Version</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-100">
                    <a href="https://github.com/AbdullahAlMaksud/pickzy-monorepo" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                      <Download className="size-4" />
                      <span>Monorepo Repository</span>
                    </a>
                  </Button>
                </div>
              </div>

              {/* Mockup visual */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-xs rounded-3xl border-4 border-slate-900 bg-slate-950 p-3 shadow-2xl animate-float-gentle transition-shadow duration-300 hover:shadow-3xl">
                  {/* Phone Speaker Notch */}
                  <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-slate-700" />
                  <div className="rounded-2xl border border-slate-800 bg-white p-4 text-slate-950">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold tracking-tight">Pickzy Mobile</span>
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-2 text-center">
                      <BrandMark className="size-12" />
                      <span className="text-sm font-bold">Annual Raffle Draw</span>
                      <span className="text-xs text-slate-500">24 Participants · Round 1</span>
                    </div>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                      <span className="text-xs font-medium text-slate-500">Winner:</span>
                      <p className="text-sm font-bold text-slate-950">Ayesha Rahman</p>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <div className="w-full rounded-lg bg-slate-950 py-2 text-center text-xs font-semibold text-white transition-transform active:scale-95">
                        Spin Next Winner
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="relative border-t border-slate-200 bg-slate-50 py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">The Pickzy Difference</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Why Choose Pickzy?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-600 text-sm sm:text-base">
              Unlike generic ad-packed online wheel spinners, Pickzy is built strictly with user privacy and integrity first.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-100/70 text-slate-900 font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Feature</th>
                  <th className="py-3.5 px-4 sm:px-6 text-slate-950 font-extrabold">Pickzy</th>
                  <th className="py-3.5 px-4 sm:px-6 text-slate-500 font-normal">Typical Online Wheels</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">Privacy & Tracking</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-950 font-semibold">100% Offline (Zero trackers)</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">Ad trackers & cookie profiling</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">Advertisements</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-950 font-semibold">Zero Ads</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">Full page banners & video ads</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">Randomness Algorithm</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-950 font-semibold">crypto.getRandomValues</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">Basic Math.random() or non-verifiable</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">Multi-Winner Support</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-950 font-semibold">1st, 2nd, 3rd place with rules</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">Single winner / manual delete</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">Bulk Rosters</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-950 font-semibold">Excel (.xlsx), CSV, TXT</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">Manual copy paste only</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">License & Cost</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-950 font-semibold">100% Free & Open Source</td>
                  <td className="py-3.5 px-4 sm:px-6 text-slate-500">Subscription / Paywalled tiers</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Got Questions?</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {[
              {
                q: 'Do I need an internet connection to use Pickzy?',
                a: 'No. Once you load the web application or install the mobile app, Pickzy works completely offline. All rosters, draw rules, and history snapshots are saved directly on your local device.',
              },
              {
                q: 'Are participant names ever sent to a server?',
                a: 'Never. Pickzy has zero backend databases or telemetry. Your files, participant lists, and draw results remain entirely in your device storage (IndexedDB on web, SQLite on mobile).',
              },
              {
                q: 'How does the multi-winner system work?',
                a: 'When you initiate a draw with multiple winners, Pickzy spins for 1st place, announces the winner, and lets you continue spinning for 2nd place, 3rd place, and beyond. You can configure whether previous winners are removed from the wheel.',
              },
              {
                q: 'What file formats can I import?',
                a: 'Pickzy supports Microsoft Excel (.xlsx), Comma-Separated Values (.csv), and plain text (.txt) files. You can choose columns and automatically exclude duplicates.',
              },
              {
                q: 'Is Pickzy available in Bengali (বাংলা)?',
                a: 'Yes. Pickzy features complete Bengali language localization including Bengali numeral formatting, localized draw dates, and tailored UI terminology.',
              },
              {
                q: 'How does Pickzy guarantee fairness?',
                a: 'Pickzy utilizes the cryptographic random number generator (crypto.getRandomValues) provided by the host platform to ensure statistically uniform and unbiased outcomes.',
              },
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between p-4 text-left font-semibold text-slate-950 hover:text-slate-700 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`size-4 shrink-0 text-slate-500 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180 text-slate-950' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200 px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="relative px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-950 p-8 sm:p-14 text-center text-white shadow-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
            <Zap className="size-3.5 text-amber-400" />
            <span>Ready in Seconds</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Ready to Make Your Next Draw Fair & Fun?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400 text-sm sm:text-base">
            No signup, no credit card, no ads. Open the web portal or explore the mobile project directly.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-slate-950 font-semibold hover:bg-slate-100">
              <Link href="/app" className="inline-flex items-center gap-2">
                <span>Launch Web Portal</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-800 bg-transparent text-white hover:bg-slate-900">
              <Link href="/privacy">Read Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 text-sm text-slate-600">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandMark className="size-6" />
            <span className="font-bold text-slate-950 text-base">Pickzy</span>
            <span className="text-xs text-slate-400">· Offline-First Winner Picker</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
            <Link href="/app" className="hover:text-slate-950">
              Web Portal
            </Link>
            <Link href="/projects" className="hover:text-slate-950">
              Projects
            </Link>
            <Link href="/history" className="hover:text-slate-950">
              History
            </Link>
            <Link href="/privacy" className="hover:text-slate-950">
              Privacy Policy
            </Link>
            <a
              href="https://github.com/AbdullahAlMaksud/pickzy-monorepo"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-950"
            >
              GitHub Monorepo
            </a>
          </div>

          <p className="text-xs text-slate-400">
            Pickzy Ecosystem · Built with Next.js 16, React 19 & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
