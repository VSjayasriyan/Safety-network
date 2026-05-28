"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Bot,
  Building2,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Contact,
  Download,
  Folder,
  Info,
  LayoutDashboard,
  Map,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserCog
} from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: ShieldCheck },
  { href: "/live-map", label: "Live Map", icon: Map },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/nearby", label: "Nearby", icon: Building2 },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/admin", label: "Admin", icon: UserCog },
  { href: "/about", label: "About", icon: Info }
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#05060a] text-zinc-100">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-14 border-r border-[#302033] bg-[#07070d] xl:flex xl:flex-col xl:items-center">
        <div className="mt-4 flex h-5 w-8 items-center justify-between">
          <span className="size-4 rounded-full bg-[#ff5b66]" />
          <span className="size-4 rounded-full bg-zinc-700" />
          <span className="size-4 rounded-full bg-[#58d86d]" />
        </div>
        <nav className="mt-28 flex flex-1 flex-col items-center gap-4 text-rose-500">
          {[Search, ChartNoAxesCombined, LayoutDashboard, Bot, Bell, Settings].map((Icon, index) => (
            <button key={index} className="grid size-9 place-items-center rounded-md transition hover:bg-white/10 hover:text-rose-300" aria-label={`Browser tool ${index + 1}`}>
              <Icon size={18} />
            </button>
          ))}
        </nav>
        <div className="mb-5 grid gap-4 text-xs font-semibold text-rose-500">
          <span>GX</span>
          <Menu size={18} />
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#2b1422] bg-[#07070d] xl:left-14">
        <div className="flex h-14 items-center gap-3 px-4">
          <div className="hidden items-center gap-3 text-zinc-400 md:flex">
            <ChevronLeft size={20} />
            <ChevronRight size={20} />
            <span className="grid size-8 place-items-center rounded-full border border-zinc-700">
              <ShieldAlert size={16} />
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[#372034] bg-[#0c0c13] px-3 py-2 text-sm text-zinc-400">
            <span className="truncate">suraksha.earth/workspace/@responder-command/overview</span>
          </div>
          <div className="hidden items-center gap-3 text-zinc-400 sm:flex">
            <Sparkles size={18} className="text-[#9fbfff]" />
            <Download size={18} />
            <button
              aria-label="Toggle color mode"
              onClick={() => setDark((value) => !value)}
              className="grid size-8 place-items-center rounded-md border border-white/10 bg-white/[0.04]"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-14 xl:pl-14">
        <aside className="hidden w-[300px] shrink-0 border-r border-white/5 bg-[#18191b] p-5 lg:block">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-[radial-gradient(circle_at_32%_28%,#e7f1ff_0_14%,#8fb4ff_15%_34%,#5f86ee_35%_56%,#2f64ba_57%_100%)] shadow-[0_0_28px_rgba(76,132,255,.28)]">
              <ShieldCheck size={23} className="text-white" />
            </span>
            <span className="text-3xl font-semibold tracking-normal">Suraksha Earth</span>
          </Link>

          <button className="mt-10 inline-flex items-center gap-3 rounded-[18px] bg-[#393c40] px-7 py-5 text-lg font-semibold text-white shadow-[0_18px_36px_rgba(0,0,0,.26)]">
            <Plus size={24} />
            New
          </button>

          <nav className="mt-6 space-y-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 rounded-full px-6 py-4 text-[15px] font-medium transition ${
                  pathname === href ? "bg-[#205a91] text-[#d6e9ff]" : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon size={21} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-7 left-[calc(3.5rem+1.25rem)] hidden w-[260px] xl:block">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 font-semibold text-white"><Folder size={18} /> Storage</span>
              <Info size={17} className="text-zinc-400" />
            </div>
            <div className="h-1.5 rounded-full bg-zinc-700">
              <div className="h-1.5 w-[72%] rounded-full bg-[#3f7bff]" />
            </div>
            <p className="mt-3 text-sm text-zinc-400">720 MB of 1 GB used</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-[#151617]">
          <div className="sticky top-14 z-30 flex min-h-[90px] flex-col gap-4 border-b border-white/5 bg-[#202123]/96 px-5 py-4 backdrop-blur md:flex-row md:items-center md:px-7">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={22} />
              <input className="h-14 w-full rounded-full border border-transparent bg-[#303234] pl-14 pr-5 text-lg text-white outline-none placeholder:text-zinc-400 focus:border-[#356fa8]" placeholder="Search emergency layers" />
            </div>
            <div className="ml-auto flex items-center gap-4">
              <button className="inline-flex h-12 items-center gap-2 rounded-full bg-[#215b93] px-5 font-semibold text-[#d7ebff]">
                <Map size={18} />
                Explore map
              </button>
              <button className="grid size-11 place-items-center rounded-full text-zinc-300 hover:bg-white/10" aria-label="Settings">
                <Settings size={23} />
              </button>
              <div className="hidden text-sm leading-tight md:block">
                <p className="font-semibold">Standard</p>
                <p className="text-[#a9caff]">Upgrade now</p>
              </div>
              <span className="grid size-11 place-items-center rounded-full bg-[#e9613b] font-bold text-white"><User size={20} /></span>
            </div>
          </div>
          <main className="px-4 py-5 md:px-6 lg:px-7">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#101113]/95 px-2 py-2 lg:hidden">
        {links.slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] text-zinc-300">
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
