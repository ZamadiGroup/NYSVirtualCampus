import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { login as doLogin, register as doRegister } from "@/lib/auth";
import { LogIn, UserPlus } from 'lucide-react';

interface LoginDialogProps {
  onLogin?: () => void;
  // Controlled open state (optional)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // default view when opened: 'login' or 'register'
  defaultView?: 'login' | 'register';
}

export function LoginDialog({ onLogin }: LoginDialogProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  // Support controlled open via props
  const controlled = typeof (arguments[0] as any)?.open !== 'undefined';
  // We'll read props via arguments to avoid changing signature below
  // but we'll extract them properly
  // (TypeScript-friendly alternative: use rest props, but keep simple)
  // NOTE: we'll read from props provided in function args below via default parameters
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student'|'tutor'>('student');

  // Extract optional props from the arguments (workaround for TS inference in this edit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: any = (arguments[0] as any) || {};
  const openProp: boolean | undefined = props.open;
  const onOpenChangeProp: ((open: boolean) => void) | undefined = props.onOpenChange;
  const defaultViewProp: 'login' | 'register' | undefined = props.defaultView;

  const isOpen = typeof openProp !== 'undefined' ? openProp : isOpenInternal;
  const setIsOpen = (v: boolean) => {
    if (typeof onOpenChangeProp === 'function') onOpenChangeProp(v);
    else setIsOpenInternal(v);
  };

  // synchronize default view when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setIsRegister(defaultViewProp === 'register');
    }
  }, [isOpen, defaultViewProp]);

  const submitLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      await doLogin(email, password);
      toast({ title: 'Logged in', description: 'You are now logged in.' });
      setIsOpen(false);
      onLogin?.();
    } catch (err: any) {
      toast({ title: 'Login failed', description: err?.message || 'Unable to login', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      await doRegister(fullName, email, password, role);
      toast({ title: 'Registered', description: 'Account created and logged in.' });
      setIsOpen(false);
      onLogin?.();
    } catch (err: any) {
      toast({ title: 'Registration failed', description: err?.message || 'Unable to register', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isRegister ? 'Register' : 'Login'}</DialogTitle>
          <DialogDescription>
            {isRegister ? 'Create a new account to access the platform.' : 'Sign in with your email and password.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={isRegister ? submitRegister : submitLogin} className="space-y-3">
          {isRegister && (
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}

          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {isRegister && (
            <div className="space-y-1">
              <Label>Role</Label>
              <div className="flex gap-2">
                <Button variant={role === 'student' ? 'default' : 'outline'} size="sm" onClick={() => setRole('student')}>Student</Button>
                <Button variant={role === 'tutor' ? 'default' : 'outline'} size="sm" onClick={() => setRole('tutor')}>Tutor</Button>
                {/* Admin creation is restricted to admins via server-side /users endpoint */}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button variant="ghost" type="button" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Have an account? Login' : 'Need an account? Register'}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default LoginDialog;
