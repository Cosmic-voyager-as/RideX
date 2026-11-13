import React, { useState } from 'react';
import { useOOP } from '../context/OOPContext';

interface OOPInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OOPInspector: React.FC<OOPInspectorProps> = ({ isOpen, onClose }) => {
  const { events, clearEvents } = useOOP();
  const [filter, setFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredEvents = filter === 'ALL' ? events : events.filter((e) => e.principle === filter);

  const getPrincipleBadge = (principle: string) => {
    switch (principle) {
      case 'Encapsulation':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Inheritance':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Abstraction':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Polymorphism':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPrincipleIcon = (principle: string) => {
    switch (principle) {
      case 'Encapsulation':
        return '🛡️';
      case 'Inheritance':
        return '🧬';
      case 'Abstraction':
        return '🔌';
      case 'Polymorphism':
        return '🎭';
      default:
        return '⚙️';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-slide-left border-l border-gray-200">
        {/* Header */}
        <div className="p-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🧬</span>
            <div>
              <h2 className="text-base font-bold tracking-tight">Live OOP Architecture Inspector</h2>
              <p className="text-xs text-gray-400">
                Visualizing Encapsulation, Inheritance, Abstraction & Polymorphism
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 flex items-center justify-center font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
            {['ALL', 'Encapsulation', 'Inheritance', 'Abstraction', 'Polymorphism'].map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                  filter === p
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={clearEvents}
            className="text-xs text-gray-500 hover:text-red-600 hover:underline font-medium"
          >
            Clear Log
          </button>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No OOP events captured for this filter yet.
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center space-x-1 text-xs px-2.5 py-0.5 rounded-full font-bold border ${getPrincipleBadge(
                      evt.principle
                    )}`}
                  >
                    <span>{getPrincipleIcon(evt.principle)}</span>
                    <span>{evt.principle}</span>
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">{evt.timestamp}</span>
                </div>

                <h4 className="text-sm font-bold text-gray-900">{evt.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{evt.description}</p>

                {evt.codeSnippet && (
                  <pre className="text-[11px] font-mono bg-gray-900 text-green-400 p-2.5 rounded-lg overflow-x-auto border border-gray-800">
                    <code>{evt.codeSnippet}</code>
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick OOP Reference Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="font-bold text-emerald-700">🛡️ Encapsulation:</span> Private state with validated accessors.
            </div>
            <div>
              <span className="font-bold text-purple-700">🧬 Inheritance:</span> Concrete is-a specializations.
            </div>
            <div>
              <span className="font-bold text-blue-700">🔌 Abstraction:</span> Contracts isolating callers from details.
            </div>
            <div>
              <span className="font-bold text-rose-700">🎭 Polymorphism:</span> Dynamic dispatch without type branching.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

