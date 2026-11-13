import React from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleOOPModal?: () => void;
  isOOPModalOpen?: boolean;
  onOpenMenu?: () => void;
}

/**
 * Figma Component: navbar_x (Canvas: 💈 Components, Frame: navbar 660x209)
 * Clean White Surface with Circular Hamburger Button (ic_menu),
 * Electric Cobalt Blue (#0045FF) Badge, and Modern Status Indicators.
 */
export const Navbar: React.FC<NavbarProps> = ({ onToggleOOPModal, onOpenMenu }) => {
  const { user, roleConfig, logout } = useAuth();

  return (
    <header className="bg-white border-b border-[#EDF1F7] sticky top-0 z-40 shadow-xs text-[#222B45]">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Circular Hamburger Button (ic_menu) + Brand Logo */}
        <div className="flex items-center space-x-3">
          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="w-10 h-10 rounded-full bg-[#F7F8F9] hover:bg-[#EBF3FF] border border-[#EDF1F7] flex items-center justify-center text-[#222B45] hover:text-[#0045FF] transition shadow-xs group"
              title="Open Navigation Menu"
            >
              <div className="space-y-1 w-4">
                <span className="block h-0.5 w-4 bg-[#4B545A] group-hover:bg-[#0045FF] rounded-full transition" />
                <span className="block h-0.5 w-3 bg-[#4B545A] group-hover:bg-[#0045FF] rounded-full transition" />
                <span className="block h-0.5 w-4 bg-[#4B545A] group-hover:bg-[#0045FF] rounded-full transition" />
              </div>
            </button>
          )}

          {/* Figma Logo Brand: Electric Cobalt Blue #0045FF */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#0045FF] flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20 tracking-wider">
              RX
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-[#222B45] tracking-tight">Ride</span>
              <span className="text-xl font-black text-[#0045FF]">X</span>
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EBF3FF] text-[#0045FF] border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0045FF] mr-1.5 animate-pulse" />
                Live Mobility
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Wallet/Earnings Pill, User Profile, Logout */}
        <div className="flex items-center space-x-3">
          {user && roleConfig && (
            <>
              {/* Customer Wallet Pill */}
              {user.role === 'CUSTOMER' && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#EBF3FF] text-[#0045FF] rounded-[12px] text-xs font-bold border border-blue-200 shadow-xs">
                  <span>💳</span>
                  <span>₹{user.wallet?.balance ?? 1250}</span>
                </div>
              )}

              {/* Driver Earnings Pill */}
              {user.role === 'DRIVER' && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-[12px] text-xs font-bold border border-amber-200 shadow-xs">
                  <span>💰</span>
                  <span>₹{user.earnings ?? 4850}</span>
                </div>
              )}

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-2 pl-2 border-l border-[#EDF1F7]">
                <div className="w-8 h-8 rounded-full bg-[#0045FF] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-[#222B45] hidden lg:inline">{user.name}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="px-2.5 py-1 text-xs font-semibold text-[#8F9BB3] hover:text-[#222B45] hover:bg-[#F7F8F9] rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}

          {/* Discreet Architecture Inspector Pill */}
          {onToggleOOPModal && (
            <button
              onClick={onToggleOOPModal}
              title="Inspect Domain Architecture Logs"
              className="text-xs px-2.5 py-1 bg-[#F7F8F9] hover:bg-[#EDF1F7] text-[#8F9BB3] hover:text-[#0045FF] rounded-[10px] border border-[#EDF1F7] transition font-bold"
            >
              <span>Architecture</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
