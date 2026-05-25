import { Search, Plus, Star } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { ASSETS as INITIAL_ASSETS } from '../data';
import { useState, useEffect, useRef } from 'react';
import { useMarketData } from '../hooks/useMarketData';

const SPARK_DATA = [
  { v: 10 }, { v: 15 }, { v: 12 }, { v: 18 }, { v: 14 }, { v: 22 }, { v: 19 }, { v: 25 }
];

import AISentiment from './AISentiment';

export default function MarketsView() {
  const categories = ['All', 'Layer 1', 'DeFi', 'AI', 'Memes'];
  const { tickers } = useMarketData();
  const [lastUpdate, setLastUpdate] = useState<{ [key: string]: 'up' | 'down' | null }>({});
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTickers = tickers.filter(t => {
    const matchesSearch = t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    // In a real app we'd have category mapping, for now just filter by search
    return matchesSearch;
  });

  useEffect(() => {
    // Detect price changes and show highlights
    tickers.forEach(ticker => {
      // Find previous price for this ticker
      // (Simple check: if ticker.lastUpdate is very recent, highlight it)
      if (ticker.lastUpdate && Date.now() - ticker.lastUpdate < 1000) {
        const direction = ticker.change24h >= 0 ? 'up' : 'down'; // Approximate
        setLastUpdate(prev => ({ ...prev, [ticker.symbol]: direction }));
        
        if (timeoutRefs.current[ticker.symbol]) clearTimeout(timeoutRefs.current[ticker.symbol]);
        timeoutRefs.current[ticker.symbol] = setTimeout(() => {
          setLastUpdate(prev => ({ ...prev, [ticker.symbol]: null }));
        }, 800);
      }
    });

    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, [tickers]);

  return (
    <div className="px-5 py-6 space-y-10">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search markets..." 
          className="w-full bg-surface-container/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-sm font-medium backdrop-blur-xl"
        />
      </div>

      {/* AI Sentiment */}
      <AISentiment />

      {/* Market Movers */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-bold font-display tracking-tight text-white">Market Movers</h2>
          <button className="text-primary text-[10px] uppercase font-bold tracking-[0.2em] font-display hover:text-white transition-colors">See All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x px-1">
          {tickers.slice(0, 3).map((ticker) => (
            <div key={ticker.symbol} className={`min-w-[180px] p-6 rounded-3xl aether-glass border transition-all duration-700 snap-center group shadow-2xl ${
              lastUpdate[ticker.symbol] === 'up' ? 'border-secondary/30 bg-secondary/10 scale-[1.02]' : 
              lastUpdate[ticker.symbol] === 'down' ? 'border-error/30 bg-error/10 scale-[1.02]' : 
              'border-white/5 bg-white/[0.03] hover:border-white/20'
            }`}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden bg-surface-container-highest shadow-inner ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                   <img 
                    src={`https://assets.coincap.io/assets/icons/${ticker.symbol.replace('USDT', '').toLowerCase()}@2x.png`}
                    alt={ticker.symbol}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="font-bold text-xs text-primary">${ticker.symbol[0]}</span>`;
                    }}
                   />
                </div>
                <div className={`text-sm font-bold transition-colors font-display ${ticker.change24h > 0 ? 'text-secondary' : 'text-error'}`}>
                  {ticker.change24h > 0 ? '+' : ''}{ticker.change24h}%
                </div>
              </div>
              <div className="text-xl font-bold font-display tracking-tight text-white mb-1">{ticker.symbol.replace('USDT', '')}</div>
              <div className="text-xs text-on-surface-variant font-black font-mono tracking-wider opacity-60 uppercase mb-4">{ticker.symbol}</div>
              <div className="text-2xl font-bold font-display text-white">${ticker.price?.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <nav className="flex gap-6 border-b border-outline-variant/10 overflow-x-auto scrollbar-none">
        {categories.map((cat, i) => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`pb-4 text-sm font-semibold whitespace-nowrap transition-all relative ${
              activeCategory === cat ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {cat}
            {activeCategory === cat && <motion.div layoutId="marketTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </nav>

      {/* Markets Table */}
      <section className="bg-surface-container/60 rounded-[2.5rem] overflow-hidden border border-white/5 backdrop-blur-xl">
         <div className="p-2 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-black opacity-60">
                  <th className="pt-6 pb-6 px-6 text-left">Asset</th>
                  <th className="pt-6 pb-6 text-right">Market Data</th>
                  <th className="pt-6 pb-6 px-6 text-right w-24">24h Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredTickers.map((ticker) => (
                  <tr key={ticker.symbol} className={`group transition-all duration-700 ${
                    lastUpdate[ticker.symbol] === 'up' ? 'bg-secondary/10' : 
                    lastUpdate[ticker.symbol] === 'down' ? 'bg-error/10' : 
                    'hover:bg-white/[0.04]'
                  }`}>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-surface-container-highest flex items-center justify-center overflow-hidden shadow-lg border border-white/5 group-hover:scale-105 transition-transform">
                          <img 
                            src={`https://assets.coincap.io/assets/icons/${ticker.symbol.replace('USDT', '').toLowerCase()}@2x.png`}
                            alt={ticker.symbol}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="font-bold text-primary">${ticker.symbol[0]}</span>`;
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-base font-bold font-display text-white">{ticker.symbol.replace('USDT', '')}</div>
                          <div className="text-[10px] text-on-surface-variant font-black tracking-widest uppercase opacity-60">{ticker.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 text-right">
                      <div className={`text-base font-bold transition-all duration-500 font-display ${
                        lastUpdate[ticker.symbol] === 'up' ? 'text-secondary scale-110 translate-x-1' : 
                        lastUpdate[ticker.symbol] === 'down' ? 'text-error scale-110 translate-x-1' : 
                        'text-white'
                      }`}>
                        ${ticker.price?.toLocaleString()}
                      </div>
                      <div className={`text-xs font-black font-display tracking-tight mt-0.5 ${ticker.change24h > 0 ? 'text-secondary' : 'text-error'}`}>
                        {ticker.change24h > 0 ? '+' : ''}{ticker.change24h}%
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="h-10 w-24 float-right opacity-80 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={SPARK_DATA}>
                            <Line 
                              type="monotone" 
                              dataKey="v" 
                              stroke={ticker.change24h > 0 ? '#4edea3' : '#ffb4ab'} 
                              strokeWidth={2} 
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </section>

      {/* Watchlist */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Your Watchlist</h2>
          <button className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
            <Plus size={20} />
          </button>
        </div>
        <div className="space-y-4">
           {tickers.slice(2, 4).map(ticker => (
             <div key={ticker.symbol} className="p-5 rounded-2xl aether-glass border border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-bright flex items-center justify-center text-primary">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <div>
                    <div className="font-bold">{ticker.symbol.replace('USDT', '')}</div>
                    <div className="text-xs text-on-surface-variant">{ticker.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${ticker.price?.toLocaleString()}</div>
                  <div className={`text-xs font-bold ${ticker.change24h >= 0 ? 'text-secondary' : 'text-error'}`}>
                    {ticker.change24h >= 0 ? 'Trending Up' : 'High Volatility'}
                  </div>
                </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
