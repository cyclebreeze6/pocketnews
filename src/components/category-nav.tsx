
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import type { Category } from '../lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '../firebase';
import { collection } from 'firebase/firestore';
import React, { useState, useEffect, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';

export function CategoryNav() {
  const pathname = usePathname();
  const { firestore } = useFirebase();

  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const calculateVisibleItems = () => {
      if (!navRef.current || !categories) return;

      const navWidth = navRef.current.offsetWidth;
      const moreButtonWidth = 80; // Estimated width for the "More" button
      let totalWidth = 0;
      let count = 0;

      for (let i = 0; i < itemRefs.current.length; i++) {
        const item = itemRefs.current[i];
        if (item) {
          totalWidth += item.offsetWidth;
          if (totalWidth < navWidth - moreButtonWidth) {
            count++;
          } else {
            break;
          }
        }
      }
      
      // If all items fit, we don't need the 'More' button
      if (totalWidth < navWidth) {
          setVisibleCount(categories.length);
      } else {
          setVisibleCount(count);
      }
    };

    // Initial calculation
    calculateVisibleItems();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(calculateVisibleItems);
    if (navRef.current) {
      resizeObserver.observe(navRef.current);
    }

    return () => {
      if (navRef.current) {
        resizeObserver.unobserve(navRef.current);
      }
    };
  }, [categories, isLoading]);


  if (isLoading || !categories) {
    return (
        <div className="border-b border-border/40">
            <div className="container h-12 px-4 sm:px-6 md:px-8" />
        </div>
    );
  }
  
  const isHomeActive = pathname === '/';
  
  const visibleCategories = visibleCount !== null ? categories.slice(0, visibleCount) : categories;
  const hiddenCategories = visibleCount !== null && visibleCount < categories.length ? categories.slice(visibleCount) : [];


  return (
    <nav className="border-b border-border/40 overflow-hidden">
      <div className="container px-4 sm:px-6 md:px-8">
        <ul ref={navRef} className="flex items-center h-12 space-x-4 sm:space-x-6">
           <li ref={el => itemRefs.current[0] = el} className="flex-shrink-0">
                <Link
                  href="/"
                  className={cn(
                    'relative inline-block px-1 py-3 text-sm font-medium transition-colors hover:text-primary',
                    isHomeActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  My Headlines
                  {isHomeActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-destructive" />
                  )}
                </Link>
              </li>
          {visibleCategories.map((category, index) => {
            const href = `/category/${encodeURIComponent(category.name)}`;
            const isActive = pathname === href;
            return (
              <li key={category.id} ref={el => itemRefs.current[index + 1] = el} className="flex-shrink-0">
                <Link
                  href={href}
                  className={cn(
                    'relative inline-block px-1 py-3 text-sm font-medium transition-colors hover:text-primary',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {category.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-destructive" />
                  )}
                </Link>
              </li>
            );
          })}
          {hiddenCategories.length > 0 && (
             <li>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
                      More
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {hiddenCategories.map(category => {
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
