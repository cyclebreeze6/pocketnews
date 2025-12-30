
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

export default function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/shorts', label: 'Shorts', icon: Clapperboard },
    ];
    
    // Don't show mobile nav on shorts player page
    if (pathname.startsWith('/shorts/')) {
        return null;
    }

    return (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50">
            <nav className="h-full">
                <ul className="h-full flex justify-around items-center">
                    {navItems.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.label} className="h-full">
                                <Link href={item.href} className={cn(
                                    "flex flex-col items-center justify-center h-full w-20 text-muted-foreground transition-colors",
                                    isActive && "text-primary"
                                )}>
                                    <item.icon className="h-6 w-6 mb-1" />
                                    <span className="text-xs">{item.label}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </div>
    );
}
