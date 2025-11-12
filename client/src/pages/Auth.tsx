import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { login as doLogin, register as doRegister } from '@/lib/auth';
import nysLogo from '@assets/generated_images/NYS_Kenya_official_logo_4530e265.png';

interface AuthProps {
  onLogin?: () => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student'|'tutor'>('student');

  const submitLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    try {
      await doLogin(email, password);
      toast({ title: 'Logged in', description: 'You are now logged in.' });
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
      onLogin?.();
    } catch (err: any) {
      toast({ title: 'Registration failed', description: err?.message || 'Unable to register', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center">
            <img src={nysLogo} alt="NYS logo" className="w-16 h-16 object-contain mb-2" />
          </div>
          <CardTitle className="text-center">{isRegister ? 'Register' : 'Login'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={isRegister ? submitRegister : submitLogin} className="space-y-4">
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
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button variant="ghost" type="button" onClick={() => setIsRegister(!isRegister)}>
                {isRegister ? 'Have an account? Login' : 'Need an account? Register'}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setEmail(''); setPassword(''); setFullName(''); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
