import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import { useInView } from 'react-intersection-observer';
import { Heart, MessageCircle, Share2, Download, Play } from 'lucide-react';
import { useStore } from '../store';
import { Photo } from '../types';
import { CommentSection } from './CommentSection';
import { AuthModal } from './AuthModal';
import { PostModal } from './PostModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatFileSize } from '../lib/mediaUtils';

const breakpointColumns = {
  default: 3,
  1100: 2,
  700: 1,
};

export function PhotoGrid() {
  const { photos, likePhoto, user } = useStore();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPhotoData, setSelectedPhotoData] = useState<{photo: Photo; user: any} | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [downloadError, setDownloadError] = useState<{ [key: string]: string }>({});
  const [ref, inView] = useInView({
    threshold: 0,
    triggerOnce: true,
  });

  const handleLike = (photoId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    likePhoto(photoId);
  };

  const handleShare = async (photo: Photo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.caption,
          text: `Check out this ${photo.media?.type || 'content'} on PhotoGram`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleDownload = async (photo: Photo) => {
    if (!photo.media?.url) {
      setDownloadError({ [photo.id]: 'No media URL available' });
      return;
    }

    try {
      // Clear any previous errors
      setDownloadError(prev => {
        const newErrors = { ...prev };
        delete newErrors[photo.id];
        return newErrors;
      });

      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = photo.media.url;
      a.download = `photogram-${photo.id}.${photo.media.type === 'video' ? 'mp4' : 'jpg'}`;
      a.target = '_blank'; // Open in new tab if download fails
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadError({ 
        [photo.id]: 'Failed to download. Try right-clicking and selecting "Save As" instead.' 
      });
    }
  };

  const handlePhotoClick = async (photo: Photo) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', photo.userId));
      if (userDoc.exists()) {
        setSelectedPhotoData({
          photo,
          user: { id: userDoc.id, ...userDoc.data() }
        });
        setShowPostModal(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No photos available
      </div>
    );
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex w-auto -ml-4"
        columnClassName="pl-4"
      >
        {photos.map((photo: Photo) => {
          if (!photo?.media) return null;

          return (
            <div
              key={`photo-card-${photo.id}`}
              className="mb-4 break-inside-avoid"
              ref={ref}
            >
              <div 
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer group"
                onClick={() => handlePhotoClick(photo)}
              >
                <div className="relative">
                  {photo.media.type === 'video' ? (
                    <>
                      <video
                        poster={photo.media.thumbnailUrl}
                        className="w-full h-auto"
                        preload="metadata"
                      >
                        <source src={photo.media.url} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={photo.media.url}
                      alt={photo.caption}
                      className={`w-full h-auto ${photo.filter || ''}`}
                      loading="lazy"
                    />
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(photo.id);
                        }}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <Heart className={`w-5 h-5 ${photo.likes > 0 ? 'fill-current text-red-500' : ''}`} />
                        <span>{photo.likes}</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(selectedPhoto === photo.id ? null : photo.id);
                        }}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-300"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>{photo.comments?.length || 0}</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(photo);
                        }}
                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                        disabled={downloadProgress[photo.id] !== undefined}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(photo);
                        }}
                        className="text-gray-600 dark:text-gray-300"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {downloadError[photo.id] && (
                    <p className="text-sm text-red-500 mt-1">
                      {downloadError[photo.id]}
                    </p>
                  )}
                  <p className="text-gray-800 dark:text-gray-200">{photo.caption}</p>
                  {photo.media.size && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatFileSize(photo.media.size)}
                    </p>
                  )}
                  {selectedPhoto === photo.id && photo.comments && (
                    <CommentSection photoId={photo.id} comments={photo.comments} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </Masonry>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {selectedPhotoData && (
        <PostModal
          photo={selectedPhotoData.photo}
          user={selectedPhotoData.user}
          isOpen={showPostModal}
          onClose={() => {
            setShowPostModal(false);
            setSelectedPhotoData(null);
          }}
        />
      )}
    </>
  );
}