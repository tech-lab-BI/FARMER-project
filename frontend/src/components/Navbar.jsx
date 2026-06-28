import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, LogOut, User, Menu, ShieldAlert, Sparkles } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, notifications, clearNotifications } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'danger': return 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'farmer': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'storage': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'distributor': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 px-4 py-3 md:px-6 flex items-center justify-between">
      {/* Brand Logo & Mobile Trigger */}
      <div className="flex items-center gap-3">
        {user && (
          <button 
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-slate-800 lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
            AgriLink
          </span>
        </div>
      </div>

      {/* Profile, Alerts & Notification Controls */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Role Badge */}
            <span className={`hidden md:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getRoleBadgeColor(user.role)}`}>
              {user.role === 'storage' ? 'Cold Storage' : user.role}
            </span>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl border border-white/10 hover:bg-slate-800/80 transition text-slate-400 hover:text-white"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-950 animate-bounce">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Drawer Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto glass-panel rounded-xl shadow-xl z-50 border border-white/15 py-2 scrollbar">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 mb-2">
                    <span className="font-bold text-sm text-slate-200">Alert Center</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearNotifications}
                        className="text-[10px] font-semibold text-emerald-400 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500">
                      No active alerts or requests received.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className="px-4 py-3 hover:bg-slate-800/40 transition text-left"
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getNotificationColor(notif.type)}`}>
                              {notif.title}
                            </span>
                            <span className="text-[9px] text-slate-500 whitespace-nowrap">{notif.time}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-light">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Brief */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">{user.name}</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</span>
              </div>
              <button 
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>AgriLink Supply Chain Console v1.0</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
