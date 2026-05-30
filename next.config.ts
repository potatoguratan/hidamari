import type { NextConfig } from "next"

const scssMixins = `
  // ── レスポンシブ ──
  @mixin mobile            { @media (max-width: 767px)                          { @content; } }
  @mixin tablet-portrait   { @media (min-width: 768px) and (max-width: 1023px)  { @content; } }
  @mixin tablet-landscape  { @media (min-width: 1024px) and (max-width: 1279px) { @content; } }
  @mixin tablet            { @media (min-width: 768px) and (max-width: 1279px)  { @content; } }
  @mixin tablet-and-up     { @media (min-width: 768px)                          { @content; } }
  @mixin desktop           { @media (min-width: 1280px)                         { @content; } }
  @mixin mobile-and-tablet { @media (max-width: 1279px)                         { @content; } }

  // ── ユーティリティ ──
  @mixin flex-center  { display: flex; align-items: center; justify-content: center; }
  @mixin flex-between { display: flex; align-items: center; justify-content: space-between; }
  @mixin truncate     { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  @mixin focus-ring   { outline: 2px solid var(--c-main); outline-offset: 2px; }

  // ── Neumorphism (背景 #f0f0f0 前提) ──
  @mixin neu-raised {
    box-shadow:
      0 14px 32px rgba(52, 41, 127, 0.08);
  }
  @mixin neu-raised-sm {
    box-shadow:
      0 8px 18px rgba(52, 41, 127, 0.07);
  }
  @mixin neu-pressed {
    box-shadow:
      0 0 0 1px rgba(52, 41, 127, 0.1);
  }
  @mixin neu-pressed-sm {
    box-shadow:
      0 0 0 1px rgba(52, 41, 127, 0.08);
  }

  // ── Glassmorphism ──
  @mixin glass-white {
    background: rgba(255, 255, 255, 0.28);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.45);
  }
  @mixin glass-main {
    background: rgba(108, 177, 201, 0.18);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(108, 177, 201, 0.35);
  }
  @mixin glass-accent {
    background: rgba(255, 222, 170, 0.22);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 222, 170, 0.45);
  }
  @mixin glass-dark {
    background: rgba(17, 24, 39, 0.55);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(108, 177, 201, 0.25);
  }

  // ── Claymorphism ──
  @mixin clay-main {
    background: #5dc1cf;
    border-radius: 18px;
    box-shadow:
      0 6px 0 #4a90a8,
      0 10px 24px rgba(74, 144, 168, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.55);
  }
  @mixin clay-accent {
    background: #ffdeaa;
    border-radius: 18px;
    box-shadow:
      0 6px 0 #e8c070,
      0 10px 24px rgba(232, 192, 112, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
  }
  @mixin clay-white {
    background: #ffffff;
    border-radius: 20px;
    box-shadow:
      0 8px 0 rgba(108, 177, 201, 0.25),
      0 14px 30px rgba(108, 177, 201, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
  @mixin clay-sm {
    border-radius: 14px;
    box-shadow:
      0 4px 0 rgba(108, 177, 201, 0.3),
      0 8px 16px rgba(108, 177, 201, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  // ── ガラスカード (組み合わせ) ──
  @mixin card {
    @include glass-white;
    border-radius: 20px;
    padding: var(--sp-6);
    box-shadow:
      0 8px 32px rgba(108, 177, 201, 0.12),
      0 2px 0 rgba(255,255,255,0.7) inset;
  }
`

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client"],
  sassOptions: {
    additionalData: scssMixins,
  },
}

export default nextConfig
