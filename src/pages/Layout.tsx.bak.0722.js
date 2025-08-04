import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Brain, BookOpen, LogOut } from 'lucide-react';
export default function Layout() {
    const { user, loading, logout } = useAuth();
    const isSignedIn = !!user;
    const location = useLocation();
    // Debug logging
    console.log('🏗️ Layout - User:', user ? `${user.email} (${user.uid})` : 'No user');
    console.log('🏗️ Layout - Loading:', loading);
    console.log('🏗️ Layout - IsSignedIn:', isSignedIn);
    console.log('🏗️ Layout - Current Path:', location.pathname);
    const handleSignOut = async () => {
        try {
            console.log('👋 Layout - Starting sign out...');
            await logout();
            console.log('✅ Layout - Sign out successful');
        }
        catch (error) {
            console.error('❌ Layout - Sign out error:', error);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800", children: [_jsx("header", { className: "bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50", children: _jsx("div", { className: "container mx-auto px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between gap-4 flex-wrap", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-3 group", children: [_jsx(Brain, { className: "w-8 h-8 text-white group-hover:animate-bounce-gentle transition-all" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("h1", { className: "text-2xl md:text-3xl font-bold text-white leading-tight", children: "AI Quiz Generator" }), _jsx("span", { className: "text-sm text-white/80 hidden md:block", children: "Transform your documents into interactive quizzes" })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [isSignedIn && (_jsxs("nav", { className: "flex gap-2", children: [_jsx(Button, { asChild: true, variant: location.pathname === '/' ? 'default' : 'ghost', size: "sm", className: location.pathname !== '/' ? 'text-white hover:bg-white/20' : '', children: _jsxs(Link, { to: "/", children: [_jsx(Brain, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Quiz" })] }) }), _jsx(Button, { asChild: true, variant: location.pathname === '/past-quizzes' ? 'default' : 'ghost', size: "sm", className: location.pathname !== '/past-quizzes' ? 'text-white hover:bg-white/20' : '', children: _jsxs(Link, { to: "/past-quizzes", children: [_jsx(BookOpen, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "History" })] }) })] })), _jsx("div", { className: "flex items-center gap-3", children: loading ? (_jsx("div", { className: "text-white text-sm", children: "Loading..." })) : isSignedIn ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "hidden md:flex flex-col items-end", children: [_jsx("span", { className: "text-sm font-medium text-white truncate max-w-[120px]", children: user?.displayName || user?.email || 'User' }), _jsx("span", { className: "text-xs text-white/70", children: "Signed in" })] }), _jsxs("div", { className: "text-xs text-yellow-300 bg-black/20 px-2 py-1 rounded", children: ["UID: ", user?.uid?.slice(-6)] }), _jsxs(Button, { variant: "outline", size: "sm", className: "border-white/50 text-white hover:bg-white/10 hover:text-white bg-transparent", onClick: handleSignOut, children: [_jsx(LogOut, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:inline", children: "Sign Out" })] })] })) : (_jsx("div", { className: "text-white text-sm", children: "Please sign in to use the quiz generator" })) })] })] }) }) }), _jsx("main", { className: "container mx-auto px-4 py-8 flex flex-col items-center min-h-[calc(100vh-80px)]", children: _jsx(Outlet, {}) })] }));
}
