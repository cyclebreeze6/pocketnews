
import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  isCreator?: boolean;
}

export interface Channel {
  id: string;
  name:string;
  description: string;
  createdAt?: Timestamp | Date | string;
  logoUrl?: string;
}

export interface Video {
  id: string;
  youtubeVideoId: string;
  title: string;
  description: string;
  views: number;
  watchTime: number; // in hours
  channelId: string;
  uploadDate: Timestamp | Date | string;
  thumbnailUrl: string;
  contentCategory: string;
  // compatibility with existing data
  youtubeId?: string;
  createdAt: Timestamp | Date | string;
}

export interface Category {
  id: string;
  name: string;
  createdAt?: Timestamp | Date | string;
}

export interface UserProfile extends User {
  // You can add more user-specific fields here
}

export interface UserFollow {
  channelId: string;
  userId: string;
  followedAt: Timestamp;
}

export interface WatchHistory {
  id: string;
  userId: string;
  videoId: string;
  watchedAt: Timestamp;
}

    