import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import FarmerDashboard from './pages/FarmerDashboard';
import StorageDashboard from './pages/StorageDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import EmergencyConsole from './pages/EmergencyConsole';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useApp();
  const [activeTab, setActiveTab] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set default tab based on role when user logs in
  useEffect(() => {
    if (user) {
      if (user.role === 'farmer') {
        setActiveTab('listings');
      } else if (user.role === 'storage') {
        setActiveTab('capacity');
      } else if (user.role === 'distributor') {
        setActiveTab('sourcing');
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <span className="text-xs font-semibold tracking-wider uppercase">Loading AgriLink Platform...</span>
      </div>
    );
  }

  // Render Landing Auth Page if not logged in
  if (!user) {
    return <LandingPage />;
  }

  const renderContent = () => {
    if (activeTab === 'simulator') {
      return <EmergencyConsole />;
    }

    switch (user.role) {
      case 'farmer':
        return <FarmerDashboard activeSubTab={activeTab} />;
      case 'storage':
        return <StorageDashboard activeSubTab={activeTab} />;
      case 'distributor':
        return <DistributorDashboard activeSubTab={activeTab} />;
      default:
        return (
          <div className="flex-1 p-6 text-center text-slate-400 text-xs">
            Unknown user role dashboard configuration.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-1 relative">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        {/* Main Console Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/40 relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
