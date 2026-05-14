import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, ArrowRight, User, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const checkUserProfileAndRedirect = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, height_cm, weight_kg, sex, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking profile:', error.message);
      navigate('/setup');
      return;
    }

    const hasCompleteProfile =
      !!data &&
      data.height_cm !== null &&
      data.weight_kg !== null &&
      data.sex !== null &&
      data.full_name !== null;

    if (hasCompleteProfile) {
      navigate('/dashboard');
    } else {
      navigate('/setup');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      await checkUserProfileAndRedirect(data.user.id);
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Password and confirm password do not match.');
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      alert(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      // Simpan nama awal supaya halaman setup bisa pakai kalau perlu
      localStorage.setItem(
        'pendingProfile',
        JSON.stringify({
          full_name: name,
          email,
        })
      );
    }

    if (data.session && data.user) {
      navigate('/setup');
    } else {
      alert('Signup berhasil. Silakan cek email kamu untuk verifikasi akun sebelum login.');
      setActiveTab('login');
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);

    if (error) {
      alert(error.message);
    } else {
      alert('Password reset link sent to your email!');
      setShowForgotPassword(false);
      setResetEmail('');
    }

    setIsLoading(false);
  };

  // View untuk Forgot Password
  if (showForgotPassword) {
    return (
      <div className="min-h-screen h-screen w-full bg-[#0B0C15] flex items-center justify-center overflow-hidden relative">
        {/* Background sama */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B0C15] to-slate-900"></div>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full filter blur-[120px] animate-float"></div>
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/15 rounded-full filter blur-[100px] animate-float"
          style={{ animationDelay: '2s' }}
        ></div>

        <div className="relative z-10 w-full max-w-md px-6">
          <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ChevronLeft size={20} />
              Back to Login
            </button>

            <h2 className="text-2xl font-semibold text-white mb-2">Reset Password</h2>
            <p className="text-slate-400 text-sm mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 py-3.5 font-semibold text-white hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0C15] flex flex-col relative py-6">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B0C15] to-slate-900"></div>
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full filter blur-[120px] animate-float"></div>
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/15 rounded-full filter blur-[100px] animate-float"
        style={{ animationDelay: '2s' }}
      ></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 rounded-full filter blur-[150px]"></div>

      {/* Landscape Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 opacity-30 pointer-events-none">
        <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
          <path
            fill="#1e293b"
            fillOpacity="1"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
          <path
            fill="#0f172a"
            fillOpacity="0.8"
            d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,234.7C672,256,768,288,864,277.3C960,267,1056,213,1152,202.7C1248,192,1344,224,1392,240L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      {/* Main Content - Centered */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-[0_0_30px_rgba(34,211,238,0.3)] mb-3">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              K/\Nz:RUN
            </h1>
            <p className="text-slate-400 mt-1 text-xs tracking-wider uppercase">
              Running Power Analytics
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="glass-card rounded-2xl p-1 flex mb-6 border border-white/10">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-white/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
            <h2 className="text-xl font-semibold text-white mb-1 text-center">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-400 text-center text-xs mb-5">
              {activeTab === 'login'
                ? 'Enter your credentials to access the dashboard'
                : 'Fill in your details to get started'}
            </p>

            {activeTab === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider ml-1">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="runner@nebula.com"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 py-3 font-semibold text-white text-sm hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* SIGN UP FORM */
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider ml-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider ml-1">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="runner@nebula.com"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 py-3 font-semibold text-white text-sm hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Alternative Text */}
            <div className="mt-4 text-center">
              <p className="text-slate-400 text-xs">
                {activeTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  {activeTab === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full py-6 text-center mt-auto">
        <p className="text-[10px] text-slate-600">© 2026 K/\Nz:RUN. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-1">
          <button className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
            Privacy
          </button>
          <button className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
            Terms
          </button>
          <button className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
            Contact
          </button>
        </div>
      </div>
    </div>
  );
};