import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Instagram, Twitter, Facebook, UserPlus, UserMinus } from 'lucide-react';
import { User, Photo } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { LoadingSpinner } from './LoadingSpinner';
import { useStore } from '../store';

interface UserProfileProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ userId, isOpen, onClose }: UserProfileProps) {
  const { user: currentUser } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          setUser(userData);
          
          // Check if current user is following this user
          if (currentUser) {
            const isFollowingUser = userData.followersList?.includes(currentUser.id);
            setIsFollowing(!!isFollowingUser);
          }
        }

        const photosQuery = query(
          collection(db, 'photos'),
          where('userId', '==', userId)
        );
        const photosSnapshot = await getDocs(photosQuery);
        setPhotos(photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo)));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    if (isOpen && userId) {
      fetchUserData();
    }
  }, [userId, isOpen, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !user || followLoading) return;

    try {
      setFollowLoading(true);

      // Update current user's following list
      await updateDoc(doc(db, 'users', currentUser.id), {
        following: isFollowing ? increment(-1) : increment(1),
        followingList: isFollowing 
          ? arrayRemove(user.id)
          : arrayUnion(user.id)
      });

      // Update target user's followers list
      await updateDoc(doc(db, 'users', user.id), {
        followers: isFollowing ? increment(-1) : increment(1),
        followersList: isFollowing 
          ? arrayRemove(currentUser.id)
          : arrayUnion(currentUser.id)
      });

      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (!isOpen || !userId) return null;
  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl mx-4 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          <div className="flex items-start space-x-6">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.username}
                </h2>
                {currentUser && currentUser.id !== user.id && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      isFollowing
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        : 'bg-blue-500 text-white'
                    } hover:opacity-90 transition-opacity disabled:opacity-50`}
                  >
                    {followLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
                <span>{photos.length} posts</span>
                <span>{user.followers} followers</span>
                <span>{user.following} following</span>
              </div>

              {user.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {user.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-500 hover:text-blue-600"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
                {user.social?.instagram && (
                  <a
                    href={`https://instagram.com/${user.social.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-pink-500 hover:text-pink-600"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>{user.social.instagram}</span>
                  </a>
                )}
                {user.social?.twitter && (
                  <a
                    href={`https://twitter.com/${user.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-400 hover:text-blue-500"
                  >
                    <Twitter className="h-4 w-4" />
                    <span>{user.social.twitter}</span>
                  </a>
                )}
                {user.social?.facebook && (
                  <a
                    href={user.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Facebook className="h-4 w-4" />
                    <span>Facebook</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Posts
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {photos.map(photo => (
                <div
                  key={photo.id}
                  className="aspect-square overflow-hidden rounded-lg relative group"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className={`w-full h-full object-cover ${photo.filter}`}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 text-white">
                    <div className="flex items-center">
                      <span className="font-semibold">{photo.likes}</span>
                      <span className="ml-1">likes</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold">{photo.comments.length}</span>
                      <span className="ml-1">comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}