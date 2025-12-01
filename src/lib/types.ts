export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user';
}

export interface Channel {
  id: string;
  name:string;
  description: string;
  videoIds: string[];
}

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  views: number;
  watchTime: number; // in hours
  channelId: string;
  createdAt: string;
  thumbnailUrl: string;
  contentCategory: string;
}
