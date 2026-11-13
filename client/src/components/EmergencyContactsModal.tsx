import React, { useState } from 'react';
import { EmergencyContact } from '../types';

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  onAddContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
  onTriggerSosWithMessage: () => void;
}

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onAddContact,
  onDeleteContact,
  onTriggerSosWithMessage
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Parent');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onAddContact({
      name: name.trim(),
      phone: phone.trim(),
      relationship
    });

    setName('');
    setPhone('');
    setRelationship('Parent');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-[#222B45] w-full max-w-md rounded-[28px] p-6 shadow-2xl flex flex-col relative overflow-hidden border border-[#EDF1F7]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDF1F7]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-lg">
              🛡️
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222B45]">Emergency SOS Contacts</h3>
              <p className="text-[11px] text-[#8F9BB3]">
                SOS will send direct messages with your live GPS location link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F8F9] hover:bg-[#EDF1F7] text-[#8F9BB3] hover:text-[#222B45] flex items-center justify-center transition font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Contacts List */}
        <div className="py-4 space-y-2.5 max-h-72 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="py-8 text-center text-[#8F9BB3] text-xs">
              <span className="text-2xl block mb-2">👤</span>
              <span>No emergency contacts added yet. Add your trusted contacts below.</span>
            </div>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-[#F7F8F9] rounded-[18px] border border-[#EDF1F7] flex items-center justify-between transition hover:border-slate-300"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#EDF1F7] flex items-center justify-center text-sm font-bold text-[#0045FF] shadow-2xs">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-[#222B45]">{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#EBF3FF] text-[#0045FF]">
                        {c.relationship}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-[#8F9BB3]">
                      {c.phone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <a
                    href={`tel:${c.phone.replace(/[\s-]/g, '')}`}
                    className="p-2 bg-white hover:bg-emerald-50 text-emerald-600 rounded-[10px] border border-[#EDF1F7] transition text-xs"
                    title="Direct Call"
                  >
                    📞
                  </a>
                  <button
                    type="button"
                    onClick={() => onDeleteContact(c.id)}
                    className="p-2 bg-white hover:bg-rose-50 text-rose-500 rounded-[10px] border border-[#EDF1F7] transition text-xs font-bold"
                    title="Remove Contact"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Contact Form or Trigger Button */}
        {showAddForm ? (
          <form onSubmit={handleSubmit} className="p-4 bg-[#F7F8F9] rounded-[20px] border border-[#EDF1F7] space-y-3 mb-2">
            <span className="text-xs font-bold text-[#222B45] block">Add New Emergency Contact</span>
            <div>
              <label className="block text-[10px] font-bold text-[#8F9BB3] uppercase mb-0.5">Contact Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#E4E9F2] rounded-[10px] text-[#222B45] focus:outline-none focus:border-[#0045FF]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-[#8F9BB3] uppercase mb-0.5">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#E4E9F2] rounded-[10px] text-[#222B45]"
                >
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Guardian">Guardian</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#8F9BB3] uppercase mb-0.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00099"
                  className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#E4E9F2] rounded-[10px] text-[#222B45] focus:outline-none focus:border-[#0045FF]"
                />
              </div>
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 bg-white hover:bg-slate-100 text-[#4B545A] font-bold rounded-[10px] text-xs border border-[#EDF1F7] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-[#0045FF] hover:bg-[#0038D1] text-white font-bold rounded-[10px] text-xs shadow-md transition"
              >
                Save Contact
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 bg-[#F7F8F9] hover:bg-[#EBF3FF] hover:text-[#0045FF] text-[#4B545A] font-bold rounded-[14px] text-xs border border-[#EDF1F7] transition mb-3 flex items-center justify-center space-x-1.5"
          >
            <span>➕ Add Emergency Contact</span>
          </button>
        )}

        {/* SOS Action Footer */}
        <div className="pt-2 border-t border-[#EDF1F7] flex space-x-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onTriggerSosWithMessage();
            }}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-[14px] text-xs shadow-md shadow-rose-600/30 transition flex items-center justify-center space-x-2"
          >
            <span>🚨</span>
            <span>Trigger SOS & Send Location Link Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

