import React, { useState } from 'react';

export interface GoogleOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { name: string; email: string; picture?: string }) => Promise<void>;
}

export const GoogleOAuthModal: React.FC<GoogleOAuthModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount
}) => {
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeAccountEmail, setActiveAccountEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultProfiles = [
    {
      name: 'Alex Morgan',
      email: 'alex.morgan@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    },
    {
      name: 'Ananya Sharma',
      email: 'ananya.sharma@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
    },
    {
      name: 'Rohit Verma',
      email: 'rohit.verma@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
    }
  ];

  const handleAccountClick = async (profile: { name: string; email: string; avatar?: string }) => {
    setActiveAccountEmail(profile.email);
    setIsAuthenticating(true);
    try {
      // Simulate authentic Google OAuth network token exchange
      await new Promise((resolve) => setTimeout(resolve, 1100));
      await onSelectAccount({
        name: profile.name,
        email: profile.email,
        picture: profile.avatar
      });
      onClose();
    } catch (err: any) {
      alert(`Google sign in failed: ${err.message}`);
    } finally {
      setIsAuthenticating(false);
      setActiveAccountEmail(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      alert('Please enter a valid Google email address');
      return;
    }
    const name = customName.trim() || customEmail.split('@')[0];
    await handleAccountClick({ name, email: customEmail });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Google Header */}
        <div className="p-6 pb-4 border-b border-slate-100 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-xl font-bold p-1 leading-none"
          >
            &times;
          </button>

          {/* Multicolored Google G Logo */}
          <div className="w-10 h-10 mx-auto mb-3 flex items-center justify-center">
            <svg className="w-9 h-9" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Sign in with Google
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            to continue to <strong className="text-slate-800">RideX Mobility</strong>
          </p>
        </div>

        {/* Loading Banner */}
        {isAuthenticating && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center space-x-2 text-xs text-blue-800">
            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Signing in as {activeAccountEmail}...</span>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-2">
          {!isCustomMode ? (
            <>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                Choose an account
              </span>

              {defaultProfiles.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  disabled={isAuthenticating}
                  onClick={() => handleAccountClick(p)}
                  className="w-full p-2.5 hover:bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition flex items-center space-x-3 text-left"
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{p.email}</div>
                  </div>
                </button>
              ))}

              {/* Use another account button */}
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full p-2.5 hover:bg-slate-50 rounded-2xl border border-dashed border-slate-300 transition flex items-center space-x-3 text-left text-xs font-semibold text-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                  +
                </div>
                <span>Use another Google account</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3 p-1">
              <span className="text-xs font-bold text-slate-800 block">
                Enter your Google Account details:
              </span>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Gmail / Google Email
                </label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
                >
                  Continue
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 text-center leading-normal">
          To continue, Google will share your name, email address, language preference, and profile picture with RideX.
        </div>
      </div>
    </div>
  );
};

