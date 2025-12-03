'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import type { Category } from '@/lib/types';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCategoriesPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleOpenDialog = (category: Category | null = null) => {
    setEditingCategory(category);
    setCategoryName(category ? category.name : '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleSaveChanges = async () => {
    if (!categoryName) {
      toast({ variant: 'destructive', title: 'Please enter a category name.' });
      return;
    }

    if (editingCategory) {
      // Update existing category
      const categoryRef = doc(firestore, 'categories', editingCategory.id);
      setDocumentNonBlocking(categoryRef, { name: categoryName }, { merge: true });
      toast({ title: 'Category updated!' });
    } else {
      // Create new category
      const newCategoryRef = doc(collection(firestore, 'categories'));
      setDocumentNonBlocking(newCategoryRef, {
        id: newCategoryRef.id,
        name: categoryName,
        createdAt: serverTimestamp(),
      }, {});
      toast({ title: 'Category created!' });
    }

    handleCloseDialog();
  };

  const handleDelete = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const categoryRef = doc(firestore, 'categories', categoryId);
      deleteDocumentNonBlocking(categoryRef);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Manage Categories</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(category)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(category.id)} className="text-destructive">
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
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name</Label>
              <Input id="name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
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

    