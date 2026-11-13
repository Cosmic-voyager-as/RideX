import React, { useState, useEffect } from 'react';
import { useOOP } from '../context/OOPContext';
import { adminApi, AdminAnalytics, SosAlert } from '../services/AdminApiService';
import { Map } from '../components/Map';
import { UserProfile, RideData } from '../types';

/**
 * Figma Component: Admin Dashboard (Canvas: ⚡️ Screens)
 * Adheres strictly to RideX Figma Design System:
 * - Electric Cobalt Blue (#0045FF / #1152FD)
 * - Canvas Background (#F7F8F9)
 * - White Surface Cards (#FFFFFF, rounded-[24px], border #EDF1F7)
 * - Dark Charcoal Status Passes (#3E4958)
 * - Subnav Pill Tabs (#EBF3FF active state)
 */
export const AdminDashboard: React.FC = () => {
  const { logOOPEvent } = useOOP();

  const [activeTab, setActiveTab] = useState<'analytics' | 'strategy' | 'fleet' | 'users' | 'rides' | 'sos'>('analytics');

  // Admin Data States
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rides, setRides] = useState<RideData[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<'NEAREST' | 'HIGHEST_RATED' | 'BALANCED'>('NEAREST');
  const [strategyMessage, setStrategyMessage] = useState<string | null>(null);

  // Load Admin Data
  const loadData = async () => {
    try {
      const [anData, uData, rData, sData] = await Promise.all([
        adminApi.getAnalytics().catch(() => null),
        adminApi.getUsers().catch(() => []),
        adminApi.getRides().catch(() => []),
        adminApi.getSosAlerts().catch(() => [])
      ]);

      if (anData) setAnalytics(anData);
      setUsers(uData);
      setRides(rData);
      setSosAlerts(sData);
    } catch (e) {
      console.warn('Failed to load admin data:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Polling every 10s for admin console
    return () => clearInterval(interval);
  }, []);

  // Strategy Switcher Handler (Polymorphism)
  const handleStrategyChange = async (strategy: 'NEAREST' | 'HIGHEST_RATED' | 'BALANCED') => {
    try {
      const res = await adminApi.setMatchingStrategy(strategy);
      setSelectedStrategy(strategy);
      setStrategyMessage(res.message);
      setTimeout(() => setStrategyMessage(null), 4000);

      logOOPEvent(
        'Polymorphism',
        `Admin Switched IMatchingStrategy -> ${strategy}`,
        `DispatchService relies exclusively on IMatchingStrategy contract. Algorithm dynamically switched at runtime without restart.`,
        `dispatchService.setMatchingStrategy(new ${strategy === 'NEAREST' ? 'NearestDriverStrategy' : strategy === 'HIGHEST_RATED' ? 'HighestRatedStrategy' : 'BalancedStrategy'}());`
      );
    } catch (err: any) {
      alert(`Strategy switch failed: ${err.message}`);
    }
  };

  // Block / Unblock User
  const handleToggleBlock = async (userId: string, currentBlocked: boolean = false) => {
    try {
      await adminApi.blockUser(userId, !currentBlocked);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBlocked: !currentBlocked } as any : u))
      );

      logOOPEvent(
        'Encapsulation',
        `Admin.manageUsers() - User Access Guard`,
        `User ${userId} access toggled to ${!currentBlocked ? 'BLOCKED' : 'ACTIVE'}. Enforces security invariants across controllers.`,
        `admin.manageUsers(userRepository, "${userId}", ${!currentBlocked});`
      );
    } catch (err: any) {
      alert(`User update failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F9] flex flex-col font-sans text-[#222B45]">
      {/* SUBNAV TAB NAVIGATION (Figma Tabs Bar) */}
      <div className="bg-white border-b border-[#EDF1F7] sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between overflow-x-auto">
          <div className="flex space-x-2">
            {[
              { id: 'analytics', label: 'Platform Analytics', icon: '📊' },
              { id: 'strategy', label: 'Matching & Surge', icon: '⚙️' },
              { id: 'fleet', label: 'Live Fleet Map', icon: '🗺️' },
              { id: 'users', label: 'User Governance', icon: '👥', badge: users.length },
              { id: 'rides', label: 'Ride Audits', icon: '📋', badge: rides.length },
              { id: 'sos', label: 'Emergency SOS', icon: '🚨', badge: sosAlerts.length ? `${sosAlerts.length} Alerts` : null }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-[12px] transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#EBF3FF] text-[#0045FF] border border-blue-200 shadow-xs'
                    : 'text-[#4B545A] hover:bg-[#F7F8F9]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-[#0045FF] text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-[#8F9BB3]">
            <span>Admin Console</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0045FF]" />
            <span className="text-[#0045FF]">Bangalore Metro</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-[22px] shadow-sm border border-[#EDF1F7]">
                <span className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                  Platform Commission (20%)
                </span>
                <div className="text-3xl font-black text-[#0045FF] mt-1 tracking-tight">
                  ₹{analytics?.financials?.estimatedPlatformRevenue ?? 1280}
                </div>
                <div className="text-[11px] text-[#4B545A] font-medium mt-1">
                  Gross Fares: ₹{analytics?.financials?.totalPlatformGrossFare ?? 6400}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[22px] shadow-sm border border-[#EDF1F7]">
                <span className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                  Registered Fleet
                </span>
                <div className="text-3xl font-black text-[#222B45] mt-1 tracking-tight">
                  {analytics?.users?.drivers ?? 5} Drivers
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1">
                  {analytics?.users?.customers ?? 5} Active Riders
                </div>
              </div>

              <div className="bg-white p-6 rounded-[22px] shadow-sm border border-[#EDF1F7]">
                <span className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                  Completed Rides
                </span>
                <div className="text-3xl font-black text-[#222B45] mt-1 tracking-tight">
                  {analytics?.rides?.completed ?? 12} Trips
                </div>
                <div className="text-[11px] text-[#4B545A] font-medium mt-1">
                  Active in Transit: {analytics?.rides?.active ?? 1}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[22px] shadow-sm border border-[#EDF1F7]">
                <span className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                  Active Matching Engine
                </span>
                <div className="text-xl font-black text-[#0045FF] mt-2 truncate">
                  {selectedStrategy}
                </div>
                <div className="text-[11px] text-[#8F9BB3] font-medium mt-0.5">Polymorphic IMatchingStrategy</div>
              </div>
            </div>

            {/* Architecture Invariants Card (Figma Dark Charcoal #3E4958 Pass) */}
            <div className="bg-[#3E4958] text-white rounded-[24px] p-7 shadow-lg space-y-4">
              <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider">
                <span>🧬</span>
                <span>RideX OOP Engineering Principles Active</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
                <div className="p-4 bg-white/10 rounded-[16px] border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-emerald-300">🛡️ Encapsulation</div>
                  <div className="text-[11px] text-gray-200 leading-relaxed">
                    Wallet balances & User hashes protected by strictly validated accessors.
                  </div>
                </div>
                <div className="p-4 bg-white/10 rounded-[16px] border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-purple-300">🧬 Inheritance</div>
                  <div className="text-[11px] text-gray-200 leading-relaxed">
                    User &rarr; Customer, Driver, Admin; Vehicle &rarr; Bike, Auto, Sedan, SUV, Lux.
                  </div>
                </div>
                <div className="p-4 bg-white/10 rounded-[16px] border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-blue-300">🔌 Abstraction</div>
                  <div className="text-[11px] text-gray-200 leading-relaxed">
                    Services depend only on interfaces (IRepository&lt;T&gt;, IPricingStrategy).
                  </div>
                </div>
                <div className="p-4 bg-white/10 rounded-[16px] border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-rose-300">🎭 Polymorphism</div>
                  <div className="text-[11px] text-gray-200 leading-relaxed">
                    Runtime strategy swapper, PaymentProcessor, and dynamic fare calculations.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATCHING & SURGE STRATEGY */}
        {activeTab === 'strategy' && (
          <div className="max-w-3xl mx-auto bg-white rounded-[24px] p-7 shadow-sm border border-[#EDF1F7] space-y-6">
            <div>
              <span className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                Runtime Strategy Engine
              </span>
              <h3 className="text-base font-bold text-[#222B45] tracking-tight">Driver Matching Strategy Swapper</h3>
              <p className="text-xs text-[#4B545A] mt-1 leading-relaxed">
                Demonstrates the <b>Strategy Pattern</b> and <b>Polymorphism</b>: RideService interacts exclusively with the abstract <code className="font-mono text-[#0045FF] bg-[#EBF3FF] px-1.5 py-0.5 rounded">IMatchingStrategy</code> interface. Swapping strategies changes dispatch behavior immediately without altering business logic.
              </p>
            </div>

            {strategyMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-[14px] text-center">
                {strategyMessage}
              </div>
            )}

            <div className="space-y-3">
              {[
                {
                  id: 'NEAREST',
                  title: 'NearestDriverStrategy',
                  subtitle: 'Haversine Geographic Proximity',
                  desc: 'Ranks available drivers strictly by physical distance to pickup coordinates.'
                },
                {
                  id: 'HIGHEST_RATED',
                  title: 'HighestRatedStrategy',
                  subtitle: 'Driver Rating Priority',
                  desc: 'Ranks available drivers strictly by their historical passenger rating average (★).'
                },
                {
                  id: 'BALANCED',
                  title: 'BalancedStrategy',
                  subtitle: 'Multi-Objective Composite Score',
                  desc: 'Computes a composite score = (Rating × 2) - DistanceKm to achieve optimal rider experience.'
                }
              ].map((strat) => (
                <div
                  key={strat.id}
                  onClick={() => handleStrategyChange(strat.id as any)}
                  className={`p-5 rounded-[18px] border cursor-pointer transition flex items-center justify-between ${
                    selectedStrategy === strat.id
                      ? 'bg-[#EBF3FF] border-[#0045FF] shadow-xs'
                      : 'bg-white border-[#EDF1F7] hover:bg-[#F7F8F9]'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-[#222B45]">{strat.title}</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-white text-[#0045FF] border border-blue-200">
                        {strat.subtitle}
                      </span>
                    </div>
                    <p className="text-xs text-[#4B545A] mt-1">{strat.desc}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedStrategy === strat.id
                        ? 'border-[#0045FF] bg-[#0045FF] text-white'
                        : 'border-[#EDF1F7]'
                    }`}
                  >
                    {selectedStrategy === strat.id && <span className="text-xs font-bold">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FLEET MAP */}
        {activeTab === 'fleet' && (
          <div className="bg-white rounded-[24px] shadow-sm border border-[#EDF1F7] overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 bg-[#F7F8F9] border-b border-[#EDF1F7] flex items-center justify-between">
              <span className="text-xs font-bold text-[#222B45]">Bangalore Real-Time Fleet Dispatch Telemetry</span>
              <span className="text-[11px] text-[#0045FF] font-bold">Active Fleet: 5 Drivers Online</span>
            </div>
            <div className="flex-1 relative">
              <Map
                pickup={{ latitude: 12.9716, longitude: 77.5946 }}
                driversNearby={[
                  { id: 'd1', name: 'Manoj Kumar', latitude: 12.9784, longitude: 77.6408, vehicleType: 'Sedan' },
                  { id: 'd2', name: 'Priya Sharma', latitude: 12.9352, longitude: 77.6245, vehicleType: 'Auto' },
                  { id: 'd3', name: 'Arjun Das', latitude: 12.9756, longitude: 77.6066, vehicleType: 'Bike' },
                  { id: 'd4', name: 'Rajesh Nair', latitude: 12.9698, longitude: 77.7499, vehicleType: 'SUV' },
                  { id: 'd5', name: 'Deepa Verma', latitude: 12.9279, longitude: 77.6271, vehicleType: 'Premium' }
                ]}
                height="100%"
              />
            </div>
          </div>
        )}

        {/* TAB 4: USERS GOVERNANCE */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-[24px] p-7 shadow-sm border border-[#EDF1F7] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                  Identity & Access Management
                </span>
                <h3 className="text-base font-bold text-[#222B45]">User Governance & Access Control</h3>
              </div>
              <span className="text-xs text-[#8F9BB3] font-bold">Total: {users.length} Users</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#4B545A]">
                <thead className="bg-[#F7F8F9] text-[#8F9BB3] uppercase font-bold text-[11px] border-b border-[#EDF1F7]">
                  <tr>
                    <th className="p-3.5 rounded-l-[12px]">User</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Permissions</th>
                    <th className="p-3.5 text-right rounded-r-[12px]">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF1F7] font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F7F8F9]/60 transition">
                      <td className="p-3.5 font-bold text-[#222B45]">{u.name}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            u.role === 'CUSTOMER'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.role === 'DRIVER'
                              ? 'bg-[#EBF3FF] text-[#0045FF] border border-blue-200'
                              : 'bg-[#3E4958] text-white'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[#4B545A]">{u.email}</td>
                      <td className="p-3.5">{u.phone}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-mono text-[#8F9BB3]">
                          {u.permissions?.join(', ') || 'READ'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(u.id, (u as any).isBlocked)}
                            className={`px-3 py-1 rounded-[10px] text-xs font-bold transition shadow-xs ${
                              (u as any).isBlocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            {(u as any).isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: RIDE AUDITS */}
        {activeTab === 'rides' && (
          <div className="bg-white rounded-[24px] p-7 shadow-sm border border-[#EDF1F7] space-y-5">
            <div>
              <span className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                Immutable Ledger
              </span>
              <h3 className="text-base font-bold text-[#222B45]">Ride State Machine Audit Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#4B545A]">
                <thead className="bg-[#F7F8F9] text-[#8F9BB3] uppercase font-bold text-[11px] border-b border-[#EDF1F7]">
                  <tr>
                    <th className="p-3.5 rounded-l-[12px]">Ride ID</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Distance / Duration</th>
                    <th className="p-3.5 text-right rounded-r-[12px]">Total Fare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF1F7] font-medium">
                  {rides.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F7F8F9]/60 transition">
                      <td className="p-3.5 font-mono font-bold text-[#222B45]">{r.id.slice(0, 8)}...</td>
                      <td className="p-3.5 font-bold text-[#222B45]">{r.rideType}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-[#EBF3FF] text-[#0045FF] border border-blue-200">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5">{r.distanceKm} km • {r.durationMin} mins</td>
                      <td className="p-3.5 font-bold text-right text-emerald-600">₹{r.fare?.total ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SOS ALERTS */}
        {activeTab === 'sos' && (
          <div className="bg-white rounded-[24px] p-7 shadow-sm border border-[#EDF1F7] space-y-5">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚨</span>
              <h3 className="text-base font-bold text-[#222B45]">Emergency SOS Distress Broadcasts</h3>
            </div>

            {sosAlerts.length === 0 ? (
              <div className="text-center py-12 text-[#8F9BB3] text-xs">
                No active SOS distress signals. Fleet operations are running normally.
              </div>
            ) : (
              <div className="space-y-3">
                {sosAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 bg-red-50 border border-red-200 rounded-[18px] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-red-900">
                        Ride ID: {alert.rideId} • Triggered by: {alert.triggeredBy}
                      </div>
                      <div className="text-[11px] text-red-700 mt-0.5">Reason: {alert.reason}</div>
                      <div className="text-[10px] text-[#8F9BB3] font-mono mt-1">{alert.createdAt}</div>
                    </div>
                    <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold shadow-xs">
                      ACTIVE EMERGENCY
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
