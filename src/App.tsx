import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import PastQuizzes from "./pages/PastQuizzes";
import Competitions from "./pages/Competitions";
import CompetitionDetails from "./pages/CompetitionDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <div className="min-h-screen relative overflow-hidden">
          {/* Claude's Beautiful Background */}
          <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,61,255,0.1),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,61,255,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(107,38,212,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(168,85,247,0.05),transparent_50%)]" />
          </div>

          {/* Animated Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl animate-pulse-glow" />
          </div>

          {/* Main App Content */}
          <div className="relative z-10">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="past-quizzes" element={<PastQuizzes />} />
                  <Route path="competitions" element={<Competitions />} />
                  <Route path="competitions/:id" element={<CompetitionDetails />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>

          {/* Toast Notifications */}
          <Toaster />
          <Sonner />
        </div>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
