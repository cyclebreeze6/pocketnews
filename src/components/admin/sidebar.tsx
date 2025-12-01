'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv2, BarChart2, Video, Clapperboard, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const navItems = [
  { href: '/admin/dashboard', icon: BarChart2, label: 'Dashboard' },
  { href: '/admin/videos', icon: Video, label: 'Videos' },
  { href: '/admin/channels', icon: Clapperboard, label: 'Channels' },
  { href: '/admin/users', icon: Users, label: 'Users' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold font-headline">
          <Tv2 className="h-6 w-6 text-primary" />
          <span>Pocketnews TV</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              pathname === item.href && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t border-sidebar-border">
         <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
            </Link>
         </Button>
      </div>
    </aside>
  );
}
