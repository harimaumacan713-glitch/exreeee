import { db, rtdb } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';

const DEFAULT_STREAMS = ['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt', 'dogeusdt', 'adausdt', 'maticusdt', 'dotusdt', 'linkusdt'];

export class BinanceManager {
  private static instance: BinanceManager;
  private ws: WebSocket | null = null;
  private listeners: Set<(data: any) => void> = new Set();
  private prices: Record<string, number> = {};
  private activeStreams: Set<string> = new Set(DEFAULT_STREAMS);

  private constructor() {
    this.connect();
  }

  static getInstance() {
    if (!BinanceManager.instance) {
      BinanceManager.instance = new BinanceManager();
    }
    return BinanceManager.instance;
  }

  private connect() {
    if (typeof window === 'undefined') return;
    const streamNames = Array.from(this.activeStreams).map(s => `${s.toLowerCase()}@ticker`).join('/');
    this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamNames}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.s) {
        const symbol = data.s;
        const price = parseFloat(data.c);
        const change = parseFloat(data.P);
        
        this.prices[symbol] = price;
        
        const payload = {
          symbol,
          price,
          change24h: change,
          volume24h: parseFloat(data.v),
          high: parseFloat(data.h),
          low: parseFloat(data.l),
          lastUpdate: Date.now()
        };

        // Notify local listeners
        this.listeners.forEach(l => l(payload));

        // Periodically sync to Database
        this.syncToFirebase(payload);
      }
    };

    this.ws.onclose = () => {
      if (this.activeStreams.size > 0) {
        setTimeout(() => this.connect(), 5000);
      }
    };
  }

  subscribeToSymbol(symbol: string) {
    const s = symbol.toLowerCase();
    if (!this.activeStreams.has(s)) {
      this.activeStreams.add(s);
      this.ws?.close(); // Reconnect with new stream
    }
  }

  private lastSync: Record<string, number> = {};
  private async syncToFirebase(payload: any) {
    const now = Date.now();
    // Throttled sync
    if (!this.lastSync[payload.symbol] || now - this.lastSync[payload.symbol] > 5000) {
      this.lastSync[payload.symbol] = now;
      try {
        // Sync to Firestore for long-term consistency
        await setDoc(doc(db, 'markets', payload.symbol), payload, { merge: true });
        
        // Sync to Realtime Database for high-speed updates (as requested)
        await set(ref(rtdb, `prices/${payload.symbol}`), {
          price: payload.price,
          change24h: payload.change24h,
          updatedAt: payload.lastUpdate
        });
      } catch (e) {
        // Silent fail
      }
    }
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async getKlines(symbol: string, interval: string, limit: number = 100) {
    try {
      const resp = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`);
      const data = await resp.json();
      return data.map((d: any) => ({
        time: d[0],
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
      }));
    } catch (e) {
      console.error('Error fetching klines:', e);
      return [];
    }
  }

  private klineListeners: Map<string, Set<(data: any) => void>> = new Map();
  private klineWs: Map<string, WebSocket> = new Map();

  subscribeKline(symbol: string, interval: string, callback: (data: any) => void) {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    
    if (!this.klineListeners.has(streamName)) {
      this.klineListeners.set(streamName, new Set());
      this.connectKline(streamName);
    }
    
    this.klineListeners.get(streamName)!.add(callback);
    
    return () => {
      const listeners = this.klineListeners.get(streamName);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.klineWs.get(streamName)?.close();
          this.klineWs.delete(streamName);
          this.klineListeners.delete(streamName);
        }
      }
    };
  }

  private connectKline(streamName: string) {
    if (typeof window === 'undefined') return;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);
    this.klineWs.set(streamName, ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.e === 'kline') {
        const k = data.k;
        const payload = {
          time: k.t,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          isFinal: k.x
        };
        this.klineListeners.get(streamName)?.forEach(l => l(payload));
      }
    };

    ws.onclose = () => {
      if (this.klineListeners.has(streamName)) {
        setTimeout(() => this.connectKline(streamName), 5000);
      }
    };
  }

  getPrice(symbol: string) {
    return this.prices[symbol];
  }
}
