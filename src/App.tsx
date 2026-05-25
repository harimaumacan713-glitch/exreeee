/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Layout from './components/Layout';
import WalletView from './components/WalletView';
import MarketsView from './components/MarketsView';
import TradeView from './components/TradeView';
import { useAuth } from './hooks/useAuth';
import { LogIn } from 'lucide-react';
import { useOrderSimulation } from './hooks/useOrderSimulation';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const { user, loading, login, logout } = useAuth();
  
  // Start global order simulation
  useOrderSimulation();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
            <LogIn size={40} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome to AetherEx</h2>
            <p className="text-on-surface-variant text-sm mt-2">Please login to manage your assets and start trading realtime.</p>
          </div>
          <button 
            onClick={login}
            className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Login with Google
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
      case 'wallet':
        return <WalletView />;
      case 'markets':
        return <MarketsView />;
      case 'trade':
        return <TradeView />;
      case 'profile':
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center space-y-6">
            <div className="w-24 h-24 rounded-full border-4 border-primary/20 p-1">
               <img 
                src={user.photoURL || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop"} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.displayName || 'Crypton User'}</h2>
              <p className="text-on-surface-variant text-sm">{user.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
               <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/10">
                  <div className="text-xs text-on-surface-variant mb-1">Tier</div>
                  <div className="font-bold text-primary">VIP 1</div>
               </div>
               <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/10">
                  <div className="text-xs text-on-surface-variant mb-1">Fee</div>
                  <div className="font-bold text-secondary">0.10%</div>
               </div>
            </div>
            <button 
              onClick={logout}
              className="w-full py-4 bg-surface-container-highest text-on-surface rounded-2xl font-bold border border-outline-variant/30 hover:bg-error/10 hover:text-error transition-all"
            >
              Logout
            </button>
          </div>
        );
      default:
        return <WalletView />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}
