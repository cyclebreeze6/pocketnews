
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
  youtubeChannelUrl?: string; // For auto-syncing
  youtubeChannelId?: string; // For matching imported videos
  language?: string;
  region?: string[];
  isAutoSyncEnabled?: boolean; // New field for managing auto-post
  creatorId?: string;
}

export interface Video {
  id: string;
  youtubeVideoId?: string;
  videoUrl?: string;
  title: string;
  description: string;
  views: number;
  watchTime: number; // in hours
  channelId: string;
  uploadDate: Timestamp | Date | string;
  thumbnailUrl: string;
  contentCategory: string;
  regions?: string[];
  creatorId?: string;
  // compatibility with existing data
  youtubeId?: string;
  createdAt: Timestamp | Date | string;
}

export interface Short {
  id: string;
  youtubeVideoId?: string;
  videoUrl?: string;
  title: string;
  thumbnailUrl: string;
  channelId: string;
  creatorId: string;
  createdAt: Timestamp | Date | string;
}

export interface Category {
  id: string;
  name: string;
  createdAt?: Timestamp | Date | string;
}

export interface UserProfile extends User {
  totalPaidOutNaira?: number;
}

export interface WatchHistory {
  id: string;
  userId: string;
  videoId: string;
  watchedAt: Timestamp;
}

export interface Report {
    id:string;
    videoId: string;
    videoTitle: string;
    userId: string;
    reason: 'Copyright' | 'Wrong Information' | 'False News' | 'Other';
    details: string;
    createdAt: Timestamp | Date | string;
    status: 'Pending' | 'Reviewed' | 'Resolved' | 'Dismissed';
}

export interface FollowedChannel {
  id: string; // This will be the channelId
  channelId: string;
  followedAt: Timestamp;
}

export interface CreatorApplication {
  id: string;
  userId: string;
  email: string;
  contentTypes: string[];
  ninNumber: string;
  termsAccepted: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp | Date | string;
}

export interface PayoutRequest {
  id: string;
  creatorId: string;
  amountNaira: number;
  status: 'pending' | 'paid' | 'rejected';
  createdAt: Timestamp | Date | string;
}
