
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useState } from 'react';
import { useAuth, initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from '../firebase';
import { useToast } from '../hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { Eye, EyeOff } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function getFirebaseErrorMessage(error: FirebaseError): string {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/email-already-in-use':
            return 'An account with this email address already exists.';
        case 'auth/weak-password':
            return 'The password is too weak. Please use at least 6 characters.';
        case 'auth/popup-closed-by-user':
            return 'Sign in window was closed before completing.';
        default:
            return error.message || 'An unexpected error occurred. Please try again.';
    }
}

export function AuthDialog({ open, onOpenChange, onLoginSuccess }: AuthDialogProps) {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    initiateGoogleSignIn(
      auth,
      () => {
        onLoginSuccess();
        onOpenChange(false);
        toast({ title: 'Signed in with Google!' });
        setIsLoading(false);
      },
      (error) => {
        if (error.code !== 'auth/popup-closed-by-user') {
          toast({
            variant: 'destructive',
            title: 'Google Sign-In Error',
            description: getFirebaseErrorMessage(error),
          });
        }
        setIsLoading(false);
      }
    );
  };

  const handleLogin = async () => {
    setIsLoading(true);
    initiateEmailSignIn(
      auth, 
      email, 
      password,
      () => { // onSuccess
        onLoginSuccess();
        onOpenChange(false);
        toast({ title: 'Logged in successfully!' });
        setIsLoading(false);
      },
      (error) => { // onError
        toast({
            variant: 'destructive',
            title: 'Error logging in',
            description: getFirebaseErrorMessage(error),
        });
        setIsLoading(false);
      }
    );
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    initiateEmailSignUp(
      auth, 
      email, 
      password,
      name,
      () => { // onSuccess
        onLoginSuccess();
        onOpenChange(false);
        toast({ title: 'Signed up successfully!' });
        setIsLoading(false);
      },
      (error) => { // onError
        toast({
            variant: 'destructive',
            title: 'Error signing up',
            description: getFirebaseErrorMessage(error),
        });
        setIsLoading(false);
      }
    );
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <DialogHeader className="text-left mt-4">
              <DialogTitle>Welcome back</DialogTitle>
              <DialogDescription>
                Enter your credentials or sign in with Google.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 font-medium"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </Button>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-border w-full" />
                <span className="bg-background px-2 text-xs text-muted-foreground uppercase font-semibold absolute">
                  or
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handleLogin} className="w-full mt-2" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="signup">
             <DialogHeader className="text-left mt-4">
              <DialogTitle>Create an account</DialogTitle>
              <DialogDescription>
                It's free and only takes a minute.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2 font-medium"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </Button>

              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-border w-full" />
                <span className="bg-background px-2 text-xs text-muted-foreground uppercase font-semibold absolute">
                  or
                </span>
              </div>

              <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input id="email-signup" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password-signup">Password</Label>
                <div className="relative">
                  <Input 
                    id="password-signup" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handleSignUp} className="w-full mt-2" disabled={isLoading}>
                {isLoading ? 'Signing up...' : 'Sign Up'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
