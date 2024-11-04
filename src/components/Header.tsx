import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, User, Sun, Moon, X } from 'lucide-react';
import { useStore } from '../store';
import { UploadModal } from './UploadModal';
import { AuthModal } from './AuthModal';
import { ProfileModal } from './ProfileModal';
import { SearchResults } from '../types';
import { UserProfile } from './UserProfile';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function Header() {
  const { darkMode, toggleDarkMode, user } = useStore();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.length < 2) {
      setSearchResults(null);
      return;
    }

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '>=', value.toLowerCase()),
        where('username', '<=', value.toLowerCase() + '\uf8ff')
      );

      const photosQuery = query(
        collection(db, 'photos'),
        where('caption', '>=', value),
        where('caption', '<=', value + '\uf8ff')
      );

      const [usersSnapshot, photosSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(photosQuery)
      ]);

      setSearchResults({
        users: usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)),
        photos: photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
      });
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleUploadClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowUploadModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PhotoGram</h1>
            </div>
            
            <div className="flex-1 max-w-md mx-4" ref={searchRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search users or photos..."
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
                
                {searchResults && (
                  <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                    {searchResults.users.length > 0 && (
                      <div className="p-2">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                          Users
                        </h3>
                        {searchResults.users.map(user => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setSearchResults(null);
                              setSearchQuery('');
                            }}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md w-full text-left"
                          >
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {user.username}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.followers} followers
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <button 
                onClick={handleUploadClick}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Upload className="h-5 w-5" />
              </button>
              
              {user ? (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.username}
                  </span>
                </button>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <User className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <UserProfile
        userId={selectedUserId}
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </>
  );
}