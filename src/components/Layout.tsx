import { Home, BarChart3, ArrowLeftRight, Wallet, User, Bell, QrCode } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'markets', label: 'Markets', icon: BarChart3 },
    { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 py-4 h-16 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
            <img 
              src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-lg text-primary tracking-tight">AETHEREX</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors text-primary">
            <QrCode size={20} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors text-primary relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full border-2 border-surface"></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 pb-20">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 bg-surface-container border-t border-outline-variant/10 flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center min-w-[64px] transition-all duration-200 ${
              activeTab === tab.id 
                ? 'text-on-primary-container bg-primary-container/20 rounded-xl px-4 py-1' 
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <tab.icon size={20} fill={activeTab === tab.id ? 'currentColor' : 'none'} />
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
