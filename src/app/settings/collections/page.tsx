
'use client';

import SiteHeader from '../../../components/site-header';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { useUser, useDoc, useCollection, useFirebase, useMemoFirebase, updateDocumentNonBlocking } from '../../../firebase';
import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/use-toast';
import type { Category, UserProfile } from '../../../lib/types';
import { collection, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../../../components/ui/skeleton';


function CollectionsSettingsSkeleton() {
    return (
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <Skeleton className="h-10 w-2/3 mb-2" />
            <Skeleton className="h-6 w-full mb-8" />
            
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-8 w-1/3" /></CardTitle>
                    <div className="flex items-center justify-between">
                       <CardDescription><Skeleton className="h-5 w-1/2" /></CardDescription>
                         <div className="flex gap-2">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                             <Skeleton key={i} className="h-14 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
             <div className="mt-8 flex justify-end">
                <Skeleton className="h-12 w-64" />
            </div>
        </div>
    )
}

export default function CollectionsSettingsPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.preferredCategories) {
      setSelectedCategories(userProfile.preferredCategories);
    }
  }, [userProfile]);

  useEffect(() => {
    // If user is not logged in, redirect to home
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);


  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };
  
  const handleSelectAll = () => {
    if (categories) {
        setSelectedCategories(categories.map(c => c.name));
    }
  };

  const handleClearAll = () => {
      setSelectedCategories([]);
  };

  const handleSaveChanges = async () => {
    if (!userProfileRef) return;
    
    setIsSaving(true);
    
    // Update Firestore
    updateDocumentNonBlocking(userProfileRef, { preferredCategories: selectedCategories });

    setIsSaving(false);
    toast({ title: 'Your collections have been updated!' });
    router.push('/my-collections'); // Redirect to collections page to see changes
  };

  const isLoading = isUserLoading || isProfileLoading || categoriesLoading;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
       <main className="flex-1 py-12 md:py-16">
        {isLoading ? (
            <CollectionsSettingsSkeleton />
        ) : (
            <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                 <h1 className="text-3xl font-bold tracking-tight mb-2 font-headline">
                    What's in your Collection?
                </h1>
                <p className="text-muted-foreground mb-8">
                    Select the topics you're interested in. This will customize the content on your "My Collections" page.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle>Choose Your Categories</CardTitle>
                        <div className="flex items-center justify-between">
                            <CardDescription>Select at least one to get started.</CardDescription>
                             <div className="flex gap-2">
                                <Button variant="link" size="sm" onClick={handleSelectAll}>Select All</Button>
                                <Button variant="link" size="sm" onClick={handleClearAll}>Clear All</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {categories?.map((category) => (
                            <div
                                key={category.id}
                                className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => handleCategoryToggle(category.name)}
                            >
                                <Checkbox
                                id={`cat-${category.id}`}
                                checked={selectedCategories.includes(category.name)}
                                onCheckedChange={() => handleCategoryToggle(category.name)}
                                />
                                <Label
                                htmlFor={`cat-${category.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                                >
                                {category.name}
                                </Label>
                            </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 flex justify-end">
                    <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save My Collection
                    </Button>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}


    