
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
import { ScrollArea, ScrollBar } from './ui/scroll-area';

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
  
  const visibleCategoriesDesktop = categories.slice(0, MAX_VISIBLE_DESKTOP);
  const hiddenCategoriesDesktop = categories.length > MAX_VISIBLE_DESKTOP ? categories.slice(MAX_VISIBLE_DESKTOP) : [];


  const CategoryLink = ({ href, children, isActive, className, onClick }: { href: string, children: React.ReactNode, isActive: boolean, className?: string, onClick?: () => void }) => (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative inline-block px-3 py-3 text-sm font-medium transition-colors hover:text-primary whitespace-nowrap',
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

  if (isMobile) {
    return (
        <nav className="border-b border-border/40">
            <div className="container h-12 px-2">
                 <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex w-max space-x-2">
                         <CategoryLink href="/" isActive={isHomeActive}>My Headlines</CategoryLink>
                        {categories.map((category) => {
                            const href = `/category/${encodeURIComponent(category.name)}`;
                            const isActive = pathname === href;
                            return (
                                <CategoryLink key={category.id} href={href} isActive={isActive}>{category.name}</CategoryLink>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" className="h-0" />
                </ScrollArea>
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
