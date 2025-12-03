'use client';

import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking } from '../../../firebase';
import type { Channel } from '../../../lib/types';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useState } from 'react';
import { useToast } from '../../../hooks/use-toast';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';

export default function AdminChannelsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const channelsQuery = useMemoFirebase(() => collection(firestore, 'channels'), [firestore]);
  const { data: channels } = useCollection<Channel>(channelsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  const handleOpenDialog = (channel: Channel | null = null) => {
    setEditingChannel(channel);
    setChannelName(channel ? channel.name : '');
    setChannelDescription(channel ? channel.description : '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingChannel(null);
    setChannelName('');
    setChannelDescription('');
  };

  const handleSaveChanges = async () => {
    if (!channelName || !channelDescription) {
      toast({ variant: 'destructive', title: 'Please fill out all fields.' });
      return;
    }

    if (editingChannel) {
      // Update existing channel
      const channelRef = doc(firestore, 'channels', editingChannel.id);
      setDocumentNonBlocking(channelRef, { name: channelName, description: channelDescription }, { merge: true });
      toast({ title: 'Channel updated!' });
    } else {
      // Create new channel
      const newChannelRef = doc(collection(firestore, 'channels'));
      setDocumentNonBlocking(newChannelRef, {
        id: newChannelRef.id,
        name: channelName,
        description: channelDescription,
        createdAt: serverTimestamp(),
      }, {});
      toast({ title: 'Channel created!' });
    }

    handleCloseDialog();
  };

  const handleDelete = (channelId: string) => {
    if (confirm('Are you sure you want to delete this channel?')) {
      const channelRef = doc(firestore, 'channels', channelId);
      deleteDocumentNonBlocking(channelRef);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Channels</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      </div>

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
                        <AvatarImage src={channel.logoUrl || `https://picsum.photos/seed/${channel.id}/40/40`} alt={channel.name} />
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
                        <DropdownMenuItem onClick={() => handleOpenDialog(channel)}>Edit</DropdownMenuItem>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChannel ? 'Edit Channel' : 'Add New Channel'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Channel Name</Label>
              <Input id="name" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={channelDescription} onChange={(e) => setChannelDescription(e.target.value)} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="logo">Channel Logo</Label>
                <Input id="logo" type="file" />
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 1MB.</p>
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
