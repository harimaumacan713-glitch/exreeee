import { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { BinanceManager } from '../lib/binance';

export function useMarketData() {
  const [tickers, setTickers] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch from Firestore
    const path = 'markets';
    const unsubFirestore = onSnapshot(collection(db, 'markets'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length > 0) {
        setTickers(data);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, path));

    // Subscribe to realtime Binance stream
    const binance = BinanceManager.getInstance();
    const unsubBinance = binance.subscribe((payload) => {
      setTickers(prev => {
        const index = prev.findIndex(t => t.symbol === payload.symbol || t.id === payload.symbol);
        if (index > -1) {
          const newTickers = [...prev];
          newTickers[index] = { ...newTickers[index], ...payload };
          return newTickers;
        } else {
          return [...prev, payload];
        }
      });
    });

    return () => {
      unsubFirestore();
      unsubBinance();
    };
  }, []);

  return { tickers };
}
