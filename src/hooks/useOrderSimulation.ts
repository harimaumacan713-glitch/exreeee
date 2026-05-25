import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useUserData } from './useUserData';
import { useMarketData } from './useMarketData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, setDoc, getDoc } from 'firebase/firestore';

export function useOrderSimulation() {
  const { user } = useAuth();
  const { orders } = useUserData();
  const { tickers } = useMarketData();

  useEffect(() => {
    if (!user || !orders.length || !tickers.length) return;

    const simulateMatching = async () => {
      const openOrders = orders.filter(o => o.status === 'open');
      
      for (const order of openOrders) {
        const ticker = tickers.find(t => t.symbol === `${order.asset}USDT` || t.id === `${order.asset}USDT`);
        if (!ticker) continue;

        const currentPrice = ticker.price;
        let shouldFill = false;

        // Simple market order logic: fill if we have a price
        // For limit orders (if we had them), we'd check price crossing
        if (order.type === 'market') {
          shouldFill = true;
        }

        if (shouldFill) {
          const orderRef = doc(db, `users/${user.uid}/orders`, order.id);
          
          try {
            // 1. Mark order as filled
            await updateDoc(orderRef, {
              status: 'filled',
              filled: order.amount,
              filledAt: new Date().toISOString()
            });

            // 2. Update holdings
            const holdingRef = doc(db, `users/${user.uid}/holdings`, order.asset);
            const holdingSnap = await getDoc(holdingRef);
            
            const currentBalance = holdingSnap.exists() ? holdingSnap.data().balance : 0;
            const newBalance = order.side === 'buy' 
              ? currentBalance + order.amount 
              : currentBalance - order.amount;

            await setDoc(holdingRef, {
              symbol: order.asset,
              balance: Math.max(0, newBalance),
              updatedAt: new Date().toISOString()
            }, { merge: true });

            // 3. Update Wallet Balance (USDT)
            const walletRef = doc(db, `users/${user.uid}/wallet/summary`);
            const walletSnap = await getDoc(walletRef);
            if (walletSnap.exists()) {
               const walletData = walletSnap.data();
               const cost = order.amount * order.price;
               const newTotal = order.side === 'buy'
                 ? walletData.totalBalance - cost
                 : walletData.totalBalance + cost;
               
               await updateDoc(walletRef, {
                 totalBalance: Math.max(0, newTotal),
                 updatedAt: new Date().toISOString()
               });
            }

            console.log(`Order ${order.id} filled at ${currentPrice}`);
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `simulation/matching/${order.id}`);
          }
        }
      }
    };

    const interval = setInterval(simulateMatching, 3000);
    return () => clearInterval(interval);
  }, [user, orders, tickers]);
}
