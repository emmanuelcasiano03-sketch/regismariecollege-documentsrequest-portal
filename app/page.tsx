import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  CreditCard,
  FileText,
  MapPin,
  QrCode,
  ShieldCheck,
  UserCheck,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("name, description, fee")
    .eq("is_active", true)
    .order("fee", { ascending: true });

  const docs = documents ?? [];

  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Image src="/rmclogo.jpg" alt="Regis Marie College" width={32} height={32} className="rounded-lg" />
            </div>
            <div>
              <p className="text-base font-bold leading-tight text-white">Regis Marie College</p>
              <p className="text-xs text-brand-200">Document Request System</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-brand-100 md:flex">
            <Link href="#how-it-works" className="transition-colors hover:text-white">How it works</Link>
            <Link href="#documents" className="transition-colors hover:text-white">Documents</Link>
            <Link href="#contact" className="transition-colors hover:text-white">Contact</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/register"
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-brand-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-brand-950 transition-colors hover:brightness-110"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600">
        <div
          className="pointer-events-none absolute inset-0 bg-center bg-cover opacity-[0.06]"
          style={{ backgroundImage: "url('/wildd.jpg')" }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="mb-4 text-sm font-bold tracking-[0.18em] text-gold">RMC WILDCATS</p>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Request your academic documents,{" "}
              <span className="text-gold">fully online</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-200">
              Transcripts, certificates, and diplomas. Submit a request, pay via
              GCash or walk-in, and track it from pending to pickup — no more
              lining up at the registrar&apos;s window.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-brand-950 shadow-lg shadow-brand-950/20 transition hover:brightness-110"
              >
                <ClipboardCheck className="h-4 w-4" />
                Get Started
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
              >
                Sign in to your account
              </Link>
            </div>
          </div>

          <div className="w-full lg:max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-brand-200">
                How it works
              </p>
              <ol className="space-y-4">
                {[
                  { step: "1", text: "Register your student or alumni account" },
                  { step: "2", text: "Submit a document request and pay via GCash or walk-in" },
                  { step: "3", text: "Track your request in real-time until pickup" },
                ].map((s) => (
                  <li key={s.step} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-brand-950">
                      {s.step}
                    </span>
                    <p className="text-sm text-brand-100">{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            {
              Icon: QrCode,
              title: "Pay online via GCash",
              desc: "Scan the QR code and upload your payment proof — the registrar verifies it in one click.",
            },
            {
              Icon: MapPin,
              title: "Track your request",
              desc: "Every status change is logged and shown on your dashboard, with an email to match.",
            },
            {
              Icon: ShieldCheck,
              title: "Secure & role-based",
              desc: "Student, registrar, guidance, and admin portals with approvals built in for Good Moral and diplomas.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                <f.Icon className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="text-lg font-semibold text-brand-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Documents & fees */}
      <section id="documents" className="border-y border-brand-100 bg-brand-50/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-brand-600">Documents</p>
            <h2 className="text-3xl font-bold text-brand-900">What can you request?</h2>
            <p className="mt-2 text-slate-500">
              Select one or more documents when you submit a request. Fees are
              confirmed each semester by the registrar&apos;s office.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((d) => (
              <div key={d.name} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-brand-500" />
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">
                    ₱{Number(d.fee).toFixed(2)}
                  </span>
                </div>
                <h3 className="font-semibold text-brand-900">{d.name}</h3>
                {d.description && <p className="mt-1 text-sm text-slate-500">{d.description}</p>}
              </div>
            ))}
            {docs.length === 0 && (
              <p className="text-sm text-slate-400">Document list is being updated.</p>
            )}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand-900 px-8 py-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Ready to request a document?</h2>
            <p className="mt-1 text-brand-200">
              Create an account and your requests will be on their way in minutes.
            </p>
          </div>
          <Link
            href="/register"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-brand-950 transition hover:brightness-110"
          >
            <UserCheck className="h-4 w-4" />
            Create an account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-brand-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div>
            <p className="flex items-center gap-2 font-bold text-brand-900">
              <Clock className="h-4 w-4 text-brand-500" />
              Registrar&apos;s Office
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Regis Marie College · Registrar&apos;s office during office hours
            </p>
            <p className="text-sm text-slate-500">
              <BarChart3 className="mr-1 inline h-4 w-4 text-brand-400" />
              <CreditCard className="mr-1 inline h-4 w-4 text-brand-400" />
              GCash &amp; walk-in payments accepted
            </p>
          </div>
          <div className="text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} Regis Marie College. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}