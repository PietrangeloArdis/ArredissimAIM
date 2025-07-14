import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { CampaignTable } from './components/CampaignTable';
import { CampaignsList } from './components/CampaignsList';
import { Planner } from './components/Planner';
import { BrandManager } from './components/BrandManager';
import { ManagerManager } from './components/ManagerManager';
import { ChannelManager } from './components/ChannelManager';
import { BroadcasterManager } from './components/BroadcasterManager';
import { RegionManager } from './components/RegionManager';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useFirestore } from './hooks/useFirestore';
import { useChannels } from './hooks/useChannels';
import { useTranslation } from 'react-i18next';
import { updateCampaignStatuses } from './utils/updateCampaignStatuses';
// --- MODIFICA 1: Importa il componente Notification e i suoi tipi ---
import { Notification, NotificationProps, NotificationType } from './components/Notification';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <DashboardApp />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

function DashboardApp() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  // --- MODIFICA 2: Aggiungi uno stato per gestire le notifiche ---
  const [notification, setNotification] = useState<Omit<NotificationProps, 'onClose'> | null>(null);

  const { campaigns, loading, addCampaign, updateCampaign, deleteCampaign } = useFirestore();
  const { getActiveChannels } = useChannels();
  const { t } = useTranslation();

  // --- MODIFICA 3: Crea una funzione per mostrare una notifica ---
  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    setNotification({ message, type });
  }, []);


  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastRun = localStorage.getItem('campaignStatusUpdateDate');
    if (lastRun !== today) {
      updateCampaignStatuses().then(() => {
        localStorage.setItem('campaignStatusUpdateDate', today);
      });
    }
  }, []);

  const activeChannels = getActiveChannels();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')} campaigns...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // --- MODIFICA 4: Passa la funzione 'showNotification' ai componenti di gestione ---
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard campaigns={campaigns} />;
      case 'Campaigns':
        return <CampaignsList campaigns={campaigns} onAdd={addCampaign} onUpdate={updateCampaign} onDelete={deleteCampaign} />;
      case 'Planner':
        return <Planner campaigns={campaigns} onAdd={addCampaign} onUpdate={updateCampaign} />;
      case 'Brands':
        return <BrandManager showNotification={showNotification} />;
      case 'Managers':
        return <ManagerManager showNotification={showNotification} />;
      case 'Channels':
        return <ChannelManager showNotification={showNotification} />;
      case 'Broadcasters':
        return <BroadcasterManager showNotification={showNotification} />;
      case 'Regions':
        return <RegionManager showNotification={showNotification} />;
      default:
        const isChannelTab = activeChannels.some(channel => channel.name === activeTab);
        if (isChannelTab) {
          return <CampaignTable campaigns={campaigns} channel={activeTab} onAdd={addCampaign} onUpdate={updateCampaign} onDelete={deleteCampaign} />;
        }
        return <Dashboard campaigns={campaigns} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
      {/* --- MODIFICA 5: Mostra il componente Notification se c'è un messaggio --- */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;