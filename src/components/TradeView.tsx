import { ChevronDown, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import CandlestickChart from './CandlestickChart';
import { useUserData } from '../hooks/useUserData';
import { useAuth } from '../hooks/useAuth';
import { useMarketData } from '../hooks/useMarketData';
import { BinanceManager } from '../lib/binance';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

export default function TradeView() {
  const { user } = useAuth();
  const { wallet, holdings, orders: firebaseOrders } = useUserData();
  const { tickers } = useMarketData();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [timeframe, setTimeframe] = useState('1h');
  const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  
  const btcTicker = tickers.find(t => t.symbol === activeSymbol || t.id === activeSymbol);
  const price = btcTicker?.price || 64231.50;

  const handleSymbolChange = (symbol: string) => {
    setActiveSymbol(symbol);
    setShowSymbolPicker(false);
    // Dynamic subscription for new symbol
    BinanceManager.getInstance().subscribeToSymbol(symbol);
  };

  const availableSymbols = [
    { symbol: 'BTCUSDT', name: 'Bitcoin' },
    { symbol: 'ETHUSDT', name: 'Ethereum' },
    { symbol: 'SOLUSDT', name: 'Solana' },
    { symbol: 'BNBUSDT', name: 'BNB' },
    { symbol: 'XRPUSDT', name: 'XRP' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin' },
    { symbol: 'ADAUSDT', name: 'Cardano' },
    { symbol: 'MATICUSDT', name: 'Polygon' },
    { symbol: 'DOTUSDT', name: 'Polkadot' },
    { symbol: 'LINKUSDT', name: 'Chainlink' },
  ];

  const [orderbook, setOrderbook] = useState({
    sells: [
      { price: '64,245.2', amount: '0.421', depth: 45 },
      { price: '64,241.0', amount: '1.820', depth: 78 },
      { price: '64,239.5', amount: '0.115', depth: 32 },
    ],
    buys: [
      { price: '64,228.1', amount: '2.441', depth: 60 },
      { price: '64,225.0', amount: '0.052', depth: 15 },
      { price: '64,221.4', amount: '4.120', depth: 90 },
    ],
  });

  // Dynamic price simulation for orderbook and display
  useEffect(() => {
    const interval = setInterval(() => {      
      setOrderbook(prev => ({
        sells: prev.sells.map(s => ({
          ...s,
          depth: Math.min(100, Math.max(10, s.depth + (Math.random() - 0.5) * 10))
        })),
        buys: prev.buys.map(b => ({
          ...b,
          depth: Math.min(100, Math.max(10, b.depth + (Math.random() - 0.5) * 10))
        }))
      }));

    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateOrder = async () => {
    if (!user || !amount || parseFloat(amount) <= 0) return;
    
    setIsSubmitting(true);
    try {
      const orderPath = `users/${user.uid}/orders`;
      await addDoc(collection(db, orderPath), {
        userId: user.uid,
        asset: 'BTC',
        side,
        type: 'market',
        price: price,
        amount: parseFloat(amount),
        filled: 0,
        status: 'open',
        createdAt: new Date().toISOString()
      });
      setAmount('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user?.uid}/orders`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;
    try {
      const orderRef = doc(db, `users/${user.uid}/orders`, orderId);
      await updateDoc(orderRef, { status: 'cancelled' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/orders/${orderId}`);
    }
  };

  const openOrders = firebaseOrders?.filter((o: any) => o.status === 'open') || [];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Pair Info */}
      <section className="flex items-center justify-between py-5 premium-card px-6 relative">
        <div 
          className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowSymbolPicker(!showSymbolPicker)}
        >
          <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center overflow-hidden shadow-2xl border border-white/5 ring-4 ring-primary/5">
             <img 
               src={`https://assets.coincap.io/assets/icons/${activeSymbol.replace('USDT', '').toLowerCase()}@2x.png`}
               alt={activeSymbol}
               className="w-full h-full object-cover"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
                 (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="font-black text-primary font-display">${activeSymbol[0]}</span>`;
               }}
             />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold font-display tracking-tight text-white">{activeSymbol.replace('USDT', '')}/USDT</span>
              <ChevronDown size={18} className={`text-primary opacity-60 transition-transform ${showSymbolPicker ? 'rotate-180' : ''}`} />
            </div>
            <span className={`text-sm font-black font-display tracking-wide ${btcTicker?.change24h && btcTicker.change24h >= 0 ? 'text-secondary' : 'text-error'}`}>
              {btcTicker?.change24h && btcTicker.change24h > 0 ? '+' : ''}{btcTicker?.change24h || 0}%
            </span>
          </div>
        </div>

        {/* Symbol Picker Tooltip/Modal */}
        {showSymbolPicker && (
          <div className="absolute top-full left-4 mt-2 w-64 bg-surface-container-highest border border-white/10 rounded-2xl shadow-2xl z-[100] p-2 grid grid-cols-2 gap-1 animate-in fade-in zoom-in duration-200">
            {availableSymbols.map(s => (
              <button
                key={s.symbol}
                onClick={() => handleSymbolChange(s.symbol)}
                className={`p-3 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors ${activeSymbol === s.symbol ? 'bg-primary/20 ring-1 ring-primary/40' : ''}`}
              >
                <img 
                  src={`https://assets.coincap.io/assets/icons/${s.symbol.replace('USDT', '').toLowerCase()}@2x.png`}
                  alt={s.symbol}
                  className="w-5 h-5"
                />
                <span className="text-[11px] font-black uppercase tracking-wider">{s.symbol.replace('USDT', '')}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col items-end gap-1">
          <span className="text-2xl font-bold text-secondary font-display transition-all duration-500 tracking-tight">
            ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-outline font-black tracking-[0.2em] uppercase opacity-60">Vol 1.2B USDT</span>
        </div>
      </section>

      {/* Chart Holder */}
      <section className="h-[320px] aether-glass rounded-2xl p-4 flex flex-col relative overflow-hidden">
        <div className="flex items-center gap-5 mb-4 z-10">
          {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`text-xs font-black uppercase tracking-widest transition-all ${
                timeframe === tf 
                  ? 'text-primary border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
          <span className="text-on-surface-variant text-xs font-bold hover:text-primary transition-colors cursor-pointer ml-auto">Indicator</span>
        </div>
        
        <CandlestickChart symbol={activeSymbol} interval={timeframe} />
      </section>

      {/* orderbook and actions */}
      <section className="grid grid-cols-12 gap-4">
        {/* Orderbook */}
        <div className="col-span-5 aether-glass rounded-2xl p-3 flex flex-col gap-1.5">
          <div className="flex justify-between text-[9px] text-outline font-bold uppercase tracking-widest mb-1 px-1">
            <span>Price</span>
            <span>Ratio</span>
          </div>
          
          <div className="space-y-0.5">
            {orderbook.sells.map((s, i) => (
              <div key={i} className="relative h-6 flex items-center justify-between px-1 text-[11px] font-medium overflow-hidden">
                <div 
                  className="absolute right-0 inset-y-0 bg-error/10 transition-all duration-500" 
                  style={{ width: s.depth + '%' }}
                />
                <span className="text-error z-10">{s.price}</span>
                <span className="text-on-surface z-10">{s.amount}</span>
              </div>
            ))}
          </div>

          <div className="py-2.5 border-y border-white/[0.05] text-center flex flex-col my-1 bg-white/[0.02] rounded-lg">
            <span className="text-base font-bold text-secondary font-display tracking-tight">{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-outline font-black tracking-widest opacity-60 uppercase font-mono">${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="space-y-0.5">
            {orderbook.buys.map((b, i) => (
              <div key={i} className="relative h-6 flex items-center justify-between px-1 text-[11px] font-medium overflow-hidden">
                <div 
                  className="absolute right-0 inset-y-0 bg-secondary/10 transition-all duration-500" 
                  style={{ width: b.depth + '%' }}
                />
                <span className="text-secondary z-10">{b.price}</span>
                <span className="text-on-surface z-10">{b.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* execution panel */}
        <div className="col-span-7 space-y-4">
          <div className="flex bg-surface-container/80 rounded-2xl p-1.5 shadow-inner border border-white/5 backdrop-blur-md">
            <button 
              onClick={() => setSide('buy')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 font-display ${
                side === 'buy' ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20 scale-100' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Buy
            </button>
            <button 
              onClick={() => setSide('sell')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 font-display ${
                side === 'sell' ? 'bg-error text-on-error shadow-lg shadow-error/20 scale-100' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-outline px-1 opacity-60">
              <span className="flex items-center gap-1.5 text-on-surface font-display">Market <ChevronDown size={12} className="text-primary" /></span>
              <span>Avail: <span className="text-primary font-mono tracking-tight">{side === 'buy' ? `${wallet?.totalBalance?.toLocaleString() || 0} USDT` : `${holdings?.find((h: any) => h.symbol === 'BTC')?.balance || 0} BTC`}</span></span>
            </div>
            
            <div className="space-y-2.5">
              <div className="relative group opacity-40 grayscale-[0.5]">
                <input 
                  type="text" 
                  className="w-full bg-surface-container-high border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none transition-all font-bold font-display" 
                  value="Market Price"
                  disabled
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-outline uppercase tracking-widest">USDT</span>
              </div>
              <div className="relative group">
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface-container-high border border-white/5 rounded-2xl px-5 py-4 text-xl focus:outline-none focus:border-primary/50 focus:bg-surface-bright transition-all font-bold font-display shadow-inner placeholder:opacity-20" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-outline uppercase tracking-widest">BTC</span>
              </div>
            </div>

            <div className="flex gap-2">
              {[25, 50, 75, 100].map(p => (
                <button key={p} className="flex-1 py-2 text-[10px] font-black bg-surface-container/40 border border-white/5 rounded-xl hover:border-primary/50 hover:bg-surface-bright transition-all font-display opacity-60 hover:opacity-100">
                  {p}%
                </button>
              ))}
            </div>

            <button 
              onClick={handleCreateOrder}
              disabled={isSubmitting}
              className={`w-full py-5 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center font-display ${
              side === 'buy' ? 'bg-secondary text-on-secondary shadow-secondary/40' : 'bg-error text-on-error shadow-error/40'
            }`}>
              {isSubmitting ? <Loader2 size={24} className="animate-spin text-white" /> : (side === 'buy' ? 'Execute Buy' : 'Execute Sell')}
            </button>
          </div>
        </div>
      </section>

      {/* Open Orders */}
      <section className="aether-glass rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex border-b border-white/[0.05]">
          <button className="px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 border-primary text-primary font-display">Open Orders ({openOrders.length})</button>
          <button className="px-6 py-4 text-xs font-black uppercase tracking-widest text-on-surface-variant font-display opacity-50">History</button>
        </div>
        <div className="p-6 space-y-5">
          {openOrders.length > 0 ? openOrders.map((order: any) => (
            <div key={order.id} className="space-y-4 pb-5 border-b last:border-0 border-white/[0.05]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg font-display ${order.side === 'buy' ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>{order.side}</span>
                  <span className="text-sm font-bold font-display text-white">{order.asset}/USDT</span>
                </div>
                <button 
                  onClick={() => handleCancelOrder(order.id)}
                  className="text-[10px] font-black uppercase tracking-widest text-tertiary hover:text-error transition-colors px-3 py-1 bg-white/[0.03] rounded-lg border border-white/5">Cancel</button>
              </div>
              <div className="flex justify-between text-xs font-bold font-display">
                <div className="flex flex-col gap-1">
                  <span className="text-outline text-[9px] font-black uppercase tracking-widest opacity-60">Avg Price</span>
                  <span className="text-white">${order.price.toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-outline text-[9px] font-black uppercase tracking-widest opacity-60">Filled / Amount</span>
                  <span className="text-white font-mono">{order.filled} / {order.amount}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-on-surface-variant text-xs flex flex-col items-center gap-4 opacity-40">
              <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center border border-white/5">
                <ChevronDown size={32} className="opacity-20" />
              </div>
              <span className="font-black uppercase tracking-[0.2em] text-[10px]">No active orders</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
