import { jsx as _jsx } from "react/jsx-runtime";
// AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/components/ui/firebase';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        console.log('🔥 AuthContext - Setting up auth listener');
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('🔥 AuthContext - Auth state changed:', user ? `${user.email} (${user.uid})` : 'No user');
            setUser(user);
            setLoading(false);
        });
        return () => {
            console.log('🔥 AuthContext - Cleaning up auth listener');
            unsubscribe();
        };
    }, []);
    const signIn = async () => {
        try {
            console.log('🔥 AuthContext - Starting Google sign in...');
            setLoading(true);
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            const result = await signInWithPopup(auth, provider);
            console.log('✅ AuthContext - Sign in successful:', result.user.email);
        }
        catch (error) {
            console.error('❌ AuthContext - Sign in error:', error);
            setLoading(false);
            // Handle the error more gracefully
            if (error.code === 'auth/popup-closed-by-user') {
                return; // Silent fail for user-initiated cancellation
            }
            throw error;
        }
    };
    const logout = async () => {
        try {
            console.log('🔥 AuthContext - Starting sign out...');
            await firebaseSignOut(auth);
            console.log('✅ AuthContext - Sign out successful');
            window.location.href = '/';
        }
        catch (error) {
            console.error('❌ AuthContext - Sign out error:', error);
            throw error;
        }
    };
    const value = {
        user,
        loading,
        isSignedIn: !!user,
        signIn,
        logout
    };
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export function getUserId() {
    const context = useContext(AuthContext);
    if (!context?.user?.uid) {
        throw new Error('User not authenticated');
    }
    return context.user.uid;
}
