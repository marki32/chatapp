import { create } from 'zustand';
import { User, Photo } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

interface AppState {
  user: User | null;
  photos: Photo[];
  darkMode: boolean;
  setUser: (user: User | null) => void;
  setPhotos: (photos: Photo[]) => void;
  updateUserProfile: (user: User) => void;
  addPhoto: (photo: Photo) => void;
  toggleDarkMode: () => void;
  likePhoto: (photoId: string) => void;
  addComment: (photoId: string, comment: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  photos: [],
  darkMode: false,
  setUser: (user) => set({ user }),
  setPhotos: (photos) => set({ photos }),
  updateUserProfile: (user) => set({ user }),
  addPhoto: (photo) => set((state) => ({ photos: [photo, ...state.photos] })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  likePhoto: async (photoId) => {
    const { user } = get();
    if (!user) return;

    try {
      await updateDoc(doc(db, 'photos', photoId), {
        likes: increment(1),
        likedBy: arrayUnion(user.id)
      });

      set((state) => ({
        photos: state.photos.map((photo) =>
          photo.id === photoId ? { ...photo, likes: photo.likes + 1 } : photo
        ),
      }));
    } catch (error) {
      console.error('Error liking photo:', error);
    }
  },
  addComment: async (photoId, content) => {
    const { user } = get();
    if (!user) return;

    const comment = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, 'photos', photoId), {
        comments: arrayUnion(comment)
      });

      set((state) => ({
        photos: state.photos.map((photo) =>
          photo.id === photoId
            ? { ...photo, comments: [...photo.comments, comment] }
            : photo
        ),
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  },
}));