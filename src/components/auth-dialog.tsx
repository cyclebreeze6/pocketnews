
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
import { useAuth, initiateEmailSignIn, initiateEmailSignUp } from '../firebase';
import { useToast } from '../hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import { Eye, EyeOff } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
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
        default:
            return 'An unexpected error occurred. Please try again.';
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
                Enter your credentials to access your account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
