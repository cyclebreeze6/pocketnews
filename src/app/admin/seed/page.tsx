'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

// Sample Data
const sampleChannels = [
  { id: 'news-network', name: 'Global News Network', description: 'Your 24/7 source for breaking news from around the world.' },
  { id: 'tech-today', name: 'Tech Today', description: 'The latest in technology, gadgets, and innovation.' },
  { id: 'sports-sphere', name: 'Sports Sphere', description: 'All the action from the world of sports.' },
];

const sampleVideos = [
  { youtubeId: '6n3iFj-iKPY', title: 'Global Economic Summit Highlights', description: 'Key moments from the annual Global Economic Summit.', channelId: 'news-network', views: 120000, watchTime: 1500, thumbnailUrl: 'https://i.ytimg.com/vi/6n3iFj-iKPY/hqdefault.jpg', contentCategory: 'Business and Economy' },
  { youtubeId: 'f627pKNd-I4', title: 'The Future of Artificial Intelligence', description: 'Experts discuss the trajectory of AI and its impact on society.', channelId: 'tech-today', views: 75000, watchTime: 900, thumbnailUrl: 'https://i.ytimg.com/vi/f627pKNd-I4/hqdefault.jpg', contentCategory: 'Technology' },
  { youtubeId: 'JGwWNGJdvx8', title: 'Championship Highlights: The Final Match', description: 'Relive the thrilling conclusion to the season\'s biggest tournament.', channelId: 'sports-sphere', views: 250000, watchTime: 3000, thumbnailUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', contentCategory: 'Sports' },
  { youtubeId: '9bZkp7q19f0', title: 'Investigative Report: The Water Crisis', description: 'A deep dive into the growing global water scarcity issue.', channelId: 'news-network', views: 89000, watchTime: 1100, thumbnailUrl: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg', contentCategory: 'Climate and Environment' },
  { youtubeId: 'nt3A-p-E3x4', title: 'New Smartphone Hands-On Review', description: 'An in-depth first look at the most anticipated smartphone of the year.', channelId: 'tech-today', views: 150000, watchTime: 1800, thumbnailUrl: 'https://i.ytimg.com/vi/nt3A-p-E3x4/hqdefault.jpg', contentCategory: 'Technology' },
];

const sampleCategories = [
    "My Headlines", "Breaking News", "Live News", "Podcasts", "World News",
    "Local News", "Politics", "Business and Economy", "Technology", "Health",
    "Climate and Environment", "Entertainment", "Sports", "Fashion & Style",
    "Culture & Lifestyle", "Travel", "Interviews & Documentaries", "Short Clips", "Weather"
];


export default function SeedDataPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isGrantingAdmin, setIsGrantingAdmin] = useState(false);
  const [isSeedingCategories, setIsSeedingCategories] = useState(false);

  const handleGrantAdmin = async () => {
    setIsGrantingAdmin(true);
    // This is the specific user ID for 'valentinoboss18@gmail.com' from the error logs.
    const adminId = 'Kmjzk20TQ9fJSK24tnxoP9C1jg83';
    
    try {
      const batch = writeBatch(firestore);

      // 1. Create the document in /roles_admin to grant the role via security rules.
      const adminRoleRef = doc(firestore, 'roles_admin', adminId);
      batch.set(adminRoleRef, { grantedAt: serverTimestamp() });
      
      // 2. Also set the isAdmin flag on the user document itself for UI purposes.
      const userRef = doc(firestore, 'users', adminId);
      batch.set(userRef, { isAdmin: true }, { merge: true });

      await batch.commit();

      toast({
        title: 'Admin Role Granted!',
        description: `User valentinoboss18@gmail.com has been granted full administrator privileges. Please refresh the page to access the admin panel.`,
      });
    } catch (error: any) {
      console.error('Error granting admin role:', error);
      toast({
        variant: 'destructive',
        title: 'Error Granting Admin Role',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsGrantingAdmin(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(firestore);

      // Seed Channels
      const channelsCollection = collection(firestore, 'channels');
      sampleChannels.forEach(channel => {
        const docRef = doc(channelsCollection, channel.id);
        batch.set(docRef, { ...channel, createdAt: serverTimestamp() });
      });

      // Seed Videos
      const videosCollection = collection(firestore, 'videos');
      sampleVideos.forEach(videoData => {
        const newVideoRef = doc(videosCollection); // Auto-generate ID
        batch.set(newVideoRef, {
            ...videoData,
            id: newVideoRef.id,
            youtubeVideoId: videoData.youtubeId,
            uploadDate: serverTimestamp(),
        });
      });

      await batch.commit();

      toast({
        title: 'Database seeded successfully!',
        description: `${sampleChannels.length} channels and ${sampleVideos.length} videos have been added.`,
      });
    } catch (error: any) {
      console.error('Error seeding data:', error);
      toast({
        variant: 'destructive',
        title: 'Error seeding data',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSeedCategories = async () => {
    setIsSeedingCategories(true);
    try {
      const batch = writeBatch(firestore);
      const categoriesCollection = collection(firestore, 'categories');
      sampleCategories.forEach(name => {
        const newCatRef = doc(categoriesCollection);
        batch.set(newCatRef, {
          id: newCatRef.id,
          name: name,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
      toast({
        title: 'Categories seeded!',
        description: `${sampleCategories.length} categories have been added.`,
      });
    } catch (error: any) {
      console.error('Error seeding categories:', error);
      toast({
        variant: 'destructive',
        title: 'Error Seeding Categories',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSeedingCategories(false);
    }
  };

  return (
    <div className="grid gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Seed & Fix Permissions</h1>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Fix Admin Permissions</CardTitle>
          <CardDescription>
            If you are unable to access admin pages, click this button to grant your user account
            (`valentinoboss18@gmail.com`) full administrator privileges. This is a one-time setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGrantAdmin} disabled={isGrantingAdmin}>
            {isGrantingAdmin ? 'Granting...' : 'Make Me Admin'}
          </Button>
        </CardContent>
      </Card>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Populate with Sample Categories</CardTitle>
          <CardDescription>
            Click the button below to add the standard content categories to your Firestore database.
            This action is recommended for all new setups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeedCategories} disabled={isSeedingCategories}>
            {isSeedingCategories ? 'Seeding Categories...' : 'Seed Categories'}
          </Button>
           <p className="text-xs text-muted-foreground mt-4">
              Note: This will create {sampleCategories.length} categories.
          </p>
        </CardContent>
      </Card>
      
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Populate with Sample Videos & Channels</CardTitle>
          <CardDescription>
            Click the button below to add sample channels and videos to your Firestore database.
            This is useful for development and testing. This action may overwrite existing documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeedData} disabled={isSeeding}>
            {isSeeding ? 'Seeding...' : 'Seed Sample Data'}
          </Button>
           <p className="text-xs text-muted-foreground mt-4">
              Note: This will create {sampleChannels.length} channels and {sampleVideos.length} videos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    