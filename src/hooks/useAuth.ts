import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          // Initialize new user data
          await setDoc(userRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            tier: 'VIP 1',
            tradingFee: 0.1,
            createdAt: new Date().toISOString(),
          });
          
          // Initialize wallet
          await setDoc(doc(db, 'users', user.uid, 'wallet', 'summary'), {
            totalBalance: 10000, // Demo starting balance
            pnl24h: 0,
            pnlPercent: 0,
            lastUpdated: new Date().toISOString(),
          });

          // Seed sample holdings
          const holdingsRef = doc(db, 'users', user.uid, 'holdings', 'BTC');
          await setDoc(holdingsRef, {
            symbol: 'BTC',
            name: 'Bitcoin',
            balance: 0.05,
            valueUsd: 3200
          });
        }
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => signOut(auth);

  return { user, loading, login, logout };
}
