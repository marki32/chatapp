import React from 'react';
import { X, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Photo, User } from '../types';
import { useStore } from '../store';
import { CommentSection } from './CommentSection';

interface PostModalProps {
  photo: Photo;
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function PostModal({ photo, user, isOpen, onClose }: PostModalProps) {
  const { likePhoto, user: currentUser } = useStore();

  if (!isOpen) return null;

  const handleLike = () => {
    if (!currentUser) return;
    likePhoto(photo.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.caption,
          text: `Check out this photo on PhotoGram`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-5xl w-full max-h-[90vh] flex overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white z-10 hover:opacity-75"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Left side - Photo/Video */}
        <div className="w-[60%] bg-black flex items-center justify-center">
          {photo.media.type === 'video' ? (
            <video
              src={photo.media.url}
              controls
              className="max-h-[90vh] max-w-full"
              poster={photo.media.thumbnailUrl}
            />
          ) : (
            <img
              src={photo.media.url}
              alt={photo.caption}
              className={`max-h-[90vh] max-w-full object-contain ${photo.filter}`}
            />
          )}
        </div>

        {/* Right side - Details */}
        <div className="w-[40%] flex flex-col h-[90vh]">
          {/* Header */}
          <div className="p-4 border-b dark:border-gray-700 flex items-center space-x-3">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {user.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(photo.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Caption and Comments */}
          <div className="flex-1 overflow-y-auto p-4">
            {photo.caption && (
              <div className="flex space-x-3 mb-4">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white mr-2">
                    {user.username}
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {photo.caption}
                  </span>
                </div>
              </div>
            )}
            <CommentSection photoId={photo.id} comments={photo.comments} />
          </div>

          {/* Actions */}
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-4">
                <button
                  onClick={handleLike}
                  className={`text-2xl ${
                    photo.likes > 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Heart className="h-6 w-6" />
                </button>
                <button className="text-gray-600 dark:text-gray-300">
                  <MessageCircle className="h-6 w-6" />
                </button>
                <button
                  onClick={handleShare}
                  className="text-gray-600 dark:text-gray-300"
                >
                  <Share2 className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gray-900 dark:text-white">
                {photo.likes} likes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}