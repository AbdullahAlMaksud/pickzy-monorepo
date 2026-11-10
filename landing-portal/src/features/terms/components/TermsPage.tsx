'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  Scale,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { BrandMark } from '@/components/shared/BrandMark';
import { Button } from '@/components/ui/button';

export function TermsPage() {
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
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex border-slate-300 text-slate-800 hover:bg-slate-100">
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
            <Button asChild size="sm" className="bg-slate-950 text-white hover:bg-slate-800">
              <Link href="/app">Open Web App</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-800">
            <Scale className="size-3.5 text-slate-950" />
            <span>Terms of Service & Ethical Commitment</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-base text-slate-600 sm:text-lg leading-relaxed">
            Please read these Terms of Service carefully before using Pickzy. By accessing or using our web portal, mobile applications, or source code, you agree to be bound by these terms and our ethical use commitment.
          </p>
          <p className="mt-2 text-xs font-medium text-slate-400">
            Effective Date: November 2026 · Version 2.0
          </p>
        </div>

        {/* Terms at a Glance Banner */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
            <FileText className="size-5 text-slate-950" />
            <span>Key Principles at a Glance</span>
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-slate-950" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Fair & Positive Purpose</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Pickzy is designed for giveaways, classroom selections, sports teams, events, and transparent decision-making.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-slate-950" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Gambling & Betting Forbidden</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Using Pickzy for monetary wagering, sports betting, gambling, or illicit activities is strictly prohibited.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <WifiOff className="mt-0.5 size-5 shrink-0 text-slate-950" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">100% Offline & Private</h3>
                <p className="text-xs text-slate-600 mt-1">
                  All randomness, data, and participant rosters remain exclusively on your local hardware device.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
              <Lock className="mt-0.5 size-5 shrink-0 text-slate-950" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">No Account Required</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Free and open to use with zero registration, zero subscription fees, and no user profiling.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="mt-12 space-y-10 text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">1. Acceptance of Terms</h2>
            <p className="text-sm sm:text-base">
              These Terms of Service constitute a legally binding agreement between you and the Pickzy open-source project.
              By loading, installing, or interacting with the Pickzy web portal or mobile applications, you confirm that you have read,
              understood, and accepted these terms in full. If you disagree with any portion of these terms, you must discontinue using Pickzy immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">2. Intended Purpose & Ethical Commitment</h2>
            <p className="text-sm sm:text-base">
              Pickzy is created purely for positive, educational, constructive, and entertaining group activities.
              Permitted and encouraged use cases include:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm sm:text-base text-slate-600">
              <li>Random winner selection for verified promotional giveaways, raffles, and community contests.</li>
              <li>Classroom education, such as selecting students for questions, team presentations, or group projects.</li>
              <li>Workplace organization, agile scrum standups, task assignment, and meeting icebreakers.</li>
              <li>Friendly recreational decisions, board games, chore distribution, and family activities.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">3. Strict Anti-Gambling & Prohibited Use Policy</h2>
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-950">
                <ShieldAlert className="size-4 text-rose-600" />
                <span>Zero Tolerance for Wagering and Unlawful Activities</span>
              </div>
              <p className="text-sm text-rose-900">
                Using Pickzy for betting, wagering, gambling, casino gaming, or any activity prohibited under applicable law or religious ethical standards (including gambling prohibited in Islam) is strictly forbidden.
              </p>
            </div>
            <p className="text-sm sm:text-base mt-3">
              You agree that you will NOT use Pickzy to:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm sm:text-base text-slate-600">
              <li>Facilitate real-money or digital-currency wagering, betting pools, or lottery schemes.</li>
              <li>Conduct unfair, deceptive, or rigged contests where outcomes are misrepresented to participants.</li>
              <li>Violate local, national, or international gaming and contest regulations.</li>
              <li>Harass, exploit, or infringe upon the privacy rights of participants whose names you load into the tool.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">4. Algorithmic Fairness & Randomness</h2>
            <p className="text-sm sm:text-base">
              Pickzy incorporates cryptographic pseudo-random number generation (<code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-900">crypto.getRandomValues</code> in browsers and secure system entropy on mobile devices) to provide uniform probability across all participants.
              The application contains zero backdoor mechanisms, weighting manipulation, or hidden ranking algorithms.
              However, because all calculations occur on your local device, the operator of the device is solely responsible for ensuring that participant rosters and contest rules are presented truthfully to participants.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">5. Data Custody & Offline Operations</h2>
            <p className="text-sm sm:text-base">
              Pickzy does not operate remote database servers, accounts, or cloud backups.
              All data entered into the application—including participant names, imported files, project titles, and draw histories—is stored exclusively within your local device memory and storage engines (IndexedDB on web, SQLite on mobile).
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-sm sm:text-base text-slate-600">
              <li>You are solely responsible for backing up, exporting, and managing your local data.</li>
              <li>Clearing browser cache or uninstalling the application will permanently erase all local records. Pickzy cannot restore lost local data.</li>
              <li>Pickzy holds zero liability for data loss resulting from browser clearing, device damage, or operating system resets.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">6. Contest Compliance & User Responsibility</h2>
            <p className="text-sm sm:text-base">
              If you use Pickzy to administer a public giveaway, lottery, or competition, you are solely responsible for ensuring compliance with all applicable local sweepstakes, giveaway, tax, and consumer protection laws.
              Pickzy provides the software utility only; it does not sponsor, administer, endorse, or verify any third-party contest or prize fulfillment.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">7. Intellectual Property & Open Source License</h2>
            <p className="text-sm sm:text-base">
              Pickzy is open-source software distributed under the terms of the project’s open-source license.
              You may inspect, audit, fork, and build upon the source code in accordance with the repository license terms.
              The name Pickzy, official logos, and branding assets are trademarks of the project maintainers and may not be used to endorse unrelated commercial products without permission.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">8. Disclaimer of Warranties</h2>
            <p className="text-sm sm:text-base">
              PICKZY IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              THE PROJECT MAINTAINERS DO NOT WARRANT THAT THE SOFTWARE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY IMMUNE FROM CLIENT-SIDE BROWSER INCONSISTENCIES.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">9. Limitation of Liability</h2>
            <p className="text-sm sm:text-base">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE DEVELOPERS, MAINTAINERS, OR CONTRIBUTORS OF PICKZY BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO YOUR USE OF OR INABILITY TO USE THE APPLICATION, INCLUDING ANY CONTEST DISPUTES, PRIZE CLAIMS, OR LOSS OF DATA.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">10. Modifications to Terms</h2>
            <p className="text-sm sm:text-base">
              We reserve the right to revise or update these Terms of Service periodically. Any modifications will be reflected with an updated effective date on this page.
              Your continued use of Pickzy after changes are published constitutes your acceptance of the revised terms.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-950">11. Contact & Repository</h2>
            <p className="text-sm sm:text-base">
              For questions regarding these Terms of Service or to inspect the open-source implementation, please visit our official repository:
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

        {/* Bottom Navigation */}
        <div className="mt-14 border-t border-slate-200 pt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50">
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="size-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-slate-600 hover:text-slate-950">
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
          </div>

          <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
            <Link href="/app">Open Web Portal</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 text-sm text-slate-600 text-center">
        <p className="text-xs text-slate-400">
          Pickzy · 100% Offline-First Random Winner Picker · Ethical & Fair Decision Platform
        </p>
      </footer>
    </div>
  );
}

