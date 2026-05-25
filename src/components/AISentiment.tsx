import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SentimentData {
  symbol: string;
  mood: string;
  reason: string;
}

export default function AISentiment() {
  const [sentiments, setSentiments] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSentiment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: ['BTC', 'ETH', 'SOL'] })
      });
      const data = await response.json();
      setSentiments(data.assets || []);
    } catch (error) {
      console.error('Failed to fetch sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 300000); // Every 5 mins
    return () => clearInterval(interval);
  }, []);

  if (loading && sentiments.length === 0) {
    return (
      <div className="premium-card p-6 flex flex-col items-center justify-center gap-3 h-48 opacity-50">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Analyzing Market Pulse...</span>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Sparkles size={18} />
        </div>
        <h2 className="text-xl font-bold font-display tracking-tight text-white">AI Insights</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {sentiments.map((s, i) => (
            <motion.div
              key={s.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="premium-card p-5 border border-white/5 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-black font-display tracking-widest text-primary opacity-80">{s.symbol}</div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  s.mood.toLowerCase().includes('bull') ? 'bg-secondary/20 text-secondary' : 
                  s.mood.toLowerCase().includes('bear') ? 'bg-error/20 text-error' : 
                  'bg-white/10 text-on-surface-variant'
                }`}>
                  {s.mood.toLowerCase().includes('bull') ? <TrendingUp size={12} /> : 
                   s.mood.toLowerCase().includes('bear') ? <TrendingDown size={12} /> : 
                   <Minus size={12} />}
                  {s.mood}
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed font-medium line-clamp-2">
                {s.reason}
              </p>
              
              {/* Background Glow */}
              <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-[40px] opacity-20 transition-opacity group-hover:opacity-40 ${
                s.mood.toLowerCase().includes('bull') ? 'bg-secondary' : 
                s.mood.toLowerCase().includes('bear') ? 'bg-error' : 
                'bg-white'
              }`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
