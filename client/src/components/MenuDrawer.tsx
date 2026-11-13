import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

/**
 * Figma Component: Menu (Canvas: ⚡️ Screens, Frame: Menu 312x813)
 * Electric Cobalt Blue (#1152FD) Top Banner with User Profile,
 * Pure White Body with Clean Rows and Icons.
 */
export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNav = (tabKey: string, route?: string) => {
    if (onSelectTab) onSelectTab(tabKey);
    const target = route ? route : `/customer?tab=${tabKey}`;
    navigate(target);
    onClose();
  };

  const handleSignOut = () => {
    logout();
    onClose();
    navigate('/auth');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Figma Blackout Overlay (rgba(62,73,88,0.6)) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#3E4958]/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <div className="w-80 sm:w-[320px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* FIGMA SECTION 1: Blue Profile Header (Height 230px, #1152FD) */}
          <div className="bg-gradient-to-br from-[#1152FD] via-[#0045FF] to-[#0137CA] p-6 text-white relative overflow-hidden flex flex-col justify-between h-56 flex-shrink-0">
            {/* Ambient circle glow */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                RideX Mobility
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* User Profile Info */}
            <div className="flex items-center space-x-3.5 mt-2">
              <div className="w-16 h-16 rounded-full bg-white/20 p-1 border-2 border-white/40 flex-shrink-0 shadow-md">
                <div className="w-full h-full rounded-full bg-white text-[#1152FD] flex items-center justify-center font-black text-xl">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="text-base font-bold text-white tracking-tight truncate">
                  {user?.name || 'Verified Rider'}
                </h3>
                <p className="text-xs text-blue-100 truncate">{user?.email || 'rider@ridex.com'}</p>
                <div className="flex items-center space-x-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white flex items-center space-x-1">
                    <span>★</span>
                    <span>4.9</span>
                  </span>
                  <span className="text-[10px] text-blue-200 font-semibold uppercase tracking-wider">
                    {user?.role || 'Customer'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FIGMA SECTION 2: White Menu Rows */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* 1. Book Ride */}
            <button
              type="button"
              onClick={() => handleNav('book')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${
                activeTab === 'book'
                  ? 'bg-[#EBF3FF] text-[#1152FD] font-bold'
                  : 'text-[#4B545A] hover:bg-[#F7F8F9] font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">🗺️</span>
                <span className="text-sm">Book a Ride</span>
              </div>
              <span className="text-[#97ADB6] text-sm">›</span>
            </button>

            {/* 2. Active Ride */}
            <button
              type="button"
              onClick={() => handleNav('active')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${
                activeTab === 'active'
                  ? 'bg-[#EBF3FF] text-[#1152FD] font-bold'
                  : 'text-[#4B545A] hover:bg-[#F7F8F9] font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">🚕</span>
                <span className="text-sm">Active Trip</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                Live
              </span>
            </button>

            {/* 3. Ride History */}
            <button
              type="button"
              onClick={() => handleNav('history')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${
                activeTab === 'history'
                  ? 'bg-[#EBF3FF] text-[#1152FD] font-bold'
                  : 'text-[#4B545A] hover:bg-[#F7F8F9] font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">📜</span>
                <span className="text-sm">Ride History</span>
              </div>
              <span className="text-[#97ADB6] text-sm">›</span>
            </button>

            {/* 4. Payment & Wallet */}
            <button
              type="button"
              onClick={() => handleNav('wallet')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${
                activeTab === 'wallet'
                  ? 'bg-[#EBF3FF] text-[#1152FD] font-bold'
                  : 'text-[#4B545A] hover:bg-[#F7F8F9] font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">💳</span>
                <span className="text-sm">Payment & Wallet</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#1152FD] font-bold">
                ₹{user?.wallet?.balance ?? 1250}
              </span>
            </button>

            {/* 5. Saved Places */}
            <button
              type="button"
              onClick={() => handleNav('places')}
              className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${
                activeTab === 'places'
                  ? 'bg-[#EBF3FF] text-[#1152FD] font-bold'
                  : 'text-[#4B545A] hover:bg-[#F7F8F9] font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">📍</span>
                <span className="text-sm">Saved Places</span>
              </div>
              <span className="text-[#97ADB6] text-sm">›</span>
            </button>

            {/* Role Navigators if Driver or Admin */}
            {user?.role === 'DRIVER' && (
              <button
                type="button"
                onClick={() => handleNav('driver', '/driver')}
                className="w-full p-3 rounded-2xl flex items-center justify-between text-left text-amber-800 hover:bg-amber-50 font-bold transition"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🚖</span>
                  <span className="text-sm">Driver Console</span>
                </div>
                <span className="text-xs text-amber-600 font-bold">Driver Mode</span>
              </button>
            )}

            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => handleNav('admin', '/admin')}
                className="w-full p-3 rounded-2xl flex items-center justify-between text-left text-indigo-800 hover:bg-indigo-50 font-bold transition"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🛡️</span>
                  <span className="text-sm">Admin Operations</span>
                </div>
                <span className="text-xs text-indigo-600 font-bold">Admin</span>
              </button>
            )}
          </div>

          {/* FIGMA FOOTER: Sign Out Link */}
          <div className="p-5 border-t border-[#EDF1F7] bg-[#F7F8F9] flex items-center justify-between">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-bold text-[#1152FD] hover:text-[#0045FF] transition flex items-center space-x-2"
            >
              <span>🚪</span>
              <span>Sign out</span>
            </button>
            <span className="text-[10px] text-[#97ADB6] font-mono">v2.4.0 • RideX Mobility</span>
          </div>
        </div>
      </div>
    </div>
  );
};
