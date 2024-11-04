import React, { useState } from 'react';
import { useStore } from '../store';
import { Comment } from '../types';

interface CommentSectionProps {
  photoId: string;
  comments: Comment[];
}

export function CommentSection({ photoId, comments }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const { user, addComment } = useStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    
    addComment(photoId, newComment.trim());
    setNewComment('');
  };

  return (
    <div className="mt-4">
      {comments.map((comment) => (
        <div key={comment.id} className="mb-3 flex items-start space-x-2">
          <img
            src={comment.avatar}
            alt={comment.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {comment.username}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {comment.content}
            </p>
          </div>
        </div>
      ))}
      
      {user && (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </form>
      )}
    </div>
  );
}