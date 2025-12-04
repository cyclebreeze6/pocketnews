'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Video, Users, Tv, Settings, FolderKanban, Download } from 'lucide-react';
import { cn } from '../lib/utils';

const AdminSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/videos', label: 'Videos', icon: Video },
    { href: '/admin/channels', label: 'Channels', icon: Tv },
    { href: '/admin/categories', label: 'Categories', icon: FolderKanban },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/import', label: 'Import Videos', icon: Download },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
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
              (pathname === item.href || (item.href === '/admin/videos' && pathname.startsWith('/admin/videos/')) || (item.href === '/admin/import' && pathname.startsWith('/admin/import'))) && 'bg-primary/10 text-primary'
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

export default AdminSidebar;
