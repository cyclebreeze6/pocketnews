
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import type { Category } from '../lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '../firebase';
import { collection } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { ChevronDown, Menu } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

export function CategoryNav() {
  const pathname = usePathname();
  const { firestore } = useFirebase();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

  if (isLoading || !categories) {
    return (
        <div className="border-b border-border/40">
            <div className="container h-12 px-4 sm:px-6 md:px-8" />
        </div>
    );
  }

  const isHomeActive = pathname === '/';
  
  const MAX_VISIBLE_DESKTOP = 6;
  const MAX_VISIBLE_MOBILE = 4;
  
  const visibleCategoriesDesktop = categories.slice(0, MAX_VISIBLE_DESKTOP);
  const hiddenCategoriesDesktop = categories.length > MAX_VISIBLE_DESKTOP ? categories.slice(MAX_VISIBLE_DESKTOP) : [];

  const visibleCategoriesMobile = categories.slice(0, MAX_VISIBLE_MOBILE);
  const hiddenCategoriesMobile = categories.length > MAX_VISIBLE_MOBILE ? categories.slice(MAX_VISIBLE_MOBILE) : [];

  const CategoryLink = ({ href, children, isActive, className, onClick }: { href: string, children: React.ReactNode, isActive: boolean, className?: string, onClick?: () => void }) => (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative inline-block px-2 py-3 text-sm font-medium transition-colors hover:text-primary whitespace-nowrap',
        isActive ? 'text-primary' : 'text-muted-foreground',
        className,
      )}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
      )}
    </Link>
  );

  const MobileSheet = () => (
     <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary px-2">
            More
            <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px]">
        <SheetHeader>
          <SheetTitle>All Categories</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2 mt-4">
             {hiddenCategoriesMobile.map((category) => {
                const href = `/category/${encodeURIComponent(category.name)}`;
                return (
                    <Link
                        key={category.id}
                        href={href}
                        onClick={() => setIsSheetOpen(false)}
                        className={cn(
                            'p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-primary', 
                            pathname === href && 'bg-accent text-primary'
                        )}
                    >
                        {category.name}
                    </Link>
                );
            })}
        </div>
      </SheetContent>
    </Sheet>
  );


  if (isMobile) {
    return (
        <nav className="border-b border-border/40 overflow-hidden">
            <div className="container flex items-center justify-between h-12 px-2">
                <div className="flex items-center">
                    <CategoryLink href="/" isActive={isHomeActive} className="text-xs px-1.5">My Headlines</CategoryLink>
                    {visibleCategoriesMobile.map((category) => {
                        const href = `/category/${encodeURIComponent(category.name)}`;
                        const isActive = pathname === href;
                        return (
                            <CategoryLink key={category.id} href={href} isActive={isActive} className="text-xs px-1.5">{category.name}</CategoryLink>
                        );
                    })}
                </div>
                 {hiddenCategoriesMobile.length > 0 && <MobileSheet />}
            </div>
        </nav>
    )
  }

  return (
    <nav className="border-b border-border/40 overflow-hidden">
      <div className="container px-4 sm:px-6 md:px-8">
        <ul className="flex items-center justify-center h-12 space-x-4 sm:space-x-6">
            <li>
                <CategoryLink href="/" isActive={isHomeActive}>My Headlines</CategoryLink>
            </li>
          {visibleCategoriesDesktop.map((category) => {
            const href = `/category/${encodeURIComponent(category.name)}`;
            const isActive = pathname === href;
            return (
              <li key={category.id}>
                <CategoryLink href={href} isActive={isActive}>{category.name}</CategoryLink>
              </li>
            );
          })}
          {hiddenCategoriesDesktop.length > 0 && (
             <li>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
                      More
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {hiddenCategoriesDesktop.map(category => {
                         const href = `/category/${encodeURIComponent(category.name)}`;
                         const isActive = pathname === href;
                        return (
                            <DropdownMenuItem key={category.id} asChild>
                                <Link href={href} className={cn(isActive && 'text-primary')}>
                                    {category.name}
                                </Link>
                            </DropdownMenuItem>
                        )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
