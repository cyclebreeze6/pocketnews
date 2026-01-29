
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tv, Video, Clapperboard, Search, RefreshCw, Archive } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from './ui/sidebar';

const navItems = [
  { href: '/creator', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/creator/videos', label: 'Videos', icon: Video },
  { href: '/creator/shorts', label: 'Shorts', icon: Clapperboard },
  { href: '/creator/channels', label: 'Channels', icon: Tv },
  { href: '/creator/curate', label: 'Curate (Search)', icon: Search },
  { href: '/creator/bulk-import', label: 'Curate (Bulk)', icon: Archive },
  { href: '/creator/shorts-bulk-import', label: 'Bulk Import (Shorts)', icon: Clapperboard },
  { href: '/creator/sync', label: 'Curate (Sync)', icon: RefreshCw },
];

const CreatorSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href) && (item.href !== '/creator' || pathname === '/creator');
            return (
              <SidebarMenuItem key={item.href}>
                 <Link href={item.href}>
                  <SidebarMenuButton isActive={isActive}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default CreatorSidebar;
