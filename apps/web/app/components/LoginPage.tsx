import { Activity, Lock, Shield, RefreshCw } from 'lucide-react';

interface LoginPageProps {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function LoginPage({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginPageProps) {
  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #06101E 0%, #0A1628 50%, #0D1F3C 100%)' }}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Radial glow — teal top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(0,122,116,0.18), transparent)',
        }}
      />
      {/* Radial glow — blue bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 80% 110%, rgba(37,99,235,0.10), transparent)',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-5">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg mb-5">
            <Activity size={30} className="text-white" />
          </div>
          <h1 className="text-[2rem] font-bold text-white tracking-tight leading-none mb-2">
            Helix Core
          </h1>
          <p className="text-brand-300 text-sm font-medium">Clinical Intelligence Platform</p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-8 border"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.10)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          }}
        >
          <h2 className="text-base font-semibold text-white mb-5">Sign in to your workspace</h2>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 border transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
                placeholder="doctor@helix.local"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xxs font-semibold text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <button type="button" className="text-xs text-brand-300 hover:text-brand-200 transition">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 border transition focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white transition flex items-center justify-center gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-transparent"
              style={{
                background: loading
                  ? 'linear-gradient(135deg, #006661, #007A74)'
                  : 'linear-gradient(135deg, #007A74, #3D9F9A)',
                boxShadow: '0 4px 14px rgba(0,122,116,0.35)',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Compliance strip */}
        <div className="flex items-center justify-center gap-4 mt-6 text-slate-600 text-xxs">
          <span className="flex items-center gap-1.5">
            <Shield size={11} />
            HIPAA Compliant
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Lock size={11} />
            End-to-end Encrypted
          </span>
          <span>·</span>
          <span>SOC 2 Type II</span>
        </div>
      </div>
    </main>
  );
}
