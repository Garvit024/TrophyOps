import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  users: User[];
  onLogin: (user: User) => void;
}

export default function LoginPage({ users, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      setError('Invalid email or password.');
      return;
    }

    if (user.password !== password) {
      setError('Invalid email or password.');
      return;
    }

    if (!user.is_active) {
      setError('Account disabled. Contact admin.');
      return;
    }

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* Header / Brand */}
        <div className="bg-slate-900/50 p-8 text-center border-b border-slate-700/50">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mx-auto shadow-inner mb-4">
            <span className="text-3xl" role="img" aria-label="trophy">🏆</span>
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-white">TrophyOps</h1>
          <p className="text-xs font-mono text-emerald-400/80 uppercase tracking-widest mt-2">Authentication Portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all sm:text-sm"
                  placeholder="admin@trophyops.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all sm:text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all cursor-pointer"
          >
            Sign In to Dashboard
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="bg-slate-900/50 px-8 py-4 border-t border-slate-700/50 text-center">
          <p className="text-xs text-slate-500 font-medium">Demo Default Password: <strong className="text-emerald-400/80">password123</strong></p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-500 font-mono">
        TrophyOps System v1.0.0 © {new Date().getFullYear()}
      </div>
    </div>
  );
}
