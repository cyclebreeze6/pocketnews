
'use client';

import SiteHeader from '../../../components/site-header';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { useUser, useCollection, useFirebase, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '../../../firebase';
import { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/use-toast';
import type { Category, Collection } from '../../../lib/types';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { Loader2, PlusCircle, Trash2, Edit, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../../../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';

function CollectionsSettingsSkeleton() {
    return (
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <Skeleton className="h-10 w-2/3 mb-2" />
            <Skeleton className="h-6 w-full mb-8" />
            
            <div className="flex justify-end mb-8">
              <Skeleton className="h-10 w-40" />
            </div>

            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
        </div>
    )
}

export default function CollectionsSettingsPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const collectionsQuery = useMemoFirebase(() => (user ? collection(firestore, 'users', user.uid, 'collections') : null), [firestore, user]);
  const { data: userCollections, isLoading: collectionsLoading } = useCollection<Collection>(collectionsQuery);

  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: allCategories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  

  useEffect(() => {
    // If user is not logged in, redirect to home
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  const handleOpenDialog = (collectionToEdit: Collection | null = null) => {
    setEditingCollection(collectionToEdit);
    if (collectionToEdit) {
      setCollectionName(collectionToEdit.name);
      setSelectedCategories(collectionToEdit.categoryIds);
    } else {
      setCollectionName('');
      setSelectedCategories([]);
    }
    setIsDialogOpen(true);
  };
  
  const handleCategoryToggle = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    if (!collectionName || selectedCategories.length === 0) {
      toast({ variant: 'destructive', title: 'Please provide a name and select at least one category.' });
      return;
    }
    
    setIsSaving(true);
    
    const dataToSave = {
      name: collectionName,
      userId: user.uid,
      categoryIds: selectedCategories,
    };

    if (editingCollection) {
      const collectionRef = doc(firestore, 'users', user.uid, 'collections', editingCollection.id);
      updateDocumentNonBlocking(collectionRef, dataToSave);
      toast({ title: 'Collection Updated!', description: `"${collectionName}" has been saved.`});
    } else {
      const collectionsRef = collection(firestore, 'users', user.uid, 'collections');
      addDocumentNonBlocking(collectionsRef, { ...dataToSave, createdAt: serverTimestamp() });
      toast({ title: 'Collection Created!', description: `"${collectionName}" has been added.`});
    }

    setIsSaving(false);
    setIsDialogOpen(false);
  };

  const handleDeleteCollection = (collectionToDelete: Collection) => {
    if (!user) return;
    if (confirm(`Are you sure you want to delete the "${collectionToDelete.name}" collection?`)) {
        const collectionRef = doc(firestore, 'users', user.uid, 'collections', collectionToDelete.id);
        deleteDocumentNonBlocking(collectionRef);
        toast({ title: 'Collection Deleted' });
    }
  }

  const isLoading = isUserLoading || collectionsLoading || categoriesLoading;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <SiteHeader />
       <main className="flex-1 py-12 md:py-16">
        {isLoading ? (
            <CollectionsSettingsSkeleton />
        ) : (
            <div className="container px-4 md:px-6 max-w-4xl mx-auto">
                 <h1 className="text-3xl font-bold tracking-tight mb-2 font-headline">
                    Manage Your Collections
                </h1>
                <p className="text-muted-foreground mb-8">
                    Create and manage named collections based on your favorite categories.
                </p>

                <div className="flex justify-end mb-8">
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Collection
                    </Button>
                </div>

                <div className="space-y-4">
                  {userCollections && userCollections.length > 0 ? (
                    userCollections.map(c => (
                      <Card key={c.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-sm text-muted-foreground">{c.categoryIds.length} categories</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(c)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCollection(c)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <h2 className="text-xl font-semibold">You have no collections</h2>
                        <p className="text-muted-foreground mt-2">
                            Click "Create New Collection" to get started.
                        </p>
                    </div>
                  )}
                </div>

            </div>
        )}
      </main>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>{editingCollection ? 'Edit Collection' : 'Create New Collection'}</DialogTitle>
                    <DialogDescription>
                        Give your collection a name and select the categories you want to include.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="collection-name">Collection Name</Label>
                      <Input 
                        id="collection-name" 
                        value={collectionName} 
                        onChange={(e) => setCollectionName(e.target.value)} 
                        placeholder="e.g., Tech & Science"
                      />
                    </div>
                    <div className="grid gap-2">
                        <Label>Categories</Label>
                        <Card>
                            <CardContent className="p-4 max-h-60 overflow-y-auto">
                               <div className="grid grid-cols-2 gap-4">
                                {allCategories?.map((category) => (
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
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingCollection ? 'Save Changes' : 'Create Collection'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
