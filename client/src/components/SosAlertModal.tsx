import React from 'react';
import { EmergencyContact } from '../types';

interface SosAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  locationLink: string;
  tripId?: string;
  latitude: number;
  longitude: number;
}

export const SosAlertModal: React.FC<SosAlertModalProps> = ({
  isOpen,
  onClose,
  contacts,
  locationLink,
  tripId = 'Active Ride',
  latitude,
  longitude
}) => {
  if (!isOpen) return null;

  const sosMessageText = `🚨 EMERGENCY ALERT: I am in distress on my RideX ride (Trip ID: ${tripId}). Live Location: ${locationLink} (Lat: ${latitude}, Lng: ${longitude}). Please send emergency assistance immediately!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white text-[#222B45] w-full max-w-md rounded-[28px] p-6 shadow-2xl flex flex-col relative overflow-hidden border border-red-200">
        {/* Pulsing Alert Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-red-100">
          <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-rose-600/40 animate-bounce">
            🚨
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 inline-block mb-0.5">
              Distress Signal Broadcast
            </span>
            <h3 className="text-lg font-black text-rose-900 tracking-tight">
              SOS Alert Dispatched
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#4B545A] flex items-center justify-center transition font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Live GPS Coordinates Banner */}
        <div className="my-3.5 p-3.5 bg-rose-50 rounded-[18px] border border-rose-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-rose-900">Live GPS Coordinates:</span>
            <span className="font-mono text-rose-700 font-bold">{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
          </div>
          <a
            href={locationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-white hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-[10px] border border-rose-300 flex items-center justify-center space-x-1.5 transition shadow-2xs"
          >
            <span>📍 Open Live Location in Google Maps</span>
            <span>➔</span>
          </a>
        </div>

        {/* Notification Status */}
        <div className="space-y-1 mb-3">
          <span className="text-xs font-bold text-[#222B45] block">
            Direct Messages Dispatched To Emergency Contacts:
          </span>
          <p className="text-[11px] text-[#8F9BB3]">
            Location link was transmitted via SMS & WhatsApp to your registered contacts:
          </p>
        </div>

        {/* Contact Dispatch Cards */}
        <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
          {contacts.map((c) => {
            const cleanPhone = c.phone.replace(/[\s-]/g, '');
            const digits = cleanPhone.replace(/[^0-9]/g, '');
            return (
              <div
                key={c.id}
                className="p-3 bg-[#F7F8F9] rounded-[16px] border border-[#EDF1F7] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-[#222B45]">{c.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-[#EBF3FF] text-[#0045FF]">
                      {c.relationship}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-[#8F9BB3]">{c.phone}</div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <a
                    href={`sms:${cleanPhone}?body=${encodeURIComponent(sosMessageText)}`}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-[#0045FF] rounded-[10px] border border-[#EDF1F7] text-[10px] font-bold transition flex items-center space-x-1"
                  >
                    <span>💬</span>
                    <span>SMS</span>
                  </a>
                  <a
                    href={`https://wa.me/${digits}?text=${encodeURIComponent(sosMessageText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] text-[10px] font-bold transition flex items-center space-x-1 shadow-2xs"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Emergency Services Direct Helpline */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <a
            href="tel:112"
            className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-[14px] text-xs shadow-md shadow-red-700/30 flex items-center justify-center space-x-2 transition"
          >
            <span className="text-base">🚨</span>
            <span>Direct Call National Emergency Helpline (112)</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-[#8F9BB3] hover:text-[#222B45] font-semibold transition"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};

