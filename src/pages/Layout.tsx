import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Brain, BookOpen, LogOut, User, Sparkles, Trophy, Settings, Zap, Menu, X, Home, ChevronDown, Users, Activity, Plus } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { isAdmin } from '@/components/ui/firebase'

export default function Layout() {
  const { user, loading, logout, signIn } = useAuth()
  const isSignedIn = !!user
  const location = useLocation()
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const adminDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      if (user?.uid) {
        const adminStatus = await isAdmin(user.uid);
        setUserIsAdmin(adminStatus);
      } else {
        setUserIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);

  // Close drawer + admin dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAdminDropdownOpen(false);
  }, [location.pathname]);

  // Close admin dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target as Node)) {
        setAdminDropdownOpen(false);
      }
    };
    if (adminDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [adminDropdownOpen]);

  // Close drawer on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('❌ Layout - Sign out error:', error)
    }
  }

  const navLinks = [
    { to: '/', label: 'Quiz', icon: Brain },
    { to: '/past-quizzes', label: 'History', icon: BookOpen },
    { to: '/pricing', label: 'Pricing', icon: Sparkles },
    { to: '/live-modes', label: 'Live Modes', icon: Zap },
    ...(userIsAdmin ? [
      { to: '/competitions', label: 'Competitions', icon: Trophy },
    ] : []),
  ];

  const adminSubLinks = [
    { to: '/admin/create-competition', label: 'Create New Competition', icon: Plus },
    { to: '/admin/quiz-templates/list', label: 'Quiz Templates', icon: Brain },
    { to: '/admin/practice/manage', label: 'Manage Practice Mode', icon: Activity },
    { to: '/admin/live-event-host', label: 'Manage Live Mode', icon: Zap },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/competition-settings', label: 'Settings', icon: Settings },
  ];

  // Bottom tab bar items (always-visible 4 tabs for mobile)
  const bottomTabs = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/past-quizzes', label: 'History', icon: BookOpen },
    { to: '/live-modes', label: 'Live', icon: Zap },
    { to: '/pricing', label: 'Pricing', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/10 shadow-glass-lg">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:bg-white/30 transition-all duration-300" />
                <Brain className="w-8 h-8 md:w-10 md:h-10 text-white relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-purple-300 absolute -top-1 -right-1 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-white leading-tight group-hover:text-purple-100 transition-colors duration-300">
                  AI Quiz Generator
                </h1>
                <span className="text-xs text-white/70 hidden md:block group-hover:text-white/90 transition-colors duration-300">
                  Transform your documents into interactive quizzes
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {/* Desktop Nav */}
              {isSignedIn && (
                <nav className="hidden md:flex gap-2 p-1 bg-white/5 rounded-full backdrop-blur-sm">
                  {navLinks.map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to}>
                      <Button
                        variant={location.pathname === to ? 'default' : 'ghost'}
                        size="sm"
                        className={`relative group transition-all duration-300 rounded-full ${
                          location.pathname === to
                            ? 'bg-white text-purple-600 shadow-glow hover:shadow-glow-lg'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="hidden lg:inline font-medium ml-2">{label}</span>
                      </Button>
                    </Link>
                  ))}
                  {/* Admin Dropdown */}
                  {userIsAdmin && (
                    <div className="relative" ref={adminDropdownRef}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAdminDropdownOpen(v => !v)}
                        className={`relative group transition-all duration-300 rounded-full ${
                          adminDropdownOpen
                            ? 'bg-white text-purple-600 shadow-glow'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Settings className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="hidden lg:inline font-medium ml-2">Admin</span>
                        <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-200 ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                      </Button>
                      {adminDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl shadow-xl overflow-hidden z-50"
                          style={{ background: 'linear-gradient(135deg, #4c1d95, #3730a3)', border: '1px solid rgba(255,255,255,0.15)' }}>
                          {adminSubLinks.map(({ to, label, icon: Icon }) => (
                            <Link key={to} to={to} onClick={() => setAdminDropdownOpen(false)}>
                              <div className={`flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${
                                location.pathname === to ? 'bg-white/15 text-white font-semibold' : 'text-white/80'
                              }`}>
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{label}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </nav>
              )}

              {/* Desktop User Section */}
              <div className="hidden md:flex items-center gap-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                ) : isSignedIn ? (
                  <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-3 glass-subtle rounded-full px-4 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-glow">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white truncate max-w-[120px]">
                          {user?.displayName || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="text-xs text-white/70">Online</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:text-purple-600 bg-white/5 hover:bg-white backdrop-blur-sm transition-all duration-300 rounded-full group hover:shadow-glow hover:scale-105 active:scale-95"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                      <span className="hidden sm:inline ml-2 font-medium">Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={signIn}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-glow hover:shadow-glow-lg transition-all duration-300 rounded-full px-6 py-3 text-sm font-medium group"
                  >
                    <Sparkles className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Sign In with Google
                  </Button>
                )}
              </div>

              {/* Mobile: Sign in or Hamburger */}
              <div className="flex md:hidden items-center gap-2">
                {!loading && !isSignedIn && (
                  <Button
                    onClick={signIn}
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full text-xs px-3 py-2"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Sign In
                  </Button>
                )}
                {isSignedIn && (
                  <button
                    onClick={() => setMobileMenuOpen((v) => !v)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
                    aria-label="Toggle menu"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subtle animated border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" aria-hidden="true" />
      )}

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-72 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #3730a3 100%)' }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[150px]">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-white/60">{userIsAdmin ? 'Admin' : 'Student'}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="px-4 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                location.pathname === to
                  ? 'bg-white text-purple-700 font-semibold shadow-md'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-base">{label}</span>
            </Link>
          ))}
          {/* Admin sub-links in drawer */}
          {userIsAdmin && (
            <>
              <div className="px-4 pt-3 pb-1">
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">Admin</p>
              </div>
              {adminSubLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    location.pathname === to
                      ? 'bg-white text-purple-700 font-semibold shadow-md'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base">{label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Drawer Footer - Sign Out */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-6 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content — extra bottom padding on mobile for bottom tab bar */}
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col items-center min-h-[calc(100dvh-64px)] relative pb-24 md:pb-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl animate-float" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-400/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="w-full animate-fade-in-up relative z-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar — hidden on full-screen quiz/event pages */}
      {!location.pathname.startsWith('/practice/quiz/') &&
       !location.pathname.includes('/participate/') &&
       !location.pathname.includes('/projector') && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 safe-area-bottom"
          style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #3730a3 100%)' }}
        >
          <div className="flex items-center justify-around px-2 py-2 pb-safe">
            {bottomTabs.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[60px] transition-all duration-200 ${
                    isActive ? 'bg-white/15' : 'opacity-70'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/70'}`} />
                  <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                    {label}
                  </span>
                  {isActive && (
                    <span className="absolute top-0 w-8 h-0.5 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Footer Glow */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none" />

      {/* Legal Footer */}
      <footer className="hidden md:block bg-gradient-to-t from-purple-900/20 to-transparent border-t border-white/10 mt-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
              <h3 className="text-white font-bold mb-3">Quizist.AI</h3>
              <p className="text-white/70 text-sm">
                AI-powered quiz generation and merit-based scholarship competitions for students.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="text-white/70 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/scholarship-rules" className="text-white/70 hover:text-white transition-colors">Scholarship Rules</Link></li>
                <li><Link to="/ai-disclaimer" className="text-white/70 hover:text-white transition-colors">AI Disclaimer</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="text-white/70 hover:text-white transition-colors">Contact Us</Link></li>
                <li><a href="mailto:support@quizist.ai" className="text-white/70 hover:text-white transition-colors">support@quizist.ai</a></li>
                <li><a href="mailto:privacy@quizist.ai" className="text-white/70 hover:text-white transition-colors">privacy@quizist.ai</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-sm text-white/60">
            <p>© {new Date().getFullYear()} Quizist.AI. All rights reserved.</p>
            <p className="mt-2">Scholarships are free and merit-based. Paid features do not affect competition results.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
