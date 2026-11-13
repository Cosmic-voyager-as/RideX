import React, { useEffect, useState } from 'react';

interface RideCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  recipientName: string;
  recipientRole: 'CUSTOMER' | 'DRIVER';
  recipientPhone?: string;
  recipientVehiclePlate?: string;
}

export const RideCallModal: React.FC<RideCallModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  recipientRole,
  recipientPhone = '+919876500024',
  recipientVehiclePlate
}) => {
  const [copied, setCopied] = useState(false);

  // Clean formatted phone number for tel: link
  const cleanPhone = recipientPhone.replace(/[\s-]/g, '');
  const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');

  // Directly trigger mobile/desktop dialer when modal is opened
  useEffect(() => {
    if (isOpen && cleanPhone) {
      try {
        window.location.href = `tel:${cleanPhone}`;
      } catch (e) {
        console.warn('Direct tel: trigger notice:', e);
      }
    }
  }, [isOpen, cleanPhone]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-[#222B45] w-full max-w-sm rounded-[28px] p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden border border-[#EDF1F7]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F7F8F9] hover:bg-[#EDF1F7] text-[#8F9BB3] hover:text-[#222B45] flex items-center justify-center transition font-bold text-sm"
        >
          ✕
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Direct Cellular Call Connected</span>
        </div>

        {/* Recipient Avatar */}
        <div className="w-20 h-20 rounded-full bg-[#EBF3FF] text-[#0045FF] border-2 border-[#0045FF]/20 flex items-center justify-center text-3xl shadow-md mb-3">
          {recipientRole === 'DRIVER' ? '🚖' : '👤'}
        </div>

        {/* Recipient Details */}
        <h3 className="text-lg font-black text-[#222B45] tracking-tight">{recipientName}</h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F7F8F9] text-[#8F9BB3] font-bold mt-1 uppercase">
          Verified Registered {recipientRole}
        </span>

        {recipientVehiclePlate && (
          <div className="text-xs font-mono font-bold text-[#4B545A] mt-1 bg-[#F7F8F9] px-2.5 py-1 rounded-md border border-[#EDF1F7]">
            {recipientVehiclePlate}
          </div>
        )}

        {/* Direct Registered Phone Number Display */}
        <div className="w-full my-4 p-4 bg-[#F7F8F9] rounded-[20px] border border-[#EDF1F7]">
          <span className="text-[10px] uppercase font-bold text-[#8F9BB3] block mb-1">
            Registered Mobile Number
          </span>
          <div className="text-xl font-mono font-black text-[#0045FF] tracking-wider">
            {recipientPhone}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] font-bold text-[#8F9BB3] hover:text-[#0045FF] mt-1 inline-flex items-center space-x-1"
          >
            <span>{copied ? '✓ Copied to clipboard' : '📋 Copy Number'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-1">
          {/* Direct Cellular Call */}
          <a
            href={`tel:${cleanPhone}`}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[16px] text-xs transition shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2"
          >
            <span className="text-base">📞</span>
            <span>Direct Cellular Call ({cleanPhone})</span>
          </a>

          {/* WhatsApp Direct Call / Chat */}
          <a
            href={`https://wa.me/${digitsOnly}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold rounded-[16px] text-xs transition flex items-center justify-center space-x-2 shadow-xs"
          >
            <span className="text-base">💬</span>
            <span>WhatsApp Direct Message / Call</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs text-[#8F9BB3] hover:text-[#222B45] font-semibold transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
