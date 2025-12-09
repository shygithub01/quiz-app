import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Brain, BookOpen, LogOut, User, Sparkles, Trophy, Shield, Users, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { isAdmin } from '@/components/ui/firebase'

export default function Layout() {
  const { user, loading, logout, signIn } = useAuth() // Added signIn assuming it exists in AuthContext
  const isSignedIn = !!user
  const location = useLocation()
  const [userIsAdmin, setUserIsAdmin] = useState(false)

  // Check if user is admin
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

  // Debug logging
  console.log('🏗️ Layout - User:', user ? `${user.email} (${user.uid})` : 'No user')
  console.log('🏗️ Layout - Loading:', loading)
  console.log('🏗️ Layout - IsSignedIn:', isSignedIn)
  console.log('🏗️ Layout - IsAdmin:', userIsAdmin)
  console.log('🏗️ Layout - Current Path:', location.pathname)

  const handleSignOut = async () => {
    try {
      console.log('👋 Layout - Starting sign out...')
      await logout()
      console.log('✅ Layout - Sign out successful')
    } catch (error) {
      console.error('❌ Layout - Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Enhanced Header */}
      <header className="glass-strong sticky top-0 z-50 border-b border-white/10 shadow-glass-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Enhanced Logo and Title */}
            <Link to="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:bg-white/30 transition-all duration-300" />
                <Brain className="w-10 h-10 text-white relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <Sparkles className="w-4 h-4 text-purple-300 absolute -top-1 -right-1 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-purple-100 transition-colors duration-300">
                  AI Quiz Generator
                </h1>
                <span className="text-sm text-white/70 hidden md:block group-hover:text-white/90 transition-colors duration-300">
                  Transform your documents into interactive quizzes
                </span>
              </div>
            </Link>

            {/* Enhanced Navigation and User Section */}
            <div className="flex items-center gap-6">
              {/* Enhanced Navigation Links - FIXED */}
              {isSignedIn && (
                <nav className="flex gap-2 p-1 bg-white/5 rounded-full backdrop-blur-sm">
                  <Link to="/">
                    <Button
                      variant={location.pathname === '/' ? 'default' : 'ghost'}
                      size="sm"
                      className={`
                        relative group transition-all duration-300 rounded-full
                        ${location.pathname === '/' 
                          ? 'bg-white text-purple-600 shadow-glow hover:shadow-glow-lg' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <Brain className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="hidden sm:inline font-medium ml-2">Quiz</span>
                    </Button>
                  </Link>
                  
                  <Link to="/past-quizzes">
                    <Button
                      variant={location.pathname === '/past-quizzes' ? 'default' : 'ghost'}
                      size="sm"
                      className={`
                        relative group transition-all duration-300 rounded-full
                        ${location.pathname === '/past-quizzes' 
                          ? 'bg-white text-purple-600 shadow-glow hover:shadow-glow-lg' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="hidden sm:inline font-medium ml-2">History</span>
                    </Button>
                  </Link>
                  
                  <Link to="/competitions">
                    <Button
                      variant={location.pathname === '/competitions' ? 'default' : 'ghost'}
                      size="sm"
                      className={`
                        relative group transition-all duration-300 rounded-full
                        ${location.pathname === '/competitions' 
                          ? 'bg-white text-purple-600 shadow-glow hover:shadow-glow-lg' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <Trophy className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="hidden sm:inline font-medium ml-2">Competitions</span>
                    </Button>
                  </Link>
                  
                  {/* Admin Navigation - Only visible to admins */}
                  {userIsAdmin && (
                    <>
                      <Link to="/admin/create-competition">
                        <Button
                          variant={location.pathname === '/admin/create-competition' ? 'default' : 'ghost'}
                          size="sm"
                          className={`
                            relative group transition-all duration-300 rounded-full
                            ${location.pathname === '/admin/create-competition'
                              ? 'bg-white text-purple-600 shadow-glow hover:shadow-glow-lg' 
                              : 'text-white/80 hover:text-white hover:bg-white/10'
                            }
                          `}
                          title="Admin: Generate Questions & Create Competition"
                        >
                          <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          <span className="hidden sm:inline font-medium ml-2">New Competition</span>
                        </Button>
                      </Link>
                      
                      <Link to="/admin/competitions">
                        <Button
                          variant={location.pathname.startsWith('/admin/competitions') ? 'default' : 'ghost'}
                          size="sm"
                          className={`
                            relative group transition-all duration-300 rounded-full
                            ${location.pathname.startsWith('/admin/competitions')
                              ? 'bg-white text-purple-600 shadow-glow hover:shadow-glow-lg' 
                              : 'text-white/80 hover:text-white hover:bg-white/10'
                            }
                          `}
                          title="Admin: Create Competitions"
                        >
                          <Shield className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          <span className="hidden sm:inline font-medium ml-2">Admin</span>
                        </Button>
                      </Link>
                      
                      <Link to="/admin/competition-settings">
                        <Button
                          variant={location.pathname === '/admin/competition-settings' ? 'default' : 'ghost'}
                          size="sm"
                          className={`
                            relative group transition-all duration-300 rounded-full
                            ${location.pathname === '/admin/competition-settings'
                              ? 'bg-white text-purple-600 shadow-glow hover:shadow-glow-lg' 
                              : 'text-white/80 hover:text-white hover:bg-white/10'
                            }
                          `}
                          title="Admin: Competition Settings"
                        >
                          <Settings className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          <span className="hidden sm:inline font-medium ml-2">Settings</span>
                        </Button>
                      </Link>
                      
                      <Link to="/admin/users">
                        <Button
                          variant={location.pathname === '/admin/users' ? 'default' : 'ghost'}
                          size="sm"
                          className={`
                            relative group transition-all duration-300 rounded-full
                            ${location.pathname === '/admin/users'
                              ? 'bg-white text-purple-600 shadow-glow hover:shadow-glow-lg' 
                              : 'text-white/80 hover:text-white hover:bg-white/10'
                            }
                          `}
                          title="Super Admin: Manage Users"
                        >
                          <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          <span className="hidden sm:inline font-medium ml-2">Users</span>
                        </Button>
                      </Link>
                    </>
                  )}
                </nav>
              )}

              {/* Enhanced User Section */}
              <div className="flex items-center gap-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-white/80">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="text-sm ml-2">Loading...</span>
                  </div>
                ) : isSignedIn ? (
                  <div className="flex items-center gap-4">
                    {/* Enhanced User Info */}
                    <div className="hidden md:flex items-center gap-3 glass-subtle rounded-full px-4 py-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-glow">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white truncate max-w-[120px]">
                          {user?.displayName || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="text-xs text-white/70">
                          Online
                        </span>
                      </div>
                    </div>
                    
                    {/* Enhanced Sign Out Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="
                        border-white/30 text-white hover:text-purple-600 bg-white/5 hover:bg-white 
                        backdrop-blur-sm transition-all duration-300 rounded-full group
                        hover:shadow-glow hover:scale-105 active:scale-95
                      "
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                      <span className="hidden sm:inline ml-2 font-medium">Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={signIn} // Calls signIn from AuthContext (add your sign-in logic if needed)
                    className="
                      bg-gradient-to-r from-purple-500 to-indigo-600 text-white 
                      hover:from-purple-600 hover:to-indigo-700
                      shadow-glow hover:shadow-glow-lg transition-all duration-300 rounded-full
                      px-6 py-3 text-sm font-medium group
                    "
                  >
                    <Sparkles className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    Sign In with Google
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subtle animated border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </header>

      {/* Enhanced Main Content */}
      <main className="container mx-auto px-6 py-12 flex flex-col items-center min-h-[calc(100vh-100px)] relative">
        {/* Animated Background Elements for Content Area */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl animate-float" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-400/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content with animation */}
        <div className="w-full animate-fade-in-up relative z-10">
          <Outlet />
        </div>
      </main>

      {/* Footer Glow Effect */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none" />

      {/* Added Simple Footer for Completeness */}
      <footer className="bg-gradient-to-t from-purple-900/10 to-transparent border-t border-white/10 p-4 text-center text-sm text-white/70 mt-auto">
        © {new Date().getFullYear()} AI Quiz Generator. All rights reserved.
      </footer>
    </div>
  )
}
