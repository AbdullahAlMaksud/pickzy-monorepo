'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Database,
  FileCheck,
  HardDrive,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { BrandMark } from '@/components/shared/BrandMark';
import { Button } from '@/components/ui/button';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Grid background layer on pure white */}
      <div className="fixed inset-0 pointer-events-none bg-grid-subtle opacity-70" aria-hidden="true" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-950">
            <BrandMark className="size-8" />
            <span className="text-xl font-bold tracking-tight">Pickzy</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:text-slate-950">
              <Link href="/" className="inline-flex items-center gap-1.5">
                <ArrowLeft className="size-4" />
                <span>Home</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-slate-950 text-white hover:bg-slate-800">
              <Link href="/app">Open Web App</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <main className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800">
            <ShieldCheck className="size-3.5 text-slate-950" />
            <span>Privacy First Architecture</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-base text-slate-600 sm:text-lg leading-relaxed">
            Pickzy is designed with a strict offline-first philosophy. We do not collect, track, sell, or transmit any personal data.
            Everything you do stays on your device.
          </p>
          <p className="mt-2 text-xs font-medium text-slate-400">
            Effective Date: November 2026 · Version 2.0
          </p>
        </div>

        {/* Privacy at a Glance Banner */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
            <Shield className="size-5 text-slate-950" />
            <span>Privacy at a Glance</span>
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <WifiOff className="mt-0.5 size-5 shrink-0 text-slate-950" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Zero Cloud Uploads</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Participant lists, projects, and draw history are stored in your browser (IndexedDB) or phone (SQLite).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <Lock className="mt-0.5 size-5 shrink-0 text-slate-950" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">No Account or Sign-Up</h3>
                <p className="text-xs text-slate-600 mt-1">
                  You never need to provide an email, phone number, password, or profile information to use Pickzy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <FileCheck className="mt-0.5 size-5 shrink-0 text-slate-950" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Local File Parsing</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Imported Excel (.xlsx), CSV, and TXT files are processed entirely in memory on your computer.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-slate-950" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Zero Trackers & Ads</h3>
                <p className="text-xs text-slate-600 mt-1">
                  We use no advertising cookies, tracking beacons, Google Analytics, or third-party marketing SDKs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Policy Content */}
        <div className="mt-12 space-y-10 text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">1. Introduction & Philosophy</h2>
            <p className="text-sm sm:text-base">
              Pickzy is developed as an open, private utility for selecting random winners in drawings, raffles, classrooms,
              and giveaways. Unlike traditional web services that monetize user databases, Pickzy operates entirely on your client machine.
              We believe your events, participant names, and contact rosters are confidential and should never leave your hardware.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">2. Information We Never Collect</h2>
            <p className="text-sm sm:text-base">
              When using Pickzy on the web or mobile applications, we do NOT collect, store, or transmit:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm sm:text-base text-slate-600">
              <li>Names, phone numbers, or email addresses of you or your participants.</li>
              <li>IP addresses, device identifiers, or GPS location coordinates.</li>
              <li>Draw outcomes, winner identities, or project metadata.</li>
              <li>Imported spreadsheet contents, employee lists, or school rosters.</li>
              <li>Telemetry or behavioral tracking data.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">3. How Your Data Is Stored Locally</h2>
            <p className="text-sm sm:text-base">
              Pickzy saves your preferences (such as selected language, theme preference, and confetti animations),
              active projects, participants, and draw snapshots strictly using local device APIs:
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-950">
                <HardDrive className="size-4" />
                <span>Web Portal: IndexedDB & LocalStorage</span>
              </div>
              <p className="text-slate-600">
                All data is maintained locally in your browser’s IndexedDB database via Dexie.js. Data is isolated to your browser profile.
              </p>
              <div className="flex items-center gap-2 font-semibold text-slate-950 pt-2 border-t border-slate-100">
                <Database className="size-4" />
                <span>Mobile App: SQLite Database</span>
              </div>
              <p className="text-slate-600">
                The native mobile app persists data to an encrypted, app-sandboxed SQLite database on your mobile device.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">4. File Imports & Spreadsheet Processing</h2>
            <p className="text-sm sm:text-base">
              Pickzy provides one-click file import for Microsoft Excel (.xlsx), CSV, and TXT files.
              File parsing is conducted client-side using JavaScript in your browser’s local memory. The file contents are never
              transmitted across the network, and the raw file is discarded immediately after entries are normalized into your local database.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">5. Camera and Profile Photos</h2>
            <p className="text-sm sm:text-base">
              If you optionally assign an avatar photo to your profile, the image is compressed and stored as a base64 Data URL
              inside your browser’s local storage. Pickzy does not upload or transmit photo files to external servers or cloud buckets.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">6. Random Number Generation (RNG) Transparency</h2>
            <p className="text-sm sm:text-base">
              Fairness is central to Pickzy. We implement the standard Web Cryptography API (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-900">crypto.getRandomValues</code>)
              to select winners uniformly. The RNG execution occurs exclusively within your local hardware processor, ensuring no outside influence or server-side manipulation.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">7. Third-Party Services & Network Requests</h2>
            <p className="text-sm sm:text-base">
              The Pickzy web portal is self-contained:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm sm:text-base text-slate-600">
              <li><strong>Fonts:</strong> Inter and Noto Sans Bengali font files are bundled directly in the application build. No external Google Fonts API requests are initiated.</li>
              <li><strong>Libraries:</strong> All UI components, animation scripts, and state containers are bundled locally.</li>
              <li><strong>No CDNs:</strong> No runtime user scripts or analytics trackers are loaded from third-party advertising networks.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">8. Data Deletion & Your Rights</h2>
            <p className="text-sm sm:text-base">
              Since you hold complete physical custody of all data, you have total authority over its retention:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm sm:text-base text-slate-600">
              <li>You can delete individual projects, participants, or history records at any time directly within the app.</li>
              <li>Clearing your browser’s cookies and site data for the Pickzy domain instantly and irreversibly wipes all stored records from your machine.</li>
              <li>Uninstalling the mobile application removes all local SQLite files and stored preferences.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">9. Open Source Transparency</h2>
            <p className="text-sm sm:text-base">
              Pickzy is open-source software. You are welcome to inspect, verify, and audit every line of source code in the public repository
              to confirm that no tracking, backdoors, or network exfiltration exist.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">10. Contact & Community</h2>
            <p className="text-sm sm:text-base">
              If you have any questions or security inquiries regarding Pickzy’s offline architecture, please open an issue
              or reach out via our GitHub repository:
            </p>
            <p className="text-sm font-medium text-slate-900">
              <a
                href="https://github.com/AbdullahAlMaksud/pickzy-monorepo"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-slate-600"
              >
                https://github.com/AbdullahAlMaksud/pickzy-monorepo
              </a>
            </p>
          </section>
        </div>

        {/* Bottom CTA / Return Links */}
        <div className="mt-14 border-t border-slate-200 pt-8 flex flex-wrap items-center justify-between gap-4">
          <Button asChild variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50">
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" />
              <span>Back to Home</span>
            </Link>
          </Button>

          <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
            <Link href="/app">Open Web Portal</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 text-sm text-slate-600 text-center">
        <p className="text-xs text-slate-400">
          Pickzy · 100% Offline-First Random Winner Picker · Zero Trackers Guarantee
        </p>
      </footer>
    </div>
  );
}
