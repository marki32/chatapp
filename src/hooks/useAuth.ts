import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { useStore } from '../store';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const { setUser } = useStore();

  useEffect(() => {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (!userData) {
          const newUser = {
            id: user.uid,
            username: user.displayName,
            avatar: user.photoURL,
            following: 0,
            followers: 0,
          };
          await setDoc(doc(db, 'users', user.uid), newUser);
          setUser(newUser);
        } else {
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, [setUser]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return { loading, signInWithGoogle, signOut };
}