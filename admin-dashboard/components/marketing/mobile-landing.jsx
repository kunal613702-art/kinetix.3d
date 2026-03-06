"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Boxes,
  DollarSign,
  Home,
  Mail,
  Menu,
  Package,
  Printer,
  Settings,
  Upload,
  UserCircle2,
  X
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home, emoji: "🏠" },
  { label: "Services", href: "/services", icon: Settings, emoji: "⚙️" },
  { label: "Materials", href: "/materials", icon: Package, emoji: "📦" },
  { label: "Pricing", href: "/pricing", icon: DollarSign, emoji: "💲" }
];

export function MobileLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1563453392212-326f5e854473?q=80&w=1600&auto=format&fit=crop')"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      <header className="sticky top-0 z-40 border-b border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            Kinetix3D
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10"
              aria-label="Open dashboard"
            >
              <UserCircle2 size={19} />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      <aside
        className={`fixed inset-0 z-50 transition ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/45 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 h-full w-[82%] max-w-sm border-l border-white/20 bg-slate-950/90 p-5 backdrop-blur-xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-lg font-semibold">Menu</p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25"
            >
              <X size={16} />
            </button>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <span>{item.emoji}</span>
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="relative z-10 flex min-h-[calc(100vh-73px)] flex-col justify-between px-4 pb-4 pt-8 md:px-6">
        <section className="mx-auto mt-8 w-full max-w-xl text-center">
          <h1 className="mx-auto max-w-[16ch] text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            PRINT YOUR IDEAS INTO REALITY
          </h1>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/upload"
              className="inline-flex min-w-48 items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/35"
            >
              <Upload size={16} />
              Upload STL
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-w-48 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-900 shadow-lg shadow-white/15"
            >
              <Mail size={16} />
              Contact Us
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-8 w-full max-w-2xl rounded-t-3xl border border-white/30 bg-white/90 p-4 text-slate-900 shadow-2xl">
          <div className="grid grid-cols-2 gap-3 overflow-x-auto sm:grid-cols-2">
            <article className="min-w-[158px] rounded-2xl bg-slate-100 p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-800">
                <Printer size={19} />
              </div>
              <h3 className="text-sm font-semibold">Our Services</h3>
              <p className="mt-1 text-xs text-slate-600">Prototyping &amp; Custom Parts</p>
            </article>
            <article className="min-w-[158px] rounded-2xl bg-slate-100 p-4 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-800">
                <Boxes size={19} />
              </div>
              <h3 className="text-sm font-semibold">Materials Guide</h3>
              <p className="mt-1 text-xs text-slate-600">PLA, ABS, Nylon, &amp; More</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
