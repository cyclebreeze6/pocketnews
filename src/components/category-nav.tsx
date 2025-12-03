'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export function CategoryNav() {
  const pathname = usePathname();
  const { firestore } = useFirebase();

  const categoriesQuery = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

  if (isLoading || !categories) {
    return (
        <div className="border-b border-border/40">
            <div className="container h-12 px-4 sm:px-6 md:px-8" />
        </div>
    );
  }

  return (
    <nav className="border-b border-border/40 overflow-x-auto">
      <div className="container px-4 sm:px-6 md:px-8">
        <ul className="flex items-center h-12 space-x-4 sm:space-x-6">
          {categories.map((category) => {
            const href = `/category/${encodeURIComponent(category.name)}`;
            const isActive = pathname === href;
            return (
              <li key={category.id} className="flex-shrink-0">
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
        </ul>
      </div>
    </nav>
  );
}
