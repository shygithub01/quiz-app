// AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, initializeUserProfile } from '@/components/ui/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isSignedIn: boolean
  signIn: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔥 AuthContext - Setting up auth listener')
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔥 AuthContext - Auth state changed:', user ? `${user.email} (${user.uid})` : 'No user')
      
      // Initialize user profile in database if user signs in
      if (user) {
        try {
          await initializeUserProfile(
            user.uid, 
            user.email || '', 
            user.displayName || 'Anonymous'
          );
        } catch (error) {
          console.error('Error initializing user profile:', error);
        }
      }
      
      setUser(user)
      setLoading(false)
    })

    return () => {
      console.log('🔥 AuthContext - Cleaning up auth listener')
      unsubscribe()
    }
  }, [])

  const signIn = async () => {
    try {
      console.log('🔥 AuthContext - Starting Google sign in...')
      setLoading(true)
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      const result = await signInWithPopup(auth, provider)
      console.log('✅ AuthContext - Sign in successful:', result.user.email)
    } catch (error: any) {
      console.error('❌ AuthContext - Sign in error:', error)
      setLoading(false)
      // Handle the error more gracefully
      if (error.code === 'auth/popup-closed-by-user') {
        return // Silent fail for user-initiated cancellation
      }
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('🔥 AuthContext - Starting sign out...')
      await firebaseSignOut(auth)
      console.log('✅ AuthContext - Sign out successful')
      window.location.href = '/'
    } catch (error) {
      console.error('❌ AuthContext - Sign out error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    isSignedIn: !!user,
    signIn,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function getUserId() {
  const context = useContext(AuthContext);
  if (!context?.user?.uid) {
    throw new Error('User not authenticated');
  }
  return context.user.uid;
}
