import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { PhotoGrid } from './components/PhotoGrid';
import { useStore } from './store';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuth } from './hooks/useAuth';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Photo } from './types';

function App() {
  const { darkMode, setPhotos } = useStore();
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        // Create a query to get all photos, ordered by creation date
        const photosQuery = query(
          collection(db, 'photos'),
          orderBy('createdAt', 'desc')
        );

        const photosSnapshot = await getDocs(photosQuery);
        const fetchedPhotos = photosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Photo[];

        setPhotos(fetchedPhotos);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching photos:', error);
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [setPhotos]);

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PhotoGrid />
        </main>
      </div>
    </div>
  );
}

export default App;