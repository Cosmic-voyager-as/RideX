import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

interface RideChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideId: string;
  recipientName: string;
  recipientRole: 'CUSTOMER' | 'DRIVER';
  recipientVehiclePlate?: string;
}

export const RideChatModal: React.FC<RideChatModalProps> = ({
  isOpen,
  onClose,
  rideId,
  recipientName,
  recipientRole,
  recipientVehiclePlate
}) => {
  const { user } = useAuth();
  const { chatMessages, sendChatMessage } = useSocket();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Filter messages for this active ride
  const currentRideMessages = chatMessages.filter((m) => m.rideId === rideId);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, currentRideMessages.length]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(rideId, inputText);
    setInputText('');
  };

  const isCurrentCustomer = user?.role !== 'DRIVER';

  const quickReplies = isCurrentCustomer
    ? [
        "I'm at the pickup spot",
        "Wearing a black jacket",
        "Please take the main gate entrance",
        "Waiting near the landmark"
      ]
    : [
        "On my way! Arriving in 2 mins",
        "I have arrived at the pickup location",
        "Traffic is a bit heavy, almost there",
        "Please have your 4-digit PIN ready"
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md h-[85vh] sm:h-[620px] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden border border-[#EDF1F7]">
        {/* MODAL HEADER */}
        <div className="p-4 bg-white border-b border-[#EDF1F7] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#EBF3FF] text-[#0045FF] font-bold flex items-center justify-center text-sm shadow-xs border border-blue-100">
                {recipientRole === 'DRIVER' ? '🚖' : '👤'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="text-sm font-bold text-[#222B45]">{recipientName}</h4>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#EBF3FF] text-[#0045FF]">
                  {recipientRole}
                </span>
              </div>
              <div className="text-[11px] text-[#8F9BB3] font-mono">
                {recipientVehiclePlate ? `${recipientVehiclePlate} • ` : ''}RideX In-App Chat
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F8F9] hover:bg-[#EDF1F7] text-[#8F9BB3] hover:text-[#222B45] flex items-center justify-center transition text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* MESSAGES SCROLL AREA */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F8F9]">
          {/* Welcome Prompt */}
          <div className="text-center py-2">
            <span className="text-[10px] text-[#8F9BB3] bg-white border border-[#EDF1F7] px-3 py-1 rounded-full shadow-2xs font-medium">
              🔒 End-to-end encrypted RideX driver communication
            </span>
          </div>

          {currentRideMessages.length === 0 ? (
            <div className="py-12 text-center text-[#8F9BB3] text-xs">
              <span className="text-2xl block mb-2">💬</span>
              <span>No messages yet. Send a quick update or choose a suggested reply below!</span>
            </div>
          ) : (
            currentRideMessages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-4 py-2.5 text-xs rounded-2xl shadow-2xs transition leading-relaxed ${
                      isMine
                        ? 'bg-[#0045FF] text-white rounded-br-xs font-medium'
                        : 'bg-white text-[#222B45] border border-[#EDF1F7] rounded-bl-xs font-medium'
                    }`}
                  >
                    <p>{msg.message}</p>
                  </div>
                  <div className="flex items-center space-x-1 mt-1 px-1">
                    <span className="text-[9px] text-[#8F9BB3]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && <span className="text-[9px] text-blue-500 font-bold">✓✓</span>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK SUGGESTION CHIPS */}
        <div className="px-3 py-2 bg-white border-t border-[#EDF1F7] overflow-x-auto flex space-x-1.5 scrollbar-none">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                sendChatMessage(rideId, reply);
              }}
              className="text-[11px] whitespace-nowrap px-3 py-1 bg-[#F7F8F9] hover:bg-[#EBF3FF] hover:text-[#0045FF] text-[#4B545A] rounded-full border border-[#EDF1F7] font-medium transition shrink-0"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* MESSAGE INPUT BAR */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#EDF1F7] flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 bg-[#F7F8F9] border border-[#EDF1F7] rounded-full text-xs text-[#222B45] focus:outline-hidden focus:border-[#0045FF] focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-[#0045FF] hover:bg-[#0038D1] text-white flex items-center justify-center disabled:opacity-40 shadow-md shadow-blue-500/25 transition shrink-0"
          >
            <span className="text-sm font-bold">➔</span>
          </button>
        </form>
      </div>
    </div>
  );
};
