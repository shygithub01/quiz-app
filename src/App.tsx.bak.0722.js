import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext"; // ADDED: Import AuthProvider
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import PastQuizzes from "./pages/PastQuizzes";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
const App = () => (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(TooltipProvider, { children: _jsxs(AuthProvider, { children: [" ", _jsxs(BrowserRouter, { children: [" ", _jsx(Toaster, {}), _jsx(Sonner, {}), _jsxs(Routes, { children: [_jsxs(Route, { path: "/", element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(Home, {}) }), _jsx(Route, { path: "past-quizzes", element: _jsx(PastQuizzes, {}) })] }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) })] })] })] }) }) }));
export default App;
