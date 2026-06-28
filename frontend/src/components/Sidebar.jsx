import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sprout, 
  Warehouse, 
  TrendingUp, 
  Map, 
  ShieldAlert, 
  History,
  FileText,
  UserCheck,
  PlusCircle,
  Activity
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user } = useApp();

  if (!user) return null;

  const farmerTabs = [
    { id: 'listings', name: 'My Crop Listings', icon: Sprout },
    { id: 'requests', name: 'Storage Requests', icon: Warehouse },
    { id: 'orders', name: 'Sales Orders', icon: TrendingUp },
    { id: 'map', name: 'Geospatial Map', icon: Map },
    { id: 'emergency', name: 'Emergency Evacuation', icon: ShieldAlert },
    { id: 'simulator', name: 'Disaster Simulator', icon: Activity }
  ];

  const storageTabs = [
    { id: 'capacity', name: 'Capacity Control', icon: Activity },
    { id: 'incoming', name: 'Request Dashboard', icon: FileText },
    { id: 'map', name: 'Geospatial Map', icon: Map },
    { id: 'emergency', name: 'Disaster Evacuations', icon: ShieldAlert },
    { id: 'simulator', name: 'Disaster Simulator', icon: Activity }
  ];

  const distributorTabs = [
    { id: 'sourcing', name: 'Direct Crop Sourcing', icon: Sprout },
    { id: 'reservations', name: 'My Purchases', icon: TrendingUp },
    { id: 'map', name: 'Geospatial Map', icon: Map },
    { id: 'emergency', name: 'Supply Warnings', icon: ShieldAlert },
    { id: 'simulator', name: 'Disaster Simulator', icon: Activity }
  ];

  const getTabs = () => {
    switch (user.role) {
      case 'farmer': return farmerTabs;
      case 'storage': return storageTabs;
      case 'distributor': return distributorTabs;
      default: return [];
    }
  };

  const tabs = getTabs();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:sticky top-[57px] lg:top-[65px] left-0 z-40 h-[calc(100vh-57px)] lg:h-[calc(100vh-65px)] w-64 glass-panel border-r border-white/10 p-4 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="space-y-6">
          {/* User Profile Summary */}
          <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold uppercase">
              {user.name.substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-200 truncate">{user.name}</h4>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-2">Navigation Console</span>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-200 text-left border ${
                    isActive 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-md shadow-emerald-950/20' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Console Footprint */}
        <div className="text-[10px] text-slate-600 text-center font-light border-t border-white/5 pt-3">
          🌱 Climate-Smart Grid System
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
