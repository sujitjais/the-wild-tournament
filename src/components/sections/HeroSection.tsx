"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { brand } from "@config/brand";

const VIGNETTE_BOTTOM =
  "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,0.3) 37.5%, transparent 60%)";
const VIGNETTE_LEFT =
  "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0.3) 35%, transparent 60%)";

export function HeroSection() {
  const playUrl = "/play";
  const hero = brand.hero;

  const [imgError, setImgError] = useState(false);
  const bgSrc = brand.images?.homepageBackground ?? "/images/home-page-bg.jpg";

  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [hoveringBtn, setHoveringBtn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);

  useEffect(() => {
    setMounted(true);
    setParticles(
      Array.from({ length: 18 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 20 + 15,
        opacity: Math.random() * 0.5 + 0.15,
      }))
    );
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const handleMouseLeave = () => {
    setMouse({ x: 0.5, y: 0.5 });
  };

  const rx = (mouse.y - 0.5) * -18;
  const ry = (mouse.x - 0.5) * 18;
  const tx = (mouse.x - 0.5) * 12;
  const ty = (mouse.y - 0.5) * 12;

  const shimmerX = mouse.x * 100;
  const shimmerY = mouse.y * 100;

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex min-h-screen items-end overflow-hidden md:items-center"
      style={{ perspective: "1200px" }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {!imgError ? (
          <Image
            src={bgSrc}
            alt=""
            fill
            className="object-cover"
            priority
            quality={90}
            sizes="(max-width: 768px) 750px, 100vw"
            onError={() => setImgError(true)}
            style={{
              transform: `scale(1.06) translate(${(mouse.x - 0.5) * -14}px, ${(mouse.y - 0.5) * -10}px)`,
              transition: "transform 0.12s ease-out",
            }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at ${shimmerX}% ${shimmerY}%, #3d2a00 0%, #1a1200 35%, #0a0800 100%)`,
            }}
            aria-hidden
          />
        )}

        {/* Floating particles */}
        {mounted && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {particles.map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  background: "#FFC107",
                  opacity: p.opacity,
                  animation: `float-up ${p.speed}s linear infinite`,
                  animationDelay: `${-Math.random() * p.speed}s`,
                }}
              />
            ))}
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 z-[1] md:hidden"
          style={{ background: VIGNETTE_BOTTOM }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
          style={{ background: VIGNETTE_LEFT }}
          aria-hidden
        />

        {/* Dynamic light orb that follows mouse */}
        <div
          className="pointer-events-none absolute z-[1]"
          style={{
            width: 500,
            height: 500,
            borderRadius: "50%",
            left: `calc(${mouse.x * 100}% - 250px)`,
            top: `calc(${mouse.y * 100}% - 250px)`,
            background: "radial-gradient(circle, rgba(255,193,7,0.06) 0%, transparent 70%)",
            transition: "left 0.2s ease-out, top 0.2s ease-out",
          }}
          aria-hidden
        />
      </div>

      {/* 3D Card container */}
      <div
        ref={cardRef}
        className="hero-cta-container relative z-[2] mx-auto flex min-h-[45vh] w-full max-w-[min(100%,28rem)] flex-col justify-between px-6 pb-6 pt-8 text-center md:min-h-[38vh] md:pb-6 md:pt-8"
        style={{
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) translateX(${tx}px) translateY(${ty}px)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.15s ease-out",
          willChange: "transform",
        }}
      >
        {/* Shimmer layer */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl z-10"
          style={{
            background: `radial-gradient(circle at ${shimmerX}% ${shimmerY}%, rgba(255,193,7,0.07) 0%, transparent 60%)`,
            transition: "background 0.1s ease-out",
          }}
          aria-hidden
        />

        <div style={{ transform: "translateZ(30px)" }}>
          {/* Title */}
          <h1
            className="mb-6 w-full font-ultimatum tracking-wide text-white drop-shadow-lg"
            style={{ textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}
          >
            <span
              className="block w-full leading-none"
              style={{ fontSize: "clamp(0.875rem, 12cqw, 3rem)" }}
            >
              {hero?.titleAccent ?? "THE BEST"}
            </span>
            <span
              className="mt-1 block w-full whitespace-nowrap leading-none"
              style={{
                fontSize: "clamp(1rem, 16.5cqw, 4rem)",
                textShadow: "0 0 40px rgba(255,193,7,0.3), 0 4px 24px rgba(0,0,0,0.9)",
              }}
            >
              {hero?.titleMain ?? "ESPORTS APP"}
            </span>
          </h1>

          {/* Stats */}
          <div className="mt-4 flex items-center justify-center gap-6 sm:gap-8 font-ultimatum">
            <StatPill value="10,000+" label="Players" />
            <div className="h-10 w-px shrink-0 bg-white/30" aria-hidden />
            <StatPill value="1,000+" label="Matches Hosted" />
          </div>
        </div>

        {/* CTA Button */}
        <Link
          ref={btnRef}
          href={playUrl}
          onMouseEnter={() => setHoveringBtn(true)}
          onMouseLeave={() => setHoveringBtn(false)}
          className="mt-auto block w-full rounded-lg py-4 text-center text-base font-bold uppercase tracking-wider text-stone-900 font-ultimatum"
          style={{
            background: "linear-gradient(135deg, #FFD54F, #FFA000, #FF6F00)",
            boxShadow: hoveringBtn
              ? "0 0 0 2px rgba(255,193,7,0.5), 0 8px 32px rgba(255,160,0,0.6), 0 2px 8px rgba(0,0,0,0.5)"
              : "0 4px 14px rgba(255,160,0,0.4), 0 2px 6px rgba(0,0,0,0.4)",
            transform: hoveringBtn
              ? "translateZ(50px) scale(1.04)"
              : "translateZ(30px) scale(1)",
            transition: "transform 0.18s ease, box-shadow 0.18s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Button shimmer */}
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
              transform: hoveringBtn ? "translateX(200%)" : "translateX(-200%)",
              transition: "transform 0.5s ease",
            }}
            aria-hidden
          />
          PLAY
        </Link>
      </div>

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0px) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }
      `}</style>
    </section>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="text-center px-4 py-2 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "0.5px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(8px)",
        transform: "translateZ(20px)",
      }}
    >
      <div
        className="text-xl font-bold text-accent sm:text-2xl"
        style={{ textShadow: "0 0 20px rgba(255,193,7,0.5), 0 2px 8px rgba(0,0,0,0.6)" }}
      >
        {value}
      </div>
      <div
        className="mt-1 text-sm font-medium text-white/80"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
      >
        {label}
      </div>
    </div>
  );
}
