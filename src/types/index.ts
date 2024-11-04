export interface User {
  id: string;
  username: string;
  avatar: string;
  following: number;
  followers: number;
  followingList?: string[];
  followersList?: string[];
  bio?: string;
  website?: string;
  social?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface MediaType {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  size?: number;
}

export interface Photo {
  id: string;
  media: MediaType;
  caption: string;
  likes: number;
  comments: Comment[];
  userId: string;
  filter: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface SearchResults {
  users: User[];
  photos: Photo[];
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}