'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking, uploadFile, useStorage, addDocumentNonBlocking } from '../../../firebase';
import type { Channel } from '../../../lib/types';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2, Loader2, X, Tv } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useState } from 'react';
import { useToast } from '../../../hooks/use-toast';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Textarea } from '../../../components/ui/textarea';

export default function CreatorChannelsPage() {
  const { firestore } = useFirebase();
  const storage = useStorage();
  const { toast } = useToast();

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);

  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setChannelName('');
    setChannelDescription('');
    setLogoFile(null);
    setLogoPreview(null);
    setEditingChannel(null);
  };

  const handleSetEditing = (channel: Channel | null) => {
    if (channel) {
      setEditingChannel(channel);
      setChannelName(channel.name);
      setChannelDescription(channel.description);
      setLogoPreview(channel.logoUrl || null);
      setLogoFile(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      resetForm();
    }
  };

  const handleSaveChanges = async () => {
    if (!channelName || !channelDescription) {
      toast({ variant: 'destructive', title: 'Please fill out all fields.' });
      return;
    }

    setIsSaving(true);
    
    try {
        let logoUrl = editingChannel?.logoUrl || '';

        if (logoFile) {
            const filePath = `channel-logos/${Date.now()}_${logoFile.name}`;
            logoUrl = await uploadFile(storage, logoFile, filePath);
        }

        if (editingChannel) {
            const channelRef = doc(firestore, 'channels', editingChannel.id);
            const updatedData: Partial<Channel> = { name: channelName, description: channelDescription };
            if (logoUrl) updatedData.logoUrl = logoUrl;
            
            await setDoc(channelRef, updatedData, { merge: true });
            toast({ title: 'Channel updated!' });
        } else {
            const channelsCollection = collection(firestore, 'channels');
            const newDocRef = doc(channelsCollection);
            const newChannelData = {
                id: newDocRef.id,
                name: channelName,
                description: channelDescription,
                logoUrl: logoUrl,
                createdAt: serverTimestamp(),
            };
            await setDoc(newDocRef, newChannelData);
            toast({ title: 'Channel created!' });
        }

        resetForm();
    } catch (error) {
        console.error("Failed to save channel:", error);
        toast({ variant: 'destructive', title: 'Save failed', description: 'Could not save channel data.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = (channelId: string) => {
    if (confirm('Are you sure you want to delete this channel? This will not delete the videos in it.')) {
      const channelRef = doc(firestore, 'channels', channelId);
      deleteDocumentNonBlocking(channelRef);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Channels</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingChannel ? 'Edit Channel' : 'Add New Channel'}</CardTitle>
          <CardDescription>
            {editingChannel ? `Editing the channel "${editingChannel.name}"` : 'Fill out the form below to add a new channel.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid gap-4">
               <div className="grid gap-2">
                  <Label htmlFor="name">Channel Name</Label>
                  <Input id="name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={channelDescription} onChange={(e) => setChannelDescription(e.target.value)} />
                </div>
            </div>
            <div className="grid gap-2 content-start">
                <Label htmlFor="logo">Channel Logo</Label>
                <div className="relative w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    {logoPreview ? (
                        <Image src={logoPreview} alt="Logo preview" layout="fill" className="object-cover rounded-lg" />
                    ) : (
                        <Tv className="w-16 h-16" />
                    )}
                </div>
                <Input id="logo" type="file" accept="image/*" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 1MB.</p>
            </div>
          </div>
        </CardContent>
        <div className="p-6 pt-0 flex justify-between">
            <div>
              {editingChannel && (
                <Button variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel Edit
                </Button>
              )}
            </div>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Saving...' : (editingChannel ? 'Update Channel' : 'Add Channel')}
            </Button>
        </div>
      </Card>

      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels?.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell>
                     <Avatar>
                        {channel.logoUrl ? <AvatarImage src={channel.logoUrl} alt={channel.name} /> : <Tv className="p-2"/>}
                        <AvatarFallback>{channel.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>{channel.description}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSetEditing(channel)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(channel.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
