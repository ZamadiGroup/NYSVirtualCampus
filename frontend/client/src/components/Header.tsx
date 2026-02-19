import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import nysLogo from '@assets/generated_images/NYS_Kenya_official_logo_4530e265.png';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';

export default function Header() {
  const { user, isAuthenticated, logout, refresh } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 p-4 border-b-2 border-green-300 bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
      <div className="flex items-center gap-3">
        <SidebarTrigger data-testid="button-sidebar-toggle" className="text-white hover:bg-green-800" />
        <img src={nysLogo} alt="NYS Kenya" className="h-12 w-12 hidden md:block flex-shrink-0" />
        <div className="hidden md:block">
          <h2 className="font-bold text-lg text-white">NYS Virtual Campus</h2>
          <p className="text-sm text-green-100">National Youth Service Kenya</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <Card className="px-4 py-2 bg-white/10 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="text-left">
                
                <div className="text-base font-semibold text-white">{user.fullName}</div>
              </div>
              <div className="ml-2">
                <Badge variant="outline" className="text-sm px-3 py-1 border border-white bg-white/20 text-white font-bold capitalize">{user.role}</Badge>
              </div>
              <div className="ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // clear auth and navigate to full-page auth (login/register)
                    logout();
                    refresh();
                    try {
                      window.location.hash = '#auth';
                    } catch (e) {
                      // nothing else to do; full-page auth is preferred
                    }
                  }}
                  className="text-white"
                >
                  Logout
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Button variant="outline" onClick={() => { try { window.location.hash = '#auth'; } catch (e) {} }}>
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
