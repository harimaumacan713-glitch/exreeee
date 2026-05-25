import { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from './useAuth';

export function useUserData() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWallet(null);
      setHoldings([]);
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const pathWallet = `users/${user.uid}/wallet/summary`;
    const unsubWallet = onSnapshot(doc(db, pathWallet), (snap) => {
      setWallet(snap.data());
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, pathWallet));

    const pathHoldings = `users/${user.uid}/holdings`;
    const unsubHoldings = onSnapshot(collection(db, pathHoldings), (snap) => {
      setHoldings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, pathHoldings));

    const pathOrders = `users/${user.uid}/orders`;
    const qOrders = query(collection(db, pathOrders), orderBy('createdAt', 'desc'), limit(20));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, pathOrders));

    return () => {
      unsubWallet();
      unsubHoldings();
      unsubOrders();
    };
  }, [user]);

  return { wallet, holdings, orders, loading };
}
