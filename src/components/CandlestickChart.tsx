import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BinanceManager } from '../lib/binance';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  symbol?: string;
  interval?: string;
}

export default function CandlestickChart({ symbol = 'BTCUSDT', interval = '1h' }: CandlestickChartProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);

  // Initialize with real data
  useEffect(() => {
    const binance = BinanceManager.getInstance();
    
    // Fetch historical data
    binance.getKlines(symbol, interval, 40).then(data => {
      if (data.length > 0) {
        setCandles(data);
        setCurrentPrice(data[data.length - 1].close);
      }
    });

    // Subscribe to Binance for realtime kline updates
    const unsub = binance.subscribeKline(symbol, interval, (kline) => {
      setCurrentPrice(kline.close);
      
      setCandles(prev => {
        if (prev.length === 0) return [kline];
        
        const lastCandle = prev[prev.length - 1];
        
        // If it's the same candle time, update it
        if (kline.time === lastCandle.time) {
          const newCandles = [...prev.slice(0, -1), kline];
          return newCandles;
        } 
        // If it's a new candle, append and shift
        else if (kline.time > lastCandle.time) {
          return [...prev.slice(1), kline];
        }
        
        return prev;
      });
    });

    return () => {
      unsub();
    };
  }, [symbol, interval]);

  const maxPrice = Math.max(...candles.map(c => c.high));
  const minPrice = Math.min(...candles.map(c => c.low));
  const range = maxPrice - minPrice;

  const getYT = (price: number) => {
    return 100 - ((price - minPrice) / range) * 100;
  };

  return (
    <div className="w-full h-full flex flex-col pt-12 relative overflow-hidden">
      {/* Price Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between py-12 pointer-events-none opacity-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-full border-t border-white/[0.05]"></div>
        ))}
      </div>

      {/* Candles */}
      <div className="flex-1 flex items-end gap-[4px] px-2 relative">
        {candles.map((candle, i) => {
          const isUp = candle.close >= candle.open;
          const bodyTop = getYT(Math.max(candle.open, candle.close));
          const bodyBottom = getYT(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(3, Math.abs(bodyTop - bodyBottom));
          
          const wickTop = getYT(candle.high);
          const wickBottom = getYT(candle.low);
          const wickHeight = Math.abs(wickTop - wickBottom);

          return (
            <div key={i} className="flex-1 relative h-full group">
              {/* Wick */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 w-[1.5px] transition-all duration-300 ${isUp ? 'bg-secondary' : 'bg-error'}`}
                style={{ top: wickTop + '%', height: wickHeight + '%' }}
              />
              {/* Body */}
              <motion.div 
                className={`absolute left-0 right-0 rounded-[2px] mb-[0.5px] transition-all duration-500 ${
                  isUp 
                    ? 'bg-secondary border border-white/5 shadow-[0_0_12px_rgba(78,222,163,0.3)]' 
                    : 'bg-error border border-white/5 shadow-[0_0_12px_rgba(255,180,171,0.3)]'
                }`}
                style={{ top: bodyTop + '%', height: bodyHeight + '%' }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
              />
            </div>
          );
        })}

        {/* Current Price Line */}
        <div 
          className="absolute right-0 w-full border-t border-dashed border-white/20 flex justify-end z-20 transition-all duration-500"
          style={{ top: getYT(currentPrice) + '%' }}
        >
          <div className="bg-white text-surface px-2 py-0.5 font-bold font-display text-xs rounded-l-md shadow-[0_0_15px_rgba(255,255,255,0.4)] transform -translate-y-1/2">
            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}
