import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { GoogleLogin } from '@react-oauth/google';
/**
 * Figma Screens: Sign-in & Sign-up (Canvas: ⚡️ Screens, Frames: Sign-in 375x812, Sign-up 375x812)
 * Clean #F7F8F9 Background, Pure White (#FFFFFF) Surface Cards,
 * Electric Cobalt Blue (#0045FF) Primary Buttons (btn_main 60px),
 * and High-End Typography (#222B45, #8F9BB3).
 */
export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, register, quickLogin, isAuthenticated, user } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [role, setRole] = useState<'CUSTOMER' | 'DRIVER'>('CUSTOMER');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  // Driver fields
  const [vehicleCategory, setVehicleCategory] = useState('SEDAN');
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'CUSTOMER') navigate('/customer');
      else if (user.role === 'DRIVER') navigate('/driver');
      else if (user.role === 'ADMIN') navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'LOGIN') {
        const loggedInUser = await login(email, password);
        if (loggedInUser.role === 'CUSTOMER') navigate('/customer', { replace: true });
        else if (loggedInUser.role === 'DRIVER') navigate('/driver', { replace: true });
        else if (loggedInUser.role === 'ADMIN') navigate('/admin', { replace: true });
      } else {
        const registeredUser = await register({
          role,
          name,
          email,
          password,
          phone,
          ...(role === 'DRIVER'
            ? {
                vehicleType: (vehicleCategory || 'SEDAN').toUpperCase(),
                vehicleCategory: (vehicleCategory || 'SEDAN').toUpperCase(),
                plateNumber: plateNumber.trim().toUpperCase(),
                vehicleModel: model?.trim() || 'Standard',
                model: model?.trim() || 'Standard',
                vehicleColor: color?.trim() || 'White',
                color: color?.trim() || 'White',
                licenseNumber: licenseNumber.trim()
              }
            : {})
        });
        if (registeredUser.role === 'CUSTOMER') navigate('/customer', { replace: true });
        else if (registeredUser.role === 'DRIVER') navigate('/driver', { replace: true });
        else if (registeredUser.role === 'ADMIN') navigate('/admin', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoRole: Role, demoEmail: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const u = await quickLogin(demoRole, demoEmail);
      if (u.role === 'CUSTOMER') navigate('/customer', { replace: true });
      else if (u.role === 'DRIVER') navigate('/driver', { replace: true });
      else if (u.role === 'ADMIN') navigate('/admin', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async (credential: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const loggedInUser = await loginWithGoogle(credential);
      // Immediately direct to the dashboard upon Google authorization
      if (loggedInUser.role === 'CUSTOMER') {
        navigate('/customer', { replace: true });
      } else if (loggedInUser.role === 'DRIVER') {
        navigate('/driver', { replace: true });
      } else if (loggedInUser.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/customer', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F8F9] text-[#222B45] overflow-x-hidden">
      {/* LEFT COLUMN: Figma Mobility Showcase Hero (58% on Laptop/Desktop) */}
      <div className="w-full lg:w-7/12 flex flex-col justify-between p-6 sm:p-10 lg:p-16 relative bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0045FF] text-white border-b lg:border-b-0 lg:border-r border-slate-800/40">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-[14px] bg-[#0045FF] flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-500/30">
              RX
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">Ride</span>
              <span className="text-2xl font-black text-blue-400">X</span>
              <span className="block text-xs text-blue-200 font-semibold tracking-wide">
                Next-Gen Urban Mobility
              </span>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Bangalore Live Dispatch Active</span>
          </div>
        </div>

        {/* Hero Title & Fleet Cards */}
        <div className="my-8 lg:my-auto relative z-10 space-y-6 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-900/60 border border-blue-400/40 text-blue-200 text-xs font-bold shadow-sm">
            <span>✨ Figma Carson Mobility UI Kit</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Go anywhere. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-emerald-300">
              Arrive with peace of mind.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
            Request on-demand rides with real-time GPS tracking, 4-digit security PIN verification, seamless digital wallet settlement, and 24/7 driver dispatch.
          </p>

          {/* Figma Car Type Options Showcase (option 1 cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {[
              { icon: '🚗', name: 'Standard Sedan', eta: '3 min', price: '₹145' },
              { icon: '🛺', name: 'Auto Rickshaw', eta: '2 min', price: '₹85' },
              { icon: '🏍️', name: 'Scooter Express', eta: '2 min', price: '₹55' },
              { icon: '🚙', name: 'Van SUV (6-Seater)', eta: '5 min', price: '₹240' },
              { icon: '✨', name: 'Exec VIP Lux', eta: '4 min', price: '₹320' },
              { icon: '🌱', name: 'Eco Electric', eta: '3 min', price: '₹160' }
            ].map((v) => (
              <div
                key={v.name}
                className="p-3 bg-white/10 backdrop-blur-md rounded-[16px] border border-white/15 hover:border-white/30 transition flex items-center space-x-3 shadow-sm"
              >
                <span className="text-2xl">{v.icon}</span>
                <div>
                  <div className="text-xs font-bold text-white">{v.name}</div>
                  <div className="text-[11px] text-emerald-300 font-semibold">{v.eta} away • {v.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Trust Badges */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex flex-wrap gap-4 text-xs font-medium text-blue-200">
          <div className="flex items-center space-x-2">
            <span>🔒</span>
            <span>4-Digit Start PIN</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⚡</span>
            <span>Live Telemetry</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>💳</span>
            <span>In-App Wallet</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🚨</span>
            <span>SOS Shield</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Figma Auth Panel (42% on Laptop/Desktop, 100% on Mobile) */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-10 bg-[#F7F8F9] overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-5 bg-white p-6 sm:p-8 rounded-[24px] shadow-sm border border-[#EDF1F7]">
          {/* Quick Demo Switcher Persona Chips */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase text-[#8F9BB3] tracking-wider flex items-center justify-between">
              <span>Quick Demo Sign-In</span>
              <span className="text-[11px] text-[#0045FF] font-bold">1-Click</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('CUSTOMER', 'ananya@ridex.com')}
                className="p-2.5 bg-[#F7F8F9] hover:bg-[#EBF3FF] rounded-[14px] border border-[#EDF1F7] hover:border-[#0045FF]/40 text-left transition"
              >
                <div className="text-xs font-bold text-[#222B45]">👤 Ananya</div>
                <div className="text-[11px] text-[#8F9BB3]">Rider (₹1,250 Wallet)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('DRIVER', 'manoj.sedan@ridex.com')}
                className="p-2.5 bg-[#F7F8F9] hover:bg-amber-50 rounded-[14px] border border-[#EDF1F7] hover:border-amber-400 text-left transition"
              >
                <div className="text-xs font-bold text-[#222B45]">🚖 Manoj</div>
                <div className="text-[11px] text-[#8F9BB3]">Driver (Sedan • 4.9★)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('DRIVER', 'rajesh.auto@ridex.com')}
                className="p-2.5 bg-[#F7F8F9] hover:bg-amber-50 rounded-[14px] border border-[#EDF1F7] hover:border-amber-400 text-left transition"
              >
                <div className="text-xs font-bold text-[#222B45]">🛺 Rajesh</div>
                <div className="text-[11px] text-[#8F9BB3]">Driver (Auto • 4.8★)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN', 'admin@ridex.com')}
                className="p-2.5 bg-[#F7F8F9] hover:bg-indigo-50 rounded-[14px] border border-[#EDF1F7] hover:border-indigo-400 text-left transition"
              >
                <div className="text-xs font-bold text-[#222B45]">🛡️ Vikram</div>
                <div className="text-[11px] text-[#8F9BB3]">Platform Admin</div>
              </button>
            </div>
          </div>

          {/* Google Sign In Component */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    handleGoogleAuth(credentialResponse.credential);
                  } else {
                    setErrorMessage('Google did not return an authorization credential.');
                  }
                }}
                onError={() => {
                  setErrorMessage('Google sign-in popup failed. (Note: Make sure http://localhost:5173 is added to Authorized JavaScript Origins in Google Cloud Console, or use the 1-click Google bypass below).');
                }}
                theme="outline"
                size="large"
                shape="rectangular"
                text="continue_with"
                width="320"
              />
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                const demoPayload = {
                  iss: 'https://accounts.google.com',
                  email: 'google.rider@ridex.com',
                  name: 'Google Rider',
                  sub: `google-${Date.now()}`,
                  picture: 'https://lh3.googleusercontent.com/a/default-user',
                  email_verified: true
                };
                const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(demoPayload))));
                handleGoogleAuth(`eyJhbGciOiJSUzI1NiJ9.${b64}.signature`);
              }}
              className="text-center text-[11px] font-bold text-[#0045FF] hover:underline"
            >
              ⚡ Instant Google Authorization (1-Click Test Bypass)
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#EDF1F7]"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-[#8F9BB3] uppercase">Or with Email</span>
            <div className="flex-grow border-t border-[#EDF1F7]"></div>
          </div>

          {/* Mode Switch Tabs (Figma Sign-in vs Sign-up) */}
          <div className="bg-[#F7F8F9] p-1.5 rounded-[16px] flex border border-[#EDF1F7]">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-[12px] transition ${
                mode === 'LOGIN'
                  ? 'bg-white text-[#0045FF] shadow-xs'
                  : 'text-[#8F9BB3] hover:text-[#222B45]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-[12px] transition ${
                mode === 'REGISTER'
                  ? 'bg-white text-[#0045FF] shadow-xs'
                  : 'text-[#8F9BB3] hover:text-[#222B45]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[14px] flex items-center space-x-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Auth Form with Figma inputs */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'REGISTER' && (
              <>
                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-bold text-[#8F9BB3] uppercase mb-1">
                    I want to register as
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('CUSTOMER')}
                      className={`py-2 px-3 text-xs font-bold rounded-[12px] border transition ${
                        role === 'CUSTOMER'
                          ? 'bg-[#EBF3FF] border-[#0045FF] text-[#0045FF]'
                          : 'bg-[#F7F8F9] border-[#EDF1F7] text-[#8F9BB3]'
                      }`}
                    >
                      👤 Rider (Customer)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('DRIVER')}
                      className={`py-2 px-3 text-xs font-bold rounded-[12px] border transition ${
                        role === 'DRIVER'
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'bg-[#F7F8F9] border-[#EDF1F7] text-[#8F9BB3]'
                      }`}
                    >
                      🚖 Driver Partner
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4B545A] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#F7F8F9] border border-[#E4E9F2] rounded-[14px] focus:border-[#0045FF] focus:bg-white focus:outline-none text-[#222B45] placeholder-[#8F9BB3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4B545A] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#F7F8F9] border border-[#E4E9F2] rounded-[14px] focus:border-[#0045FF] focus:bg-white focus:outline-none text-[#222B45] placeholder-[#8F9BB3]"
                  />
                </div>

                {role === 'DRIVER' && (
                  <div className="p-3 bg-amber-50/70 rounded-[16px] border border-amber-200/60 space-y-2">
                    <span className="text-[11px] font-bold text-amber-800 uppercase block">
                      Driver & Vehicle Details
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Category</label>
                        <select
                          value={vehicleCategory}
                          onChange={(e) => setVehicleCategory(e.target.value)}
                          className="w-full text-xs font-semibold p-2 bg-white border border-amber-300 rounded-[10px]"
                        >
                          <option value="SEDAN">Sedan</option>
                          <option value="AUTO">Auto</option>
                          <option value="BIKE">Bike</option>
                          <option value="SUV">SUV</option>
                          <option value="PREMIUM">Lux</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Plate Number</label>
                        <input
                          type="text"
                          required
                          value={plateNumber}
                          onChange={(e) => setPlateNumber(e.target.value)}
                          placeholder="KA-05-MM-1234"
                          className="w-full text-xs font-semibold p-2 bg-white border border-amber-300 rounded-[10px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Model</label>
                        <input
                          type="text"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder="Honda City"
                          className="w-full text-xs font-semibold p-2 bg-white border border-amber-300 rounded-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Color</label>
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          placeholder="Silver"
                          className="w-full text-xs font-semibold p-2 bg-white border border-amber-300 rounded-[10px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">DL Number</label>
                        <input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="DL-142011"
                          className="w-full text-xs font-semibold p-2 bg-white border border-amber-300 rounded-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-[#4B545A] mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#F7F8F9] border border-[#E4E9F2] rounded-[14px] focus:border-[#0045FF] focus:bg-white focus:outline-none text-[#222B45] placeholder-[#8F9BB3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4B545A] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#F7F8F9] border border-[#E4E9F2] rounded-[14px] focus:border-[#0045FF] focus:bg-white focus:outline-none text-[#222B45] placeholder-[#8F9BB3]"
              />
            </div>

            {/* FIGMA btn_main: 60px height, #0045FF, rounded-[16px] */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-[#0045FF] hover:bg-[#0038D1] text-white font-black rounded-[16px] text-sm transition shadow-lg shadow-blue-500/25 disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
            >
              <span>
                {isSubmitting
                  ? 'Processing...'
                  : mode === 'LOGIN'
                  ? 'Sign In to RideX'
                  : `Complete ${role === 'CUSTOMER' ? 'Rider' : 'Driver'} Registration`}
              </span>
              <span>➔</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};
