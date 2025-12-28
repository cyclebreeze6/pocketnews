
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tv, Video, Clapperboard, Search, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

const CreatorSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/creator', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/creator/videos', label: 'Videos', icon: Video },
    { href: '/creator/channels', label: 'Channels', icon: Tv },
    { href: '/creator/curate', label: 'Curate (Search)', icon: Search },
    { href: '/creator/sync', label: 'Curate (Sync)', icon: RefreshCw },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card/50 p-4">
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              (pathname.startsWith(item.href) && (item.href !== '/creator' || pathname === '/creator')) && 'bg-primary/10 text-primary'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default CreatorSidebar;
