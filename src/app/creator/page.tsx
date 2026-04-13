'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';
import { PlusSquare, HandCoins, TrendingUp, AlertCircle, Loader2, Clapperboard } from 'lucide-react';
import { useUser, useFirebase, useCollection, useDoc, addDocumentNonBlocking, useMemoFirebase } from '../../firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import type { Video, UserProfile, PayoutRequest, Channel } from '../../lib/types';
import { useState, useMemo } from 'react';
import { useToast } from '../../hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

export default function CreatorDashboardPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const videosQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'videos'), where('creatorId', '==', user.uid));
  }, [user, firestore]);

  const { data: videos, isLoading: videosLoading } = useCollection<Video>(videosQuery);

  const userProfileRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const channelsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'channels'), where('creatorId', '==', user.uid));
  }, [user, firestore]);

  const { data: creatorChannels, isLoading: channelsLoading } = useCollection<Channel>(channelsQuery);

  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  const totalViews = useMemo(() => {
    return videos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
  }, [videos]);

  const isMonetized = totalViews >= 10000;
  const earningsEstimateNaira = Math.floor(totalViews / 1000) * 600;
  const totalPaidOutNaira = userProfile?.totalPaidOutNaira || 0;
  const currentBalanceNaira = Math.max(0, earningsEstimateNaira - totalPaidOutNaira);

  const handleRequestPayout = async () => {
    if (!user) return;
    if (currentBalanceNaira < 20000) {
      toast({ variant: 'destructive', title: 'Insufficient Balance', description: 'You need at least N20,000 to request a payout.' });
      return;
    }

    if (!confirm(`Are you sure you want to request a payout of NGN ${currentBalanceNaira.toLocaleString()}?`)) return;

    setIsRequestingPayout(true);
    try {
      const payoutRef = collection(firestore, 'payout_requests');
      const payoutData: Partial<PayoutRequest> = {
        creatorId: user.uid,
        amountNaira: currentBalanceNaira,
        status: 'pending',
        createdAt: serverTimestamp() as any,
      };
      
      await addDocumentNonBlocking(payoutRef, payoutData);
      
      toast({ title: 'Payout Requested!', description: 'Your request is being processed. It may take a few business days.' });
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsRequestingPayout(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 font-headline">Creator Hub</h1>
        <p className="text-muted-foreground">
          Manage your content, view your analytics, and track your earnings.
        </p>
      </div>

      {isMonetized && (
        <Alert className="bg-green-50 border-green-200 text-green-900 shadow-sm">
          <HandCoins className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800 font-bold">Congratulations! You are Monetized.</AlertTitle>
          <AlertDescription>
            You have crossed 10,000 lifetime views. You are now earning a 60% revenue share (N600 per 1,000 views).
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lifetime Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {!isMonetized && `${(10000 - totalViews).toLocaleString()} more views until monetization!`}
            </p>
          </CardContent>
        </Card>

        {isMonetized && (
            <>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Estimated Lifetime Earnings</CardTitle>
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">NGN {earningsEstimateNaira.toLocaleString()}</div>
                </CardContent>
                </Card>

                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                    <HandCoins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">NGN {totalPaidOutNaira.toLocaleString()}</div>
                </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Current Balance</CardTitle>
                    <HandCoins className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary mb-2">NGN {currentBalanceNaira.toLocaleString()}</div>
                    {currentBalanceNaira >= 20000 ? (
                        <Button size="sm" onClick={handleRequestPayout} disabled={isRequestingPayout} className="w-full">
                            {isRequestingPayout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Request Payout'}
                        </Button>
                    ) : (
                        <p className="text-xs text-muted-foreground">Reach N20,000 to request payout</p>
                    )}
                </CardContent>
                </Card>
            </>
        )}
      </div>

      {!channelsLoading && (!creatorChannels || creatorChannels.length === 0) && (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold">Create a channel first</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            You need at least one creator channel before you can upload videos.{' '}
            <Link href="/creator/channels/new" className="underline font-medium hover:opacity-80">
              Create your channel →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 pt-6 border-t">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlusSquare className="h-5 w-5" /> Upload Video</CardTitle>
            <CardDescription>Upload a new video to your Creator Studio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/creator/videos/new"
              className="text-sm text-primary font-mono underline break-all hover:opacity-75 transition-opacity"
            >
              https://pocketnewslive.tv/creator/videos/new
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clapperboard className="h-5 w-5" /> Add Short</CardTitle>
            <CardDescription>Create and publish short-form videos to Shorts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/creator/shorts/new"
              className="text-sm text-primary font-mono underline break-all hover:opacity-75 transition-opacity"
            >
              https://pocketnewslive.tv/creator/shorts/new
            </Link>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
