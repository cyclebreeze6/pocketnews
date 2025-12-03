import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
}

export interface Channel {
  id: string;
  name:string;
  description: string;
  createdAt?: Timestamp | Date | string;
}

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  views: number;
  watchTime: number; // in hours
  channelId: string;
  createdAt: Timestamp | Date | string;
  thumbnailUrl: string;
  contentCategory: string;
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
