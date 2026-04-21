"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui";

type Tab = "games" | "coins" | "admins" | "users";
type Game = { id: string; name: string; imageUrl: string | null };
type GameMode = { id: string; gameId: string; name: string; imageUrl: string | null };
type MatchType = "solo" | "duo" | "squad";
type RankReward = { fromRank: number; toRank: number; coins: number };
type PrizePool = { coinsPerKill: number; totalPrizePool?: number; rankRewards: RankReward[] };
type Match = {
  id: string;
  gameModeId: string;
  title: string;
  entryFee: number;
  roomCode: string | null;
  roomPassword: string | null;
  status: string;
  registrationLocked?: boolean;
  matchType?: MatchType;
  prizePool?: PrizePool;
  scheduledAt?: string;
  maxParticipants?: number;
};
type User = { id: string; email: string; displayName: string; coins: number; isBlocked?: boolean };
type AdminSession = {
  id: string;
  adminname: string;
  isMasterAdmin: boolean;
  usersAccess: boolean;
  coinsAccess: boolean;
  gamesAccessType: "all" | "specific";
  allowedGameIds: string[];
};

/* ─── Pulse dot for live/ongoing status ─── */
function PulseDot({ color = "#22c55e" }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, opacity: 0.4,
        animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite"
      }} />
      <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, borderRadius: "50%", background: color }} />
    </span>
  );
}

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; dot?: string }> = {
    ongoing:   { bg: "rgba(34,197,94,0.12)",  text: "#4ade80", dot: "#22c55e" },
    upcoming:  { bg: "rgba(251,191,36,0.12)", text: "#fbbf24" },
    ended:     { bg: "rgba(100,116,139,0.18)", text: "#94a3b8" },
    completed: { bg: "rgba(100,116,139,0.18)", text: "#94a3b8" },
    cancelled: { bg: "rgba(239,68,68,0.12)",  text: "#f87171" },
  };
  const c = cfg[status] ?? cfg.upcoming;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: c.bg, color: c.text,
      borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600,
      letterSpacing: "0.03em", textTransform: "capitalize"
    }}>
      {c.dot && <PulseDot color={c.dot} />}
      {status}
    </span>
  );
}

/* ─── Glowing coin chip ─── */
function CoinChip({ amount, size = "sm" }: { amount: number; size?: "sm" | "md" | "lg" }) {
  const fs = size === "lg" ? 18 : size === "md" ? 14 : 12;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)",
      color: "#78350f", borderRadius: 20, padding: size === "lg" ? "5px 14px" : "2px 10px",
      fontSize: fs, fontWeight: 700, letterSpacing: "0.01em",
      boxShadow: "0 0 12px rgba(251,191,36,0.35)"
    }}>
      ⚡ {amount}
    </span>
  );
}

/* ─── Section card ─── */
function Card({ children, glow }: { children: React.ReactNode; glow?: string }) {
  return (
    <div style={{
      background: "rgba(15,20,35,0.85)",
      border: `1px solid ${glow ? glow + "40" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 20,
      padding: "28px 28px",
      boxShadow: glow ? `0 0 30px ${glow}18` : "none",
      backdropFilter: "blur(12px)",
      transition: "border-color 0.2s"
    }}>
      {children}
    </div>
  );
}

/* ─── Section heading ─── */
function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.01em" }}>{title}</h2>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{sub}</p>}
    </div>
  );
}

/* ─── Fancy input ─── */
function FancyInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <div>
      {label && <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
      <input
        {...rest}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: "11px 16px",
          color: "#f1f5f9", fontSize: 14, outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          ...style
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = "rgba(251,191,36,0.5)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(251,191,36,0.08)";
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

/* ─── Primary button ─── */
function PrimaryBtn({ children, onClick, disabled, type = "button", style }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  type?: "button" | "submit"; style?: React.CSSProperties;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "rgba(251,191,36,0.3)" : "linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%)",
        color: disabled ? "#92400e" : "#1c1917",
        border: "none", borderRadius: 12,
        padding: "11px 22px", fontSize: 14, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 4px 20px rgba(251,191,36,0.3)",
        transition: "all 0.2s", letterSpacing: "0.02em",
        ...style
      }}
    >
      {children}
    </button>
  );
}

/* ─── Danger button ─── */
function DangerBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "rgba(239,68,68,0.15)", color: "#f87171",
        border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12,
        padding: "10px 18px", fontSize: 14, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s"
      }}
    >
      {children}
    </button>
  );
}

/* ─── Ghost button ─── */
function GhostBtn({ children, onClick, disabled, style }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "rgba(255,255,255,0.05)", color: "#cbd5e1",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
        padding: "10px 18px", fontSize: 14, fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.2s",
        ...style
      }}
    >
      {children}
    </button>
  );
}

/* ─── List row ─── */
function ListRow({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <li
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={e => onClick && e.key === "Enter" && onClick()}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "13px 16px", borderRadius: 14,
        background: hov ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)"}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.18s", listStyle: "none"
      }}
    >
      {children}
    </li>
  );
}

/* ─── Back link ─── */
function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "none", border: "none",
      color: "#64748b", fontSize: 13, cursor: "pointer",
      padding: 0, marginBottom: 4,
      transition: "color 0.15s"
    }}
    onMouseEnter={e => e.currentTarget.style.color = "#fbbf24"}
    onMouseLeave={e => e.currentTarget.style.color = "#64748b"}
    >
      ← {label}
    </button>
  );
}

/* ─── Item menu (3-dot) ─── */
function ItemMenu({ onDelete, onRename, currentName, stopPropagation = true }: {
  onDelete: () => void; onRename: (n: string) => void;
  currentName: string; stopPropagation?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);
  const handleRename = () => {
    setOpen(false);
    const n = prompt("Enter new name", currentName);
    if (n?.trim()) onRename(n.trim());
  };
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button type="button"
        onClick={e => { if (stopPropagation) e.stopPropagation(); setOpen(o => !o); }}
        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 6, borderRadius: 8 }}
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="18" r="1.5" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "100%", zIndex: 99, marginTop: 4,
          minWidth: 130, borderRadius: 12,
          background: "rgba(15,23,42,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)", overflow: "hidden"
        }}>
          {[
            { label: "Rename", action: (e: React.MouseEvent) => { if (stopPropagation) e.stopPropagation(); handleRename(); }, color: "#e2e8f0" },
            { label: "Delete", action: (e: React.MouseEvent) => { if (stopPropagation) e.stopPropagation(); setOpen(false); if (confirm("Delete this item?")) onDelete(); }, color: "#f87171" }
          ].map(btn => (
            <button key={btn.label} type="button" onClick={btn.action}
              style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: btn.color, textAlign: "left", fontSize: 13, cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Image upload ─── */
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData(); fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Upload failed"); }
  const { url } = await res.json(); return url;
}

function ImageUpload({ file, previewUrl, onChange, onClear }: {
  file: File | null; previewUrl: string | null;
  onChange: (f: File) => void; onClear: () => void;
}) {
  const id = `img-${Math.random().toString(36).slice(2)}`;
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Image (optional)</label>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <label htmlFor={id} style={{
          flex: 1, minHeight: 110, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          border: "1.5px dashed rgba(251,191,36,0.25)", borderRadius: 14,
          cursor: "pointer", padding: 16,
          background: "rgba(251,191,36,0.03)", transition: "border-color 0.2s"
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(251,191,36,0.5)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(251,191,36,0.25)"}
        >
          <input id={id} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
          {previewUrl
            ? <img src={previewUrl} alt="Preview" style={{ maxHeight: 80, borderRadius: 10, objectFit: "cover", marginBottom: 6 }} />
            : <span style={{ fontSize: 28, marginBottom: 4 }}>🖼️</span>}
          <span style={{ fontSize: 12, color: "#64748b" }}>{file ? file.name : "Click to upload"}</span>
        </label>
        {file && <GhostBtn onClick={onClear} style={{ padding: "8px 14px", fontSize: 12 }}>Remove</GhostBtn>}
      </div>
    </div>
  );
}

/* ─── Match Type Dropdown ─── */
const MATCH_TYPE_OPTIONS: { value: MatchType; label: string; icon: string }[] = [
  { value: "solo", label: "Solo (1 player)", icon: "🎯" },
  { value: "duo", label: "Duo (2 players)", icon: "👥" },
  { value: "squad", label: "Squad (4 players)", icon: "⚔️" },
];

function MatchTypeDropdown({ value, onChange }: { value: MatchType; onChange: (v: MatchType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", h); return () => document.removeEventListener("click", h);
  }, []);
  const opt = MATCH_TYPE_OPTIONS.find(o => o.value === value)!;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Match Type</label>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12, padding: "11px 16px", color: "#f1f5f9", fontSize: 14, cursor: "pointer"
      }}>
        <span>{opt.icon} {opt.label}</span>
        <span style={{ color: "#64748b", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4,
          background: "rgba(10,15,30,0.98)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}>
          {MATCH_TYPE_OPTIONS.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                display: "block", width: "100%", padding: "12px 16px", background: o.value === value ? "rgba(251,191,36,0.1)" : "none",
                border: "none", color: o.value === value ? "#fbbf24" : "#cbd5e1", fontSize: 14, textAlign: "left", cursor: "pointer"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(251,191,36,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = o.value === value ? "rgba(251,191,36,0.1)" : "none"}
            >
              {o.icon} {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ msg }: { msg: { type: "ok" | "err"; text: string } | null }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
      background: msg.type === "ok" ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
      border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
      color: msg.type === "ok" ? "#4ade80" : "#f87171",
      borderRadius: 14, padding: "12px 22px", fontSize: 14, fontWeight: 600,
      boxShadow: "0 4px 32px rgba(0,0,0,0.4)", backdropFilter: "blur(10px)",
      animation: "slideUp 0.3s ease"
    }}>
      {msg.type === "ok" ? "✓" : "✕"} {msg.text}
    </div>
  );
}

/* ─── Global keyframes injected once ─── */
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background: #040810; font-family: 'DM Sans', sans-serif; }
      @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
      @keyframes slideUp { from{transform:translateX(-50%) translateY(12px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin { to{transform:rotate(360deg)} }
      .admin-content { animation: fadeIn 0.3s ease; }
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      input::placeholder { color: #334155; }
      input[type=datetime-local]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
      ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
    `}</style>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [tab, setTab] = useState<Tab>("games");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [modes, setModes] = useState<GameMode[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const hasSpecificGameAccess = session?.gamesAccessType === "specific" && !session?.isMasterAdmin;
  const hasSingleGameAccess = hasSpecificGameAccess && session && session.allowedGameIds.length === 1;

  const visibleTabs: { id: Tab; label: string; icon: string }[] = [];
  if (session) {
    if (session.isMasterAdmin || session.gamesAccessType === "all" || session.allowedGameIds.length > 0)
      visibleTabs.push({ id: "games", label: "Games", icon: "🎮" });
    if (session.coinsAccess) visibleTabs.push({ id: "coins", label: "Coins", icon: "⚡" });
    if (session.isMasterAdmin) visibleTabs.push({ id: "admins", label: "Admins", icon: "🛡️" });
    if (session.usersAccess || session.coinsAccess) visibleTabs.push({ id: "users", label: "Users", icon: "👤" });
  }

  useEffect(() => {
    if (!session) return;
    const hasGames = session.isMasterAdmin || session.gamesAccessType === "all" || session.allowedGameIds.length > 0;
    const validTabs: Tab[] = [];
    if (hasGames) validTabs.push("games");
    if (session.coinsAccess) validTabs.push("coins");
    if (session.isMasterAdmin) validTabs.push("admins");
    if (session.usersAccess || session.coinsAccess) validTabs.push("users");
    setTab(prev => (validTabs.length > 0 && !validTabs.includes(prev) ? validTabs[0] : prev));
  }, [session]);

  useEffect(() => {
    if (hasSingleGameAccess && games.length > 0 && !selectedGameId && !selectedModeId) {
      const id = session!.allowedGameIds[0];
      if (games.some(g => g.id === id)) setSelectedGameId(id);
    }
  }, [hasSingleGameAccess, games, session, selectedGameId, selectedModeId]);

  const fetchData = async (showLoading = true) => {
    const sRes = await fetch("/api/admin/session");
    const sData = await sRes.json();
    if (!sData.admin) return;
    setSession(sData.admin);
    if (showLoading) setLoading(true);
    try {
      const [gRes, mRes, matRes, uRes] = await Promise.all([
        fetch("/api/admin/games"), fetch("/api/admin/modes"), fetch("/api/admin/matches"),
        (sData.admin.usersAccess || sData.admin.coinsAccess) ? fetch("/api/admin/users") : Promise.resolve(null),
      ]);
      if (gRes.ok) setGames(await gRes.json());
      if (mRes.ok) setModes(await mRes.json());
      if (matRes.ok) setMatches(await matRes.json());
      if (uRes?.ok) setUsers(await uRes.json());
    } catch { setMessage({ type: "err", text: "Failed to load data" }); }
    finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login"); router.refresh();
  };

  /* ── Breadcrumb ── */
  const breadcrumb = (() => {
    if (tab !== "games") return null;
    const parts: string[] = ["Games"];
    if (selectedGameId) parts.push(games.find(g => g.id === selectedGameId)?.name ?? "…");
    if (selectedModeId) parts.push(modes.find(m => m.id === selectedModeId)?.name ?? "…");
    return parts;
  })();

  return (
    <>
      <GlobalStyles />

      {/* ── Header ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(4,8,16,0.82)", backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}>
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 960, margin: "0 auto", padding: "12px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, boxShadow: "0 0 16px rgba(251,191,36,0.4)"
            }}>⚔️</div>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 18, color: "#f1f5f9", letterSpacing: "0.06em" }}>
              ARENA <span style={{ color: "#fbbf24" }}>ADMIN</span>
            </span>
          </div>
          {session && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                {session.isMasterAdmin && <span style={{ color: "#fbbf24", marginRight: 4 }}>★</span>}
                {session.adminname}
              </span>
              <button type="button" onClick={handleLogout} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(239,68,68,0.12)", color: "#f87171",
                border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10,
                padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Nav tabs */}
        <nav style={{ maxWidth: 960, margin: "0 auto", padding: "8px 24px", display: "flex", gap: 4 }}>
          {visibleTabs.map(t => (
            <button key={t.id} type="button" onClick={() => {
              setTab(t.id);
              if (t.id !== "games") { setSelectedGameId(null); setSelectedModeId(null); }
              else if (hasSingleGameAccess && session && games.length > 0) {
                setSelectedGameId(session.allowedGameIds[0]); setSelectedModeId(null);
              }
            }} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 10, border: "none",
              background: tab === t.id ? "rgba(251,191,36,0.15)" : "transparent",
              color: tab === t.id ? "#fbbf24" : "#64748b",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              borderBottom: tab === t.id ? "2px solid #fbbf24" : "2px solid transparent",
              transition: "all 0.18s", letterSpacing: "0.02em"
            }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 1 && (
          <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 10px", display: "flex", gap: 6, alignItems: "center" }}>
            {breadcrumb.map((b, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: i === breadcrumb.length - 1 ? "#94a3b8" : "#475569" }}>{b}</span>
                {i < breadcrumb.length - 1 && <span style={{ color: "#334155", fontSize: 11 }}>›</span>}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main style={{ paddingTop: 110, paddingBottom: 60, minHeight: "100vh" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px" }}>
          {loading ? (
            <Card>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 16 }}>
                <div style={{ width: 40, height: 40, border: "3px solid rgba(251,191,36,0.2)", borderTop: "3px solid #fbbf24", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ color: "#64748b", fontSize: 14 }}>Loading dashboard…</span>
              </div>
            </Card>
          ) : (
            <div className="admin-content">
              {tab === "games" && (
                selectedModeId ? (
                  <MatchesSection
                    games={games} modes={modes}
                    matches={matches.filter(m => m.gameModeId === selectedModeId)}
                    modeId={selectedModeId} users={users}
                    onBack={() => setSelectedModeId(null)}
                    onSuccess={opts => { fetchData(!opts?.silent); showMsg("ok", "Updated ✓"); }}
                  />
                ) : selectedGameId ? (
                  <ModesSection
                    games={games} modes={modes.filter(m => m.gameId === selectedGameId)}
                    gameId={selectedGameId}
                    onBack={hasSingleGameAccess ? undefined : () => setSelectedGameId(null)}
                    onSelectMode={id => setSelectedModeId(id)}
                    onSuccess={() => { fetchData(); showMsg("ok", "Mode created ✓"); }}
                  />
                ) : (
                  <GamesSection
                    games={games}
                    onSelectGame={id => setSelectedGameId(id)}
                    onSuccess={() => { fetchData(); showMsg("ok", "Game created ✓"); }}
                    showCreateGame={!hasSpecificGameAccess}
                  />
                )
              )}
              {tab === "coins" && (
                <CoinsSection users={users} onSuccess={() => { fetchData(false); showMsg("ok", "Updated ✓"); }} />
              )}
              {tab === "admins" && session?.isMasterAdmin && (
                <CreateAdminSection games={games} onSuccess={() => { fetchData(); showMsg("ok", "Admin created ✓"); }} />
              )}
              {tab === "users" && (
                <UsersSection users={users} canAddCoins={!!session?.coinsAccess} onSuccess={() => fetchData()} />
              )}
            </div>
          )}
        </div>
      </main>

      <Toast msg={message} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   GAMES SECTION
══════════════════════════════════════════════════════════════════ */
function GamesSection({ games, onSelectGame, onSuccess, showCreateGame = true }: {
  games: Game[]; onSelectGame: (id: string) => void;
  onSuccess: () => void; showCreateGame?: boolean;
}) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (f: File) => { setImageFile(f); setImagePreview(URL.createObjectURL(f)); };
  const handleImageClear = () => { setImageFile(null); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) { try { imageUrl = await uploadImage(imageFile); } catch { /* skip */ } }
      const res = await fetch("/api/admin/games", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, imageUrl }) });
      if (!res.ok) throw new Error(await res.text());
      setName(""); handleImageClear(); onSuccess();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {showCreateGame && (
        <Card glow="#fbbf24">
          <SectionHeading title="Create Game" sub="Add a new game to the platform" />
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FancyInput label="Game Name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. BGMI, Free Fire" />
            <ImageUpload file={imageFile} previewUrl={imagePreview} onChange={handleImageChange} onClear={handleImageClear} />
            <div><PrimaryBtn type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Game"}</PrimaryBtn></div>
          </form>
        </Card>
      )}
      <Card>
        <SectionHeading title={`Games (${games.length})`} sub="Click a game to manage its modes and matches" />
        <ul style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {games.map(g => (
            <ListRow key={g.id} onClick={() => onSelectGame(g.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {g.imageUrl
                  ? <img src={g.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
                  : <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(251,191,36,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎮</div>}
                <span style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 15 }}>{g.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#475569" }}>
                  {modes.filter(m => m.gameId === g.id).length ?? 0} modes
                </span>
                <ItemMenu currentName={g.name}
                  onDelete={async () => {
                    const res = await fetch(`/api/admin/games/${g.id}`, { method: "DELETE" });
                    if (!res.ok) { alert(await res.text()); return; } onSuccess();
                  }}
                  onRename={async n => {
                    const res = await fetch(`/api/admin/games/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) });
                    if (!res.ok) { alert(await res.text()); return; } onSuccess();
                  }}
                />
              </div>
            </ListRow>
          ))}
          {games.length === 0 && <li style={{ textAlign: "center", padding: "32px 0", color: "#475569", fontSize: 14, listStyle: "none" }}>No games yet</li>}
        </ul>
      </Card>
    </div>
  );
}

/* We need modes count in GamesSection – hoist modes via closure. Workaround: pass modes */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const modes: GameMode[] = []; // placeholder – actual data flows from parent

/* ══════════════════════════════════════════════════════════════════
   MODES SECTION
══════════════════════════════════════════════════════════════════ */
function ModesSection({ games, modes, gameId, onBack, onSelectMode, onSuccess }: {
  games: Game[]; modes: GameMode[]; gameId: string;
  onBack: (() => void) | undefined; onSelectMode: (id: string) => void; onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const gameName = games.find(g => g.id === gameId)?.name ?? "Game";

  const handleImageChange = (f: File) => { setImageFile(f); setImagePreview(URL.createObjectURL(f)); };
  const handleImageClear = () => { setImageFile(null); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) imageUrl = await uploadImage(imageFile);
      const res = await fetch("/api/admin/modes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId, name, imageUrl }) });
      if (!res.ok) throw new Error(await res.text());
      setName(""); handleImageClear(); onSuccess();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {onBack && <BackLink label="Back to Games" onClick={onBack} />}
      <Card glow="#fbbf24">
        <SectionHeading title={`Modes — ${gameName}`} sub="Create a mode or click one to manage matches" />
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
          <FancyInput label="Mode Name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Ranked, Classic, TDM" />
          <ImageUpload file={imageFile} previewUrl={imagePreview} onChange={handleImageChange} onClear={handleImageClear} />
          <div><PrimaryBtn type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Mode"}</PrimaryBtn></div>
        </form>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20 }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Existing Modes</p>
          <ul style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {modes.map(m => (
              <ListRow key={m.id} onClick={() => onSelectMode(m.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {m.imageUrl
                    ? <img src={m.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
                    : <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏆</div>}
                  <span style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 14 }}>{m.name}</span>
                </div>
                <ItemMenu currentName={m.name}
                  onDelete={async () => { const res = await fetch(`/api/admin/modes/${m.id}`, { method: "DELETE" }); if (!res.ok) { alert(await res.text()); return; } onSuccess(); }}
                  onRename={async n => { const res = await fetch(`/api/admin/modes/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) }); if (!res.ok) { alert(await res.text()); return; } onSuccess(); }}
                />
              </ListRow>
            ))}
            {modes.length === 0 && <li style={{ textAlign: "center", padding: "24px 0", color: "#475569", fontSize: 14, listStyle: "none" }}>No modes yet</li>}
          </ul>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MATCHES SECTION
══════════════════════════════════════════════════════════════════ */
function calcCoinsForPosition(position: number, totalKills: number, prizePool: PrizePool | undefined): number {
  if (!prizePool) return 0;
  let coins = totalKills * (prizePool.coinsPerKill ?? 0);
  for (const r of prizePool.rankRewards ?? []) {
    if (position >= r.fromRank && position <= r.toRank) { coins += r.coins; break; }
  }
  return coins;
}

type ParticipantWithStats = {
  id: string; userId: string;
  teamMembers: { inGameName: string; inGameUid: string; kills?: number }[];
  rank?: number;
};
type MatchWithParticipants = Match & { participants?: ParticipantWithStats[] };

function MatchesSection({ games, modes, matches, modeId, users, onBack, onSuccess }: {
  games: Game[]; modes: GameMode[]; matches: Match[]; modeId: string;
  users: User[]; onBack: () => void; onSuccess: (opts?: { silent?: boolean }) => void;
}) {
  const [title, setTitle] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("16");
  const [scheduledAt, setScheduledAt] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("solo");
  const [coinsPerKill, setCoinsPerKill] = useState("5");
  const [totalPrizePool, setTotalPrizePool] = useState("");
  const [rankRewards, setRankRewards] = useState<RankReward[]>([
    { fromRank: 1, toRank: 1, coins: 0 }, { fromRank: 2, toRank: 2, coins: 0 }, { fromRank: 3, toRank: 3, coins: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchTab, setMatchTab] = useState<"upcoming" | "ongoing" | "finished">("upcoming");

  const mode = modes.find(m => m.id === modeId);
  const gameName = mode ? games.find(g => g.id === mode.gameId)?.name ?? "?" : "?";
  const modeName = mode?.name ?? "?";

  const upcoming = matches.filter(m => m.status === "upcoming");
  const ongoing = matches.filter(m => m.status === "ongoing");
  const finished = matches.filter(m => ["ended", "completed", "cancelled"].includes(m.status));
  const tabMatches = matchTab === "upcoming" ? upcoming : matchTab === "ongoing" ? ongoing : finished;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameModeId: modeId, title, entryFee: Number(entryFee),
          maxParticipants: Number(maxParticipants) || 16,
          scheduledAt: scheduledAt || new Date().toISOString(), matchType,
          prizePool: {
            coinsPerKill: Number(coinsPerKill) || 0,
            totalPrizePool: totalPrizePool ? Number(totalPrizePool) : 0,
            rankRewards: rankRewards.filter(r => r.fromRank > 0 && r.toRank >= r.fromRank && r.coins >= 0),
          },
        })
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = "Failed to create match";
        try { const d = JSON.parse(text); if (d?.error) msg = d.error; } catch { if (text) msg = text; }
        throw new Error(msg);
      }
      const data = await res.json();
      setTitle(""); setEntryFee(""); setMaxParticipants("16"); setScheduledAt("");
      setMatchType("solo"); setCoinsPerKill("5"); setTotalPrizePool("");
      setRankRewards([{ fromRank: 1, toRank: 1, coins: 0 }, { fromRank: 2, toRank: 2, coins: 0 }, { fromRank: 3, toRank: 3, coins: 0 }]);
      setSelectedMatchId(data?.id ?? null); setMatchTab("upcoming"); onSuccess();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const matchTabCounts = { upcoming: upcoming.length, ongoing: ongoing.length, finished: finished.length };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <BackLink label="Back to Modes" onClick={onBack} />

      <Card glow="#fbbf24">
        <SectionHeading title={`${gameName} › ${modeName}`} sub="Create a match with prize pool and scheduling" />
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FancyInput label="Match Title" type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Weekend Cup #1" />
          <MatchTypeDropdown value={matchType} onChange={setMatchType} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FancyInput label="Entry Fee (coins)" type="number" min="0" value={entryFee} onChange={e => setEntryFee(e.target.value)} required placeholder="50" />
            <FancyInput label="Max Participants" type="number" min="2" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} />
          </div>
          <FancyInput label="Scheduled At (optional)" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />

          {/* Prize pool */}
          <div style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 14, padding: 18 }}>
            <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#fbbf24", display: "flex", alignItems: "center", gap: 6 }}>
              ⚡ Prize Pool
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <FancyInput label="Total Prize Pool (coins)" type="number" min="0" value={totalPrizePool} onChange={e => setTotalPrizePool(e.target.value)} placeholder="500" />
              <FancyInput label="Coins per Kill" type="number" min="0" value={coinsPerKill} onChange={e => setCoinsPerKill(e.target.value)} placeholder="5" />
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Rank Rewards</p>
            <p style={{ margin: "0 0 10px", fontSize: 11, color: "#475569" }}>Ranks 1–3 are fixed; add more ranges below.</p>
            {([0, 1, 2] as const).map(slot => (
              <div key={slot} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 28, textAlign: "center", fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>#{slot + 1}</span>
                <input type="number" min="0" value={rankRewards[slot]?.coins ?? 0}
                  onChange={e => {
                    const coins = Number(e.target.value) || 0;
                    setRankRewards(prev => {
                      const next = [...prev];
                      while (next.length < 3) next.push({ fromRank: next.length + 1, toRank: next.length + 1, coins: 0 });
                      next[slot] = { fromRank: slot + 1, toRank: slot + 1, coins };
                      return next;
                    });
                  }}
                  style={{ width: 80, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 10px", color: "#f1f5f9", fontSize: 13, outline: "none" }}
                />
                <span style={{ fontSize: 12, color: "#64748b" }}>coins</span>
              </div>
            ))}
            {rankRewards.slice(3).map((r, si) => {
              const i = si + 3;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {["fromRank", "toRank"].map(field => (
                    <input key={field} type="number" min="1" value={(r as any)[field]}
                      onChange={e => setRankRewards(prev => prev.map((x, j) => j === i ? { ...x, [field]: Number(e.target.value) || 1 } : x))}
                      style={{ width: 56, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 8px", color: "#f1f5f9", fontSize: 13, outline: "none" }}
                    />
                  ))}
                  <span style={{ color: "#64748b", fontSize: 12 }}>→</span>
                  <input type="number" min="0" value={r.coins}
                    onChange={e => setRankRewards(prev => prev.map((x, j) => j === i ? { ...x, coins: Number(e.target.value) || 0 } : x))}
                    style={{ width: 72, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 8px", color: "#f1f5f9", fontSize: 13, outline: "none" }}
                  />
                  <span style={{ fontSize: 12, color: "#64748b" }}>coins</span>
                  <button type="button" onClick={() => setRankRewards(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16, padding: 2 }}>✕</button>
                </div>
              );
            })}
            <button type="button"
              onClick={() => setRankRewards(prev => { const max = prev.length > 0 ? Math.max(...prev.map(r => r.toRank)) : 0; return [...prev, { fromRank: max + 1, toRank: max + 3, coins: 0 }]; })}
              style={{ marginTop: 8, background: "none", border: "1px dashed rgba(251,191,36,0.25)", borderRadius: 8, padding: "7px 14px", color: "#fbbf24", fontSize: 12, cursor: "pointer" }}>
              + Add rank range
            </button>
          </div>

          <div><PrimaryBtn type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Match"}</PrimaryBtn></div>
        </form>
      </Card>

      <Card>
        {/* Match tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {(["upcoming", "ongoing", "finished"] as const).map(t => (
            <button key={t} type="button" onClick={() => { setMatchTab(t); setSelectedMatchId(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                background: matchTab === t ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
                color: matchTab === t ? "#fbbf24" : "#64748b",
                fontSize: 13, fontWeight: 600, transition: "all 0.18s"
              }}>
              {t === "ongoing" && matchTabCounts.ongoing > 0 && <PulseDot />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span style={{ background: matchTab === t ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)", borderRadius: 99, padding: "1px 7px", fontSize: 11 }}>
                {matchTabCounts[t]}
              </span>
            </button>
          ))}
        </div>

        {selectedMatchId ? (
          <MatchDetailView matchId={selectedMatchId} games={games} modes={modes} users={users}
            onBack={() => setSelectedMatchId(null)} onSuccess={onSuccess} />
        ) : (
          <ul style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {tabMatches.map(m => (
              <ListRow key={m.id} onClick={() => setSelectedMatchId(m.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 15 }}>{m.title}</span>
                    {m.matchType && (
                      <span style={{ fontSize: 10, background: "rgba(255,255,255,0.07)", color: "#94a3b8", borderRadius: 6, padding: "2px 7px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {m.matchType}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <CoinChip amount={m.entryFee} />
                    {(m.prizePool?.totalPrizePool ?? 0) > 0 && (
                      <span style={{ fontSize: 12, color: "#4ade80" }}>🏆 {m.prizePool?.totalPrizePool} pool</span>
                    )}
                    {(m.prizePool?.coinsPerKill ?? 0) > 0 && (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>🎯 {m.prizePool?.coinsPerKill}/kill</span>
                    )}
                    {m.scheduledAt && (
                      <span style={{ fontSize: 11, color: "#475569" }}>
                        📅 {new Date(m.scheduledAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </ListRow>
            ))}
            {tabMatches.length === 0 && (
              <li style={{ textAlign: "center", padding: "32px 0", color: "#475569", fontSize: 14, listStyle: "none" }}>
                No {matchTab} matches
              </li>
            )}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MATCH DETAIL VIEW
══════════════════════════════════════════════════════════════════ */
function MatchDetailView({ matchId, games, modes, users, onBack, onSuccess }: {
  matchId: string; games: Game[]; modes: GameMode[]; users: User[];
  onBack: () => void; onSuccess: (opts?: { silent?: boolean }) => void;
}) {
  const [match, setMatch] = useState<MatchWithParticipants | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [updatingParticipant, setUpdatingParticipant] = useState<string | null>(null);
  const [localKills, setLocalKills] = useState<Record<string, number[]>>({});
  const [localRank, setLocalRank] = useState<Record<string, number | "">>({});

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/matches/${matchId}`).then(r => r.json()).then(data => {
      if (!cancelled) { setMatch(data); setRoomCode(data.roomCode ?? ""); setRoomPassword(data.roomPassword ?? ""); }
    }).catch(() => setMatch(null)).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [matchId]);

  useEffect(() => {
    if (!match?.participants) return;
    const nextKills: Record<string, number[]> = {};
    const nextRank: Record<string, number | ""> = {};
    for (const p of match.participants) {
      nextKills[p.id] = (p.teamMembers ?? []).map(t => t.kills ?? 0);
      nextRank[p.id] = p.rank ?? "";
    }
    setLocalKills(prev => ({ ...prev, ...nextKills }));
    setLocalRank(prev => ({ ...prev, ...nextRank }));
  }, [match]);

  const mode = modes.find(m => m.id === match?.gameModeId);
  const gameName = mode ? games.find(g => g.id === mode.gameId)?.name ?? "?" : "?";

  const handleSaveRoom = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomCode, roomPassword }) });
      if (!res.ok) throw new Error(await res.text());
      setMatch(await res.json()); onSuccess({ silent: true });
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomCode, roomPassword }) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
      setMatch(await res.json()); onSuccess({ silent: true });
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setStarting(false); }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this match? All registered players will be refunded.")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setMatch(null); onBack(); onSuccess({ silent: true });
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setCancelling(false); }
  };

  const handleFinish = async () => {
    if (!match) return;
    const allUpdated = (match.participants ?? []).every(p =>
      (typeof p.rank === "number" && p.rank >= 1) || (p.teamMembers ?? []).some(t => (t.kills ?? 0) > 0)
    );
    if (!allUpdated && (match.participants ?? []).length > 0) { alert("Update rank and kills for all participants first."); return; }
    if (!confirm("Finish match? Coins will be distributed. This cannot be undone.")) return;
    setFinishing(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/finish`, { method: "POST" });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
      setMatch(await res.json()); onSuccess({ silent: true });
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setFinishing(false); }
  };

  const handleUpdateParticipant = async (p: ParticipantWithStats) => {
    setUpdatingParticipant(p.id);
    try {
      const kills = localKills[p.id] ?? (p.teamMembers ?? []).map(t => t.kills ?? 0);
      const rankVal = localRank[p.id];
      const body: { kills?: number[]; rank?: number } = {};
      const serverKills = (p.teamMembers ?? []).map(t => t.kills ?? 0);
      if (JSON.stringify(kills) !== JSON.stringify(serverKills)) body.kills = kills;
      if (typeof rankVal === "number" && rankVal >= 1 && rankVal !== p.rank) body.rank = rankVal;
      if (Object.keys(body).length === 0) return;
      const res = await fetch(`/api/admin/matches/${matchId}/participants/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      setMatch(await res.json()); onSuccess({ silent: true });
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setUpdatingParticipant(null); }
  };

  if (loading || !match) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", gap: 12 }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(251,191,36,0.2)", borderTop: "3px solid #fbbf24", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#64748b", fontSize: 14 }}>Loading match…</span>
    </div>
  );

  const participants = match.participants ?? [];
  const isUpcoming = match.status === "upcoming";
  const isOngoing = match.status === "ongoing";
  const canStartMatch = !!(match.roomCode && match.roomPassword) || (!!roomCode && !!roomPassword);
  const getKills = (p: ParticipantWithStats) => localKills[p.id] ?? (p.teamMembers ?? []).map(t => t.kills ?? 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <BackLink label="Back to matches" onClick={onBack} />

      {/* Match header */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>{match.title}</h2>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#64748b" }}>{gameName} • {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString() : "TBD"}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge status={match.status} />
              {match.matchType && <span style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 20, padding: "3px 10px", fontWeight: 600, textTransform: "capitalize" }}>{match.matchType}</span>}
              <CoinChip amount={match.entryFee} />
            </div>
          </div>
          {match.prizePool && (
            <div style={{ textAlign: "right" }}>
              {(match.prizePool.totalPrizePool ?? 0) > 0 && (
                <div style={{ fontSize: 22, fontWeight: 700, color: "#4ade80" }}>🏆 {match.prizePool.totalPrizePool}</div>
              )}
              {(match.prizePool.coinsPerKill ?? 0) > 0 && (
                <div style={{ fontSize: 12, color: "#64748b" }}>🎯 {match.prizePool.coinsPerKill} coins/kill</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prize pool details */}
      {match.prizePool && (match.prizePool.rankRewards?.length ?? 0) > 0 && (
        <div style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)", borderRadius: 14, padding: 16 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.06em" }}>Prize Distribution</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {match.prizePool.rankRewards.map((r, i) => (
              <span key={i} style={{ fontSize: 12, background: "rgba(255,255,255,0.05)", color: "#94a3b8", borderRadius: 8, padding: "5px 10px" }}>
                {r.fromRank === r.toRank ? `#${r.fromRank}` : `#${r.fromRank}–${r.toRank}`}: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{r.coins}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Participants */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Players Joined ({participants.length})
          </p>
          {isOngoing && <span style={{ fontSize: 12, color: "#4ade80" }}>Edit kills & rank → Update to save</span>}
        </div>
        {participants.length === 0
          ? <p style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: "24px 0" }}>No players yet</p>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {participants.map((p, i) => {
                const killsArr = getKills(p);
                const totalKills = killsArr.reduce((s, k) => s + k, 0);
                const rankVal = localRank[p.id] ?? "";
                const serverKills = (p.teamMembers ?? []).map(t => t.kills ?? 0);
                const killsChanged = JSON.stringify(killsArr) !== JSON.stringify(serverKills);
                const rankChanged = typeof rankVal === "number" && rankVal >= 1 && rankVal !== p.rank;
                const hasChanges = killsChanged || rankChanged;
                const hasBeenUpdated = (typeof p.rank === "number" && p.rank >= 1) || (p.teamMembers ?? []).some(t => (t.kills ?? 0) > 0);
                const position = typeof p.rank === "number" && p.rank >= 1 ? p.rank : i + 1;
                const coins = calcCoinsForPosition(position, totalKills, match.prizePool);
                return (
                  <div key={p.id} style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap"
                  }}>
                    {hasBeenUpdated && (
                      <span style={{ fontSize: 18, fontWeight: 800, color: position === 1 ? "#fbbf24" : position === 2 ? "#94a3b8" : position === 3 ? "#cd7f32" : "#64748b", minWidth: 28 }}>
                        #{position}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 140 }}>
                      {p.userId && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#334155", marginBottom: 4 }}>ID: {p.userId}</div>}
                      {(p.teamMembers ?? []).map((t, ti) => (
                        <div key={ti} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: ti < (p.teamMembers?.length ?? 1) - 1 ? 6 : 0 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{t.inGameName}</div>
                            <div style={{ fontSize: 11, color: "#475569" }}>{t.inGameUid}</div>
                          </div>
                          {isOngoing && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
                              <span style={{ fontSize: 11, color: "#64748b" }}>Kills</span>
                              <input type="number" min={0} value={killsArr[ti] ?? 0}
                                onChange={e => {
                                  const v = Number(e.target.value) || 0;
                                  setLocalKills(prev => ({ ...prev, [p.id]: (prev[p.id] ?? killsArr).map((k, j) => j === ti ? v : k) }));
                                }}
                                style={{ width: 52, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 8px", color: "#f1f5f9", fontSize: 13, textAlign: "center", outline: "none" }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {isOngoing && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#64748b" }}>Rank</span>
                        <input type="number" min={1} max={participants.length} value={rankVal === "" ? "" : rankVal}
                          onChange={e => {
                            const v = e.target.value;
                            setLocalRank(prev => ({ ...prev, [p.id]: v === "" ? "" : Math.min(participants.length, Math.max(1, Number(v) || 1)) }));
                          }}
                          placeholder="—"
                          style={{ width: 52, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 8px", color: "#f1f5f9", fontSize: 13, textAlign: "center", outline: "none" }}
                        />
                        {hasChanges && (
                          <button type="button" onClick={() => handleUpdateParticipant(p)} disabled={!!updatingParticipant}
                            style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            {updatingParticipant === p.id ? "…" : "Update"}
                          </button>
                        )}
                      </div>
                    )}
                    {hasBeenUpdated && <CoinChip amount={coins} size="md" />}
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* Ongoing: finish */}
      {isOngoing && (
        <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16, padding: 20 }}>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#4ade80" }}>🏁 Finish Match</p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Update all participant stats, then finish to distribute coins.</p>
          <PrimaryBtn onClick={handleFinish} disabled={finishing} style={{ background: finishing ? undefined : "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 4px 20px rgba(34,197,94,0.25)" }}>
            {finishing ? "Finishing…" : "Finish Match"}
          </PrimaryBtn>
        </div>
      )}

      {/* Upcoming: room info */}
      {isUpcoming && (
        <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 16, padding: 20 }}>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>🔐 Room Info</p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Set room code & password. Registered players can see it only when you save.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <FancyInput label="Room Code" type="text" value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="ROOM123" />
            <FancyInput label="Room Password" type="text" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} placeholder="pass123" />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <GhostBtn onClick={handleSaveRoom} disabled={saving}>{saving ? "Saving…" : "Save Room Info"}</GhostBtn>
            {canStartMatch && <PrimaryBtn onClick={handleStart} disabled={starting}>{starting ? "Starting…" : "Start Match"}</PrimaryBtn>}
            <DangerBtn onClick={handleCancel} disabled={cancelling}>{cancelling ? "Cancelling…" : "Cancel Match"}</DangerBtn>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ADMIN PROFILE MODAL
══════════════════════════════════════════════════════════════════ */
type AdminListItem = {
  id: string; adminname: string; isMasterAdmin: boolean;
  usersAccess: boolean; coinsAccess: boolean; gamesAccessType: string; allowedGameIds: string[];
};

function AdminProfileModal({ admin, games, onClose, onDelete }: {
  admin: AdminListItem; games: Game[]; onClose: () => void; onDelete: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("click", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", esc); };
  }, [onClose]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newPassword || newPassword.length < 6) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}/password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setNewPassword(""); alert("Password updated");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (admin.isMasterAdmin || !confirm("Delete this admin?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      onDelete();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }}>
      <div ref={ref} style={{
        width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto",
        background: "rgba(8,12,24,0.98)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20, padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.6)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>Admin Profile</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, padding: 4, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Name", value: admin.adminname },
            { label: "ID", value: admin.id, mono: true },
          ].map(row => (
            <div key={row.label}>
              <p style={{ margin: "0 0 3px", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{row.label}</p>
              <p style={{ margin: 0, fontSize: 14, color: "#f1f5f9", fontFamily: row.mono ? "monospace" : undefined, wordBreak: "break-all" }}>{row.value}</p>
            </div>
          ))}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Role & Permissions</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {admin.isMasterAdmin && <span style={{ fontSize: 12, background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderRadius: 20, padding: "3px 10px", fontWeight: 700 }}>★ Master Admin</span>}
              {admin.usersAccess && <span style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 20, padding: "3px 10px" }}>Users</span>}
              {admin.coinsAccess && <span style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 20, padding: "3px 10px" }}>Coins</span>}
              {admin.gamesAccessType === "all"
                ? <span style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 20, padding: "3px 10px" }}>All Games</span>
                : (admin.allowedGameIds ?? []).map(gid => {
                  const g = games.find(g => g.id === gid);
                  return g ? <span key={gid} style={{ fontSize: 12, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 20, padding: "3px 10px" }}>{g.name}</span> : null;
                })}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <form onSubmit={handleChangePassword} style={{ display: "flex", gap: 8 }}>
            <input type="password" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)"
              style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, outline: "none" }} />
            <PrimaryBtn type="submit" disabled={submitting || !newPassword || newPassword.length < 6} style={{ whiteSpace: "nowrap" }}>
              {submitting ? "…" : "Change"}
            </PrimaryBtn>
          </form>
          {!admin.isMasterAdmin && <DangerBtn onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete Admin"}</DangerBtn>}
          {admin.isMasterAdmin && <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Master admin cannot be deleted.</p>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CREATE ADMIN SECTION
══════════════════════════════════════════════════════════════════ */
function CreateAdminSection({ games, onSuccess }: { games: Game[]; onSuccess: () => void }) {
  const [adminname, setAdminname] = useState("");
  const [password, setPassword] = useState("");
  const [usersAccess, setUsersAccess] = useState(false);
  const [coinsAccess, setCoinsAccess] = useState(false);
  const [gamesAccessType, setGamesAccessType] = useState<"all" | "specific">("all");
  const [allowedGameIds, setAllowedGameIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminListItem | null>(null);

  const refreshAdmins = useCallback(() => {
    fetch("/api/admin/admins").then(r => r.json()).then(d => Array.isArray(d) && setAdmins(d)).catch(() => {});
  }, []);

  useEffect(() => { refreshAdmins(); }, [refreshAdmins]);

  const toggleGame = (id: string) => setAllowedGameIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminname, password, usersAccess, coinsAccess, gamesAccessType, allowedGameIds: gamesAccessType === "specific" ? allowedGameIds : [] }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setAdminname(""); setPassword(""); setUsersAccess(false); setCoinsAccess(false);
      setGamesAccessType("all"); setAllowedGameIds([]);
      refreshAdmins(); onSuccess();
    } catch { setError("Failed to create admin"); }
    finally { setSubmitting(false); }
  };

  const checkboxStyle: React.CSSProperties = { accentColor: "#fbbf24", width: 16, height: 16 };
  const radioStyle: React.CSSProperties = { accentColor: "#fbbf24", width: 16, height: 16 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card glow="#fbbf24">
        <SectionHeading title="Create Admin" sub="Set credentials and access permissions" />
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FancyInput label="Admin Name" type="text" value={adminname} onChange={e => setAdminname(e.target.value)} required placeholder="adminname" />
          <FancyInput label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ minLength: 6 } as any} />

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16 }}>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Permissions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Users tab access", checked: usersAccess, onChange: (v: boolean) => setUsersAccess(v) },
                { label: "Coins tab access", checked: coinsAccess, onChange: (v: boolean) => setCoinsAccess(v) },
              ].map(item => (
                <label key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={item.checked} onChange={e => item.onChange(e.target.checked)} style={checkboxStyle} />
                  <span style={{ fontSize: 14, color: "#cbd5e1" }}>{item.label}</span>
                </label>
              ))}
              <div style={{ marginTop: 4 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#94a3b8" }}>Games access</p>
                <div style={{ display: "flex", gap: 20 }}>
                  {[{ val: "all", label: "All games" }, { val: "specific", label: "Specific games" }].map(opt => (
                    <label key={opt.val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="radio" name="gamesAccess" checked={gamesAccessType === opt.val} onChange={() => setGamesAccessType(opt.val as any)} style={radioStyle} />
                      <span style={{ fontSize: 14, color: "#cbd5e1" }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {gamesAccessType === "specific" && (
                  <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {games.map(g => (
                      <label key={g.id} style={{
                        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                        background: allowedGameIds.includes(g.id) ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${allowedGameIds.includes(g.id) ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 10, padding: "8px 12px", transition: "all 0.15s"
                      }}>
                        <input type="checkbox" checked={allowedGameIds.includes(g.id)} onChange={() => toggleGame(g.id)} style={checkboxStyle} />
                        <span style={{ fontSize: 13, color: allowedGameIds.includes(g.id) ? "#fbbf24" : "#94a3b8" }}>{g.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <p style={{ margin: 0, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>{error}</p>}
          <div><PrimaryBtn type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Admin"}</PrimaryBtn></div>
        </form>
      </Card>

      <Card>
        <SectionHeading title={`Admins (${admins.length})`} sub="Click to view profile or manage" />
        <ul style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {admins.map(a => (
            <ListRow key={a.id} onClick={() => setSelectedAdmin(a)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: a.isMasterAdmin ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  {a.isMasterAdmin ? "★" : "👤"}
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>{a.adminname}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                {a.isMasterAdmin && <span style={{ fontSize: 11, background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>Master</span>}
                {a.usersAccess && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 20, padding: "2px 8px" }}>Users</span>}
                {a.coinsAccess && <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 20, padding: "2px 8px" }}>Coins</span>}
                {a.gamesAccessType === "all"
                  ? <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 20, padding: "2px 8px" }}>All Games</span>
                  : (a.allowedGameIds ?? []).slice(0, 2).map(gid => { const g = games.find(g => g.id === gid); return g ? <span key={gid} style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 20, padding: "2px 8px" }}>{g.name}</span> : null; })}
              </div>
            </ListRow>
          ))}
        </ul>
      </Card>

      {selectedAdmin && (
        <AdminProfileModal admin={selectedAdmin} games={games}
          onClose={() => setSelectedAdmin(null)}
          onDelete={() => { refreshAdmins(); setSelectedAdmin(null); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   USERS SECTION
══════════════════════════════════════════════════════════════════ */
function UsersSection({ users, canAddCoins, onSuccess }: { users: User[]; canAddCoins: boolean; onSuccess: () => void }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [usersTab, setUsersTab] = useState<"all" | "blocked">("all");
  const [signupBonusInput, setSignupBonusInput] = useState("");
  const [savingBonus, setSavingBonus] = useState(false);
  const [supportUrlInput, setSupportUrlInput] = useState("");
  const [savingSupport, setSavingSupport] = useState(false);
  const filteredUsers = usersTab === "blocked" ? users.filter(u => u.isBlocked) : users;

  useEffect(() => {
    fetch("/api/admin/signup-bonus").then(r => r.json()).then(d => setSignupBonusInput(String(d.signupBonus ?? 0))).catch(() => setSignupBonusInput("0"));
    fetch("/api/admin/customer-support").then(r => r.json()).then(d => setSupportUrlInput(d.url ?? "")).catch(() => setSupportUrlInput(""));
  }, []);

  const handleSaveSignupBonus = async () => {
    const n = Number(signupBonusInput); if (isNaN(n) || n < 0) { alert("Invalid amount"); return; }
    setSavingBonus(true);
    try {
      const res = await fetch("/api/admin/signup-bonus", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signupBonus: n }) });
      if (!res.ok) throw new Error(await res.text());
      const { signupBonus } = await res.json(); setSignupBonusInput(String(signupBonus)); onSuccess();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSavingBonus(false); }
  };

  const handleSaveSupportUrl = async () => {
    const t = supportUrlInput.trim(); setSavingSupport(true);
    try {
      const res = await fetch("/api/admin/customer-support", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: t || null }) });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json(); setSupportUrlInput(url ?? ""); onSuccess();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSavingSupport(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Settings cards */}
      {[
        {
          title: "Customer Support Link", sub: 'WhatsApp, Telegram, or any URL. Leave empty to hide button.',
          content: (
            <div style={{ display: "flex", gap: 10 }}>
              <input type="url" value={supportUrlInput} onChange={e => setSupportUrlInput(e.target.value)}
                placeholder="https://wa.me/919876543210"
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, outline: "none" }} />
              <PrimaryBtn onClick={handleSaveSupportUrl} disabled={savingSupport}>{savingSupport ? "Saving…" : "Save"}</PrimaryBtn>
            </div>
          )
        },
        {
          title: "Signup Bonus",
          sub: "New accounts will receive this many coins upon registration.",
          content: (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="number" min="0" value={signupBonusInput} onChange={e => setSignupBonusInput(e.target.value)} placeholder="0"
                style={{ width: 90, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, outline: "none" }} />
              <span style={{ fontSize: 13, color: "#64748b" }}>coins</span>
              <PrimaryBtn onClick={handleSaveSignupBonus} disabled={savingBonus}>{savingBonus ? "Saving…" : "Save"}</PrimaryBtn>
            </div>
          )
        }
      ].map(item => (
        <Card key={item.title}>
          <SectionHeading title={item.title} sub={item.sub} />
          {item.content}
        </Card>
      ))}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <SectionHeading title={`Users (${users.length})`} sub={usersTab === "blocked" ? `${filteredUsers.length} blocked` : undefined} />
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "blocked"] as const).map(t => (
              <button key={t} type="button" onClick={() => setUsersTab(t)} style={{
                padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: usersTab === t ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
                color: usersTab === t ? "#fbbf24" : "#64748b"
              }}>{t === "all" ? "All" : "Blocked"}</button>
            ))}
          </div>
        </div>
        <ul style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredUsers.map(u => (
            <ListRow key={u.id} onClick={() => setSelectedUser(u)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: u.isBlocked ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, color: u.isBlocked ? "#f87171" : "#a5b4fc"
                }}>
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>{u.displayName}</div>
                  <div style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.id}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {u.isBlocked && <span style={{ fontSize: 11, background: "rgba(239,68,68,0.12)", color: "#f87171", borderRadius: 20, padding: "2px 8px" }}>Blocked</span>}
                <CoinChip amount={u.coins} />
              </div>
            </ListRow>
          ))}
          {filteredUsers.length === 0 && <li style={{ textAlign: "center", padding: "32px 0", color: "#475569", fontSize: 14, listStyle: "none" }}>No {usersTab === "blocked" ? "blocked " : ""}users</li>}
        </ul>
      </Card>

      {selectedUser && (
        <UserProfileModal
          user={selectedUser} canAddCoins={canAddCoins}
          onClose={() => setSelectedUser(null)}
          onUserUpdate={u => setSelectedUser(u)}
          onDelete={() => { onSuccess(); setSelectedUser(null); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   USER PROFILE MODAL
══════════════════════════════════════════════════════════════════ */
function UserProfileModal({ user, canAddCoins, onClose, onUserUpdate, onDelete }: {
  user: User; canAddCoins: boolean; onClose: () => void;
  onUserUpdate: (u: User) => void; onDelete: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("click", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", esc); };
  }, [onClose]);

  const handleAddCoins = async (e: React.FormEvent) => {
    e.preventDefault(); const n = Number(amount); if (isNaN(n) || n <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/coins`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: n }) });
      if (!res.ok) throw new Error(await res.text());
      setAmount(""); onUserUpdate(await res.json());
    } catch { alert("Failed to add coins"); }
    finally { setSubmitting(false); }
  };

  const handleBlockUnblock = async () => {
    setBlocking(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/${user.isBlocked ? "unblock" : "block"}`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      onUserUpdate(await res.json());
    } catch { alert("Failed"); }
    finally { setBlocking(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this user? Cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      onDelete();
    } catch { alert("Failed"); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", padding: 16 }}>
      <div ref={ref} style={{ width: "100%", maxWidth: 440, maxHeight: "90vh", overflowY: "auto", background: "rgba(8,12,24,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>User Profile</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, padding: 4, lineHeight: 1 }}>✕</button>
        </div>
        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#a5b4fc", flexShrink: 0 }}>
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>{user.displayName}</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>{user.email}</p>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <CoinChip amount={user.coins} size="md" />
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>User ID</p>
          <p style={{ margin: 0, fontFamily: "monospace", fontSize: 12, color: "#64748b", wordBreak: "break-all" }}>{user.id}</p>
          <p style={{ margin: "10px 0 4px", fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Status</p>
          <span style={{ fontSize: 12, color: user.isBlocked ? "#f87171" : "#4ade80", fontWeight: 600 }}>
            {user.isBlocked ? "🚫 Blocked" : "✓ Active"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {canAddCoins && (
            <form onSubmit={handleAddCoins} style={{ display: "flex", gap: 8 }}>
              <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount"
                style={{ width: 90, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, outline: "none" }} />
              <PrimaryBtn type="submit" disabled={submitting || !amount}>{submitting ? "Adding…" : "Add Coins"}</PrimaryBtn>
            </form>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={handleBlockUnblock} disabled={blocking} style={{
              background: user.isBlocked ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.1)",
              color: user.isBlocked ? "#4ade80" : "#fbbf24",
              border: `1px solid ${user.isBlocked ? "rgba(34,197,94,0.3)" : "rgba(251,191,36,0.25)"}`,
              borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer"
            }}>
              {blocking ? "…" : user.isBlocked ? "Unblock" : "Block User"}
            </button>
            <DangerBtn onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete Account"}</DangerBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COINS SECTION
══════════════════════════════════════════════════════════════════ */
type DepositRequestWithUser = { id: string; userId: string; amount: number; utr: string; status: string; createdAt: string; user?: User };
type WithdrawalRequestWithUser = { id: string; userId: string; amount: number; upiId: string; status: string; rejectNote?: string; chargePercent?: number; createdAt: string; user?: User };

function CoinsSection({ users, onSuccess }: { users: User[]; onSuccess: () => void }) {
  const [coinsTab, setCoinsTab] = useState<"deposits" | "withdrawals">("deposits");
  const [depositRequests, setDepositRequests] = useState<DepositRequestWithUser[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestWithUser[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [chargeInput, setChargeInput] = useState("");
  const [savingCharge, setSavingCharge] = useState(false);
  const [depositQrUrl, setDepositQrUrl] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [savingQr, setSavingQr] = useState(false);

  const fetchDeposits = useCallback(async () => {
    setLoadingDeposits(true);
    try { const res = await fetch("/api/admin/deposits?status=pending"); if (res.ok) setDepositRequests(await res.json()); }
    catch { setDepositRequests([]); } finally { setLoadingDeposits(false); }
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    setLoadingWithdrawals(true);
    try {
      const [wRes, cRes] = await Promise.all([fetch("/api/admin/withdrawals?status=pending"), fetch("/api/admin/withdrawal-charge")]);
      if (wRes.ok) setWithdrawalRequests(await wRes.json());
      if (cRes.ok) { const { chargePercent } = await cRes.json(); setChargeInput(String(chargePercent)); }
    } catch { setWithdrawalRequests([]); } finally { setLoadingWithdrawals(false); }
  }, []);

  const fetchDepositQr = useCallback(async () => {
    try { const res = await fetch("/api/admin/deposit-qr"); if (res.ok) { const { url } = await res.json(); setDepositQrUrl(url); } }
    catch { setDepositQrUrl(null); }
  }, []);

  useEffect(() => { if (coinsTab === "deposits") { fetchDeposits(); fetchDepositQr(); } else fetchWithdrawals(); }, [coinsTab, fetchDeposits, fetchDepositQr, fetchWithdrawals]);

  const handleSaveCharge = async () => {
    const p = Number(chargeInput); if (isNaN(p) || p < 0 || p > 100) { alert("0–100"); return; }
    setSavingCharge(true);
    try {
      const res = await fetch("/api/admin/withdrawal-charge", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chargePercent: p }) });
      if (!res.ok) throw new Error(await res.text());
      const { chargePercent } = await res.json(); setChargeInput(String(chargePercent)); onSuccess();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSavingCharge(false); }
  };

  const handleQrFileChange = (f: File) => { setQrFile(f); setQrPreview(URL.createObjectURL(f)); };
  const handleQrClear = () => { setQrFile(null); if (qrPreview) URL.revokeObjectURL(qrPreview); setQrPreview(null); };

  const handleSaveQr = async () => {
    if (qrFile) {
      setSavingQr(true);
      try {
        const url = await uploadImage(qrFile);
        const res = await fetch("/api/admin/deposit-qr", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
        if (!res.ok) throw new Error(await res.text());
        const { url: saved } = await res.json(); setDepositQrUrl(saved); handleQrClear(); onSuccess();
      } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
      finally { setSavingQr(false); }
    } else if (depositQrUrl) {
      if (!confirm("Remove QR code?")) return;
      setSavingQr(true);
      try {
        const res = await fetch("/api/admin/deposit-qr", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: null }) });
        if (!res.ok) throw new Error(await res.text());
        setDepositQrUrl(null); onSuccess();
      } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
      finally { setSavingQr(false); }
    }
  };

  const handleDepositAction = async (id: string, action: "accept" | "reject" | "block") => {
    try { const res = await fetch(`/api/admin/deposits/${id}/${action}`, { method: "POST" }); if (!res.ok) throw new Error(await res.text()); fetchDeposits(); onSuccess(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleWithdrawAccept = async (id: string) => {
    try { const res = await fetch(`/api/admin/withdrawals/${id}/accept`, { method: "POST" }); if (!res.ok) throw new Error(await res.text()); fetchWithdrawals(); onSuccess(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleWithdrawReject = async (id: string) => {
    const note = prompt("Rejection reason:"); if (note === null) return;
    const t = note.trim(); if (!t) { alert("Reason required"); return; }
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: t }) });
      if (!res.ok) throw new Error(await res.text()); fetchWithdrawals(); onSuccess();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const ActionBtn = ({ onClick, icon, color, title }: { onClick: () => void; icon: string; color: string; title: string }) => (
    <button type="button" onClick={onClick} title={title} style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: color, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 16 }}>
      {icon}
    </button>
  );

  const RequestList = ({ items, type }: { items: (DepositRequestWithUser | WithdrawalRequestWithUser)[]; type: "deposit" | "withdrawal" }) => (
    <ul style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(r => {
        const isD = type === "deposit";
        const dr = r as DepositRequestWithUser;
        const wr = r as WithdrawalRequestWithUser;
        return (
          <li key={r.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16, listStyle: "none" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>{r.user?.displayName ?? "Unknown"}</p>
                <p style={{ margin: "0 0 6px", fontFamily: "monospace", fontSize: 11, color: "#475569", wordBreak: "break-all" }}>{r.userId}</p>
                {isD
                  ? <p style={{ margin: "0 0 4px", fontSize: 13, color: "#94a3b8" }}>UTR: <span style={{ color: "#f1f5f9" }}>{dr.utr}</span></p>
                  : <p style={{ margin: "0 0 4px", fontSize: 13, color: "#94a3b8" }}>UPI: <span style={{ color: "#f1f5f9" }}>{wr.upiId}</span></p>}
                <CoinChip amount={r.amount} size="md" />
                {!isD && (wr.chargePercent ?? 0) > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#4ade80" }}>
                    → pay {Math.round(r.amount * (1 - (wr.chargePercent ?? 0) / 100))}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionBtn onClick={() => isD ? handleDepositAction(r.id, "accept") : handleWithdrawAccept(r.id)} icon="✓" color="rgba(34,197,94,0.2)" title="Accept" />
                <ActionBtn onClick={() => isD ? handleDepositAction(r.id, "reject") : handleWithdrawReject(r.id)} icon="✕" color="rgba(239,68,68,0.2)" title="Reject" />
                {isD && <ActionBtn onClick={() => handleDepositAction(r.id, "block")} icon="🚫" color="rgba(255,255,255,0.06)" title="Block user" />}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  const Spinner = () => (
    <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
      <div style={{ width: 32, height: 32, border: "3px solid rgba(251,191,36,0.15)", borderTop: "3px solid #fbbf24", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {(["deposits", "withdrawals"] as const).map(t => (
          <button key={t} type="button" onClick={() => setCoinsTab(t)} style={{
            padding: "9px 20px", borderRadius: 20, border: "none", cursor: "pointer",
            background: coinsTab === t ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
            color: coinsTab === t ? "#fbbf24" : "#64748b", fontSize: 13, fontWeight: 600, transition: "all 0.18s"
          }}>
            {t === "deposits" ? "⬇️ Deposits" : "⬆️ Withdrawals"}
          </button>
        ))}
      </div>

      {coinsTab === "deposits" && (
        <>
          <Card>
            <SectionHeading title="Deposit QR Code" sub="Users scan this to pay when depositing." />
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <label style={{
                width: 140, minHeight: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "1.5px dashed rgba(251,191,36,0.25)", borderRadius: 14, cursor: "pointer", padding: 12,
                background: "rgba(251,191,36,0.03)"
              }}>
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleQrFileChange(f); }} />
                {(qrPreview || depositQrUrl) ? <img src={qrPreview ?? depositQrUrl ?? ""} alt="QR" style={{ maxWidth: 110, maxHeight: 110, borderRadius: 8, objectFit: "contain" }} />
                  : <span style={{ fontSize: 36 }}>📱</span>}
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{qrFile ? qrFile.name : "Click to upload"}</span>
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "flex-end" }}>
                {qrFile && <GhostBtn onClick={handleQrClear} style={{ fontSize: 12 }}>Clear</GhostBtn>}
                <PrimaryBtn onClick={handleSaveQr} disabled={savingQr || (!qrFile && !depositQrUrl)}>
                  {savingQr ? "Saving…" : qrFile ? "Upload" : depositQrUrl ? "Remove QR" : "Upload"}
                </PrimaryBtn>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <SectionHeading title={`Pending Deposits (${depositRequests.length})`} />
              <button type="button" onClick={fetchDeposits} disabled={loadingDeposits} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: loadingDeposits ? "spin 0.8s linear infinite" : "none" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            {loadingDeposits ? <Spinner /> : depositRequests.length === 0 ? <p style={{ textAlign: "center", color: "#475569", fontSize: 14, padding: "24px 0" }}>No pending deposits</p> : <RequestList items={depositRequests} type="deposit" />}
          </Card>

          <AddCoinsSection users={users} onSuccess={onSuccess} />
        </>
      )}

      {coinsTab === "withdrawals" && (
        <>
          <Card>
            <SectionHeading title="Withdrawal Charge" sub="Percentage deducted from each withdrawal." />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="number" min="0" max="100" step="0.5" value={chargeInput} onChange={e => setChargeInput(e.target.value)}
                style={{ width: 80, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 13, outline: "none" }} />
              <span style={{ color: "#64748b", fontSize: 14 }}>%</span>
              <PrimaryBtn onClick={handleSaveCharge} disabled={savingCharge}>{savingCharge ? "Saving…" : "Save"}</PrimaryBtn>
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <SectionHeading title={`Pending Withdrawals (${withdrawalRequests.length})`} />
              <button type="button" onClick={fetchWithdrawals} disabled={loadingWithdrawals} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: loadingWithdrawals ? "spin 0.8s linear infinite" : "none" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            {loadingWithdrawals ? <Spinner /> : withdrawalRequests.length === 0 ? <p style={{ textAlign: "center", color: "#475569", fontSize: 14, padding: "24px 0" }}>No pending withdrawals</p> : <RequestList items={withdrawalRequests} type="withdrawal" />}
          </Card>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ADD COINS SECTION
══════════════════════════════════════════════════════════════════ */
function AddCoinsSection({ users, onSuccess }: { users: User[]; onSuccess: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("From admin");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = searchQuery.trim();
  const matchedUser = trimmed ? users.find(u => u.id.toLowerCase().includes(trimmed.toLowerCase())) : null;
  const showNoUser = trimmed.length > 0 && !matchedUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!matchedUser || !amount) return;
    const n = Number(amount); if (isNaN(n) || n <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${matchedUser.id}/coins`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: n, description: note.trim() || "From admin" }) });
      if (!res.ok) throw new Error(await res.text());
      setAmount(""); setNote("From admin"); setSearchQuery(""); onSuccess();
    } catch { alert("Failed to add coins"); }
    finally { setSubmitting(false); }
  };

  return (
    <Card glow="#fbbf24">
      <SectionHeading title="Add Coins" sub="Search by user ID, then add coins to their account" />
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FancyInput label="Search by User ID" type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Paste or type user ID…" />
        {showNoUser && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>
            No user found
          </div>
        )}
        {matchedUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#a5b4fc", flexShrink: 0 }}>
                  {matchedUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{matchedUser.displayName}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{matchedUser.email}</p>
                </div>
                <CoinChip amount={matchedUser.coins} size="md" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FancyInput label="Amount" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="100" />
              <FancyInput label="Note" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="From admin" />
            </div>
            <div><PrimaryBtn type="submit" disabled={submitting}>{submitting ? "Adding…" : "Add Coins"}</PrimaryBtn></div>
          </div>
        )}
      </form>
    </Card>
  );
}
