import { TrendingUp, ArrowDownLeft, ArrowUpRight, Eye, EyeOff, MoreHorizontal, Loader2, Wallet as WalletIcon, Copy, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PORTFOLIO_STATS } from '../data';
import { useState } from 'react';
import { useUserData } from '../hooks/useUserData';
import { useMarketData } from '../hooks/useMarketData';
import { useAuth } from '../hooks/useAuth';

export default function WalletView() {
  const { user } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const { wallet, holdings, orders: transactions, loading } = useUserData() as any;
  const { tickers } = useMarketData();

  const handleCopyId = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-on-surface-variant text-sm font-medium">Syncing with ledger...</p>
      </div>
    );
  }

  const displayBalance = wallet?.totalBalance ? wallet.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00';
  
  // Calculate real-time holdings value
  const holdingsWithValue = holdings.map((h: any) => {
    const ticker = tickers.find(t => t.symbol === `${h.symbol}USDT` || t.id === `${h.symbol}USDT`);
    const price = ticker?.price || 0;
    return {
      ...h,
      valueUsd: price ? h.balance * price : h.valueUsd
    };
  });

  const totalHoldingsValue = holdingsWithValue.reduce((acc: number, h: any) => acc + (h.valueUsd || 0), 0);
  const finalBalance = (wallet?.totalBalance || 0) + totalHoldingsValue;
  const displayFinalBalance = finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 });
  
  const displayPnlPct = wallet?.pnlPercent ? (wallet.pnlPercent > 0 ? `+${wallet.pnlPercent}` : wallet.pnlPercent) : '+0.00';

  return (
    <div className="px-5 py-6 space-y-8 pb-10">
      {/* Account ID / Deposit ID Section */}
      <section className="premium-card p-5 space-y-4 bg-primary/5 border-primary/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <WalletIcon size={16} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] font-display text-primary/80">Account ID</span>
          </div>
          <button 
            onClick={handleCopyId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-highest border border-white/5 hover:bg-surface-bright transition-all active:scale-95 group"
          >
            {copied ? (
              <Check size={14} className="text-secondary" />
            ) : (
              <Copy size={14} className="text-primary group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[10px] font-black uppercase tracking-wider">{copied ? 'Copied' : 'Copy ID'}</span>
          </button>
        </div>
        <div className="bg-surface-container-lowest/50 rounded-xl p-3 border border-white/5 shadow-inner">
          <code className="text-[11px] font-mono text-on-surface-variant break-all tracking-tight leading-none">
            {user?.uid || 'CONNECT_WALLET_TO_VIEW_ID'}
          </code>
        </div>
        <p className="text-[9px] font-medium text-on-surface-variant/60 leading-tight">
          Gunakan ID ini untuk menerima saldo dari proyek ekosistem lain yang terhubung dengan Firebase yang sama.
        </p>
      </section>

      {/* Total Balance */}
      <section className="flex flex-col items-center text-center space-y-2">
        <div className="flex items-center gap-2 text-on-surface-variant text-[11px] uppercase tracking-widest font-bold">
          Total Assets Balance
          <button onClick={() => setHideBalance(!hideBalance)} className="hover:text-primary transition-colors p-1">
            {hideBalance ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-on-surface font-display">$</span>
          <span className="text-5xl font-bold text-on-surface font-display tracking-tight">
            {hideBalance ? '••••••••' : displayFinalBalance}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 rounded-full text-secondary text-xs font-bold border border-secondary/20">
          <TrendingUp size={14} />
          {displayPnlPct}% (24h)
        </div>
      </section>

      {/* Action Buttons */}
      <section className="grid grid-cols-2 gap-4">
        <button className="flex flex-col items-center justify-center gap-3 bg-primary py-5 rounded-2xl active:scale-[0.98] transition-all group shadow-2xl shadow-primary/20 hover:brightness-110">
          <div className="w-12 h-12 bg-on-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ring-4 ring-on-primary/5">
            <ArrowDownLeft size={24} className="text-on-primary" />
          </div>
          <span className="text-xs font-black text-on-primary uppercase tracking-widest font-display">Deposit</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-3 bg-surface-container-highest py-5 rounded-2xl border border-white/5 active:scale-[0.98] transition-all group shadow-2xl shadow-black/40 hover:bg-surface-bright">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ring-4 ring-primary/5">
            <ArrowUpRight size={24} className="text-primary" />
          </div>
          <span className="text-xs font-black text-on-surface uppercase tracking-widest font-display">Withdraw</span>
        </button>
      </section>

      {/* Allocation */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-display">Asset Allocation</h2>
          <button className="text-primary text-xs font-bold hover:underline font-display tracking-wide">View Details</button>
        </div>
        <div className="premium-card p-6 flex items-center gap-8">
          <div className="w-32 h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PORTFOLIO_STATS}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {PORTFOLIO_STATS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-on-surface-variant font-bold">Top</span>
              <span className="text-xs font-bold text-primary">BTC</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
            {PORTFOLIO_STATS.map((stat) => (
              <div key={stat.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                <span className="text-[10px] text-on-surface-variant font-bold uppercase">
                  {stat.name} {stat.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assets List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display">Holdings</h2>
        <div className="space-y-3">
          {holdingsWithValue.length > 0 ? holdingsWithValue.map((asset: any) => (
            <button key={asset.id} className="w-full aether-glass p-4 rounded-2xl flex items-center justify-between hover:bg-surface-bright transition-all text-left group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-primary/20 transition-colors shadow-lg">
                  <img 
                    src={`https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`}
                    alt={asset.symbol}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="font-black text-primary text-sm">${asset.symbol[0]}</span>`;
                    }}
                  />
                </div>
                <div>
                  <div className="font-bold text-base font-display">{asset.name || asset.symbol}</div>
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{asset.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold font-display text-base">{asset.balance} {asset.symbol}</div>
                <div className="text-xs text-on-surface-variant font-medium font-mono">${asset.valueUsd?.toLocaleString()}</div>
              </div>
            </button>
          )) : (
            <div className="p-8 text-center text-on-surface-variant text-sm bg-surface-container/30 rounded-2xl border border-dashed border-outline-variant/30">
              No holdings found.
            </div>
          )}
        </div>
      </section>

      {/* Recent History */}
      <section className="space-y-4 pb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Transactions</h2>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container border border-outline-variant/20 hover:text-primary transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
        <div className="space-y-4">
          {transactions?.length > 0 ? transactions.map((tx: any) => (
            <div key={tx.id} className="flex items-center justify-between p-1">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.type === 'received' ? 'bg-secondary/10 text-secondary' : 
                  tx.type === 'sent' ? 'bg-primary/10 text-primary' : 
                  'bg-surface-container text-on-surface'
                }`}>
                  {tx.type === 'received' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <div className="font-bold text-sm capitalize">{tx.type} {tx.asset}</div>
                  <div className="text-[10px] text-on-surface-variant font-bold uppercase">{tx.date}</div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className={`font-bold text-sm ${tx.amount.startsWith('+') ? 'text-secondary' : 'text-on-surface'}`}>
                  {tx.amount}
                </div>
                <div className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase inline-block border ${
                  tx.status === 'completed' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                }`}>
                  {tx.status}
                </div>
              </div>
            </div>
          )) : (
            <div className="p-6 text-center text-on-surface-variant text-xs bg-surface-container/20 rounded-xl">
              No recent transactions.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
