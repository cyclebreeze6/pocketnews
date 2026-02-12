
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Settings } from 'lucide-react';
import { PreferenceDialog } from './preference-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useUser, useDoc, useFirebase, useMemoFirebase } from '../firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '../lib/types';
import { usePathname } from 'next/navigation';


export function PreferenceFAB() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptText, setPromptText] = useState('Change region');
  const { user } = useUser();
  const { firestore } = useFirebase();
  const pathname = usePathname();

  const userProfileRef = useMemoFirebase(() => user && !user.isAnonymous ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    let promptInterval: NodeJS.Timeout;

    // Show the initial prompt after a delay if preferences aren't set
    const initialTimeout = setTimeout(() => {
        let prefsAreSet = false;
        if (user?.isAnonymous) {
            prefsAreSet = localStorage.getItem('preferencesSet') === 'true';
        } else if (userProfile) {
            prefsAreSet = !!userProfile.preferencesSet;
        }

        if(!prefsAreSet) {
            setPromptOpen(true);
            const autoClose = setTimeout(() => setPromptOpen(false), 10000); // show for 10s
             return () => clearTimeout(autoClose);
        }
    }, 10000); // 10 seconds after page load

    const startInterval = () => {
        promptInterval = setInterval(() => {
        setPromptText('Change region');
        setPromptOpen(true);
        const autoClose = setTimeout(() => setPromptOpen(false), 10000); // show for 10s
         return () => clearTimeout(autoClose);
        }, 10 * 60 * 1000); // 10 minutes
    };

    startInterval();

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(promptInterval);
    };
  }, [user, userProfile]);

  // Hide FAB on certain pages
  const hiddenPaths = ['/admin', '/creator', '/shorts/'];
  if (hiddenPaths.some(p => pathname.startsWith(p))) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-6 right-6 z-50">
        <Popover open={promptOpen} onOpenChange={setPromptOpen}>
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    className="rounded-full h-14 w-14 shadow-lg"
                    onClick={() => setIsDialogOpen(true)}
                    aria-label="Open preference settings"
                >
                    <Settings className="h-6 w-6" />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="left" className="mb-2 w-auto py-1 px-3">
                <p className="text-sm font-medium">{promptText}</p>
            </PopoverContent>
        </Popover>
      </div>
      <PreferenceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userId={user?.uid || null}
        userProfile={userProfile}
      />
    </>
  );
}
