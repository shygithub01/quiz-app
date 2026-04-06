import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import QuizGenerator from "./pages/QuizGenerator";
import PastQuizzes from "./pages/PastQuizzes";
import Competitions from "./pages/Competitions";
import CompetitionDetails from "./pages/CompetitionDetails";
import CompetitionLeaderboard from "./pages/CompetitionLeaderboard";
import CompetitionQuiz from "./pages/CompetitionQuiz";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminUserDetails from "./pages/AdminUserDetails";
import AdminCompetitionParticipants from "./pages/AdminCompetitionParticipants";
import AdminEditCompetition from "./pages/AdminEditCompetition";
import AdminQuizTemplates from "./pages/AdminQuizTemplates";
import AdminCompetitionSettings from "./pages/AdminCompetitionSettings";
import AdminDebugCompetition from "./pages/AdminDebugCompetition";
import AdminRestore from "./pages/AdminRestore";
import AdminCreateCompetition from "./pages/AdminCreateCompetition";
import LiveEventHost from "./pages/LiveEventHost";
import Schools from "./pages/Schools";
import ScholarshipHome from "./pages/ScholarshipHome";
import ScholarshipRegister from "./pages/ScholarshipRegister";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ScholarshipRules from "./pages/ScholarshipRules";
import AIDisclaimer from "./pages/AIDisclaimer";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import SubscriptionManagement from "./pages/SubscriptionManagement";
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
                  <Route path="quiz-generator" element={<QuizGenerator />} />
                  <Route path="past-quizzes" element={<PastQuizzes />} />
                  <Route path="competitions" element={<Competitions />} />
                  <Route path="competitions/:id" element={<CompetitionDetails />} />
                  <Route path="competitions/:id/leaderboard" element={<CompetitionLeaderboard />} />
                  <Route path="competitions/:id/quiz" element={<CompetitionQuiz />} />
                  {/* Redirect old admin/competitions to settings */}
                  <Route path="admin/competitions" element={<Navigate to="/admin/competition-settings" replace />} />
                  <Route path="admin/competitions/:id/participants" element={<AdminCompetitionParticipants />} />
                  <Route path="admin/competitions/:id/edit" element={<AdminEditCompetition />} />
                  <Route path="admin/users" element={<AdminUserManagement />} />
                  <Route path="admin/users/:userId" element={<AdminUserDetails />} />
                  <Route path="admin/quiz-templates" element={<AdminQuizTemplates />} />
                  <Route path="admin/competition-settings" element={<AdminCompetitionSettings />} />
                  <Route path="admin/debug-competition" element={<AdminDebugCompetition />} />
                  <Route path="admin/restore" element={<AdminRestore />} />
                  <Route path="admin/create-competition" element={<AdminCreateCompetition />} />
                  <Route path="admin/live-event/create" element={<LiveEventHost />} />
                  {/* Live Event Routes - Placeholders for now */}
                  <Route path="live-event/projector/:eventId" element={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-2xl">Projector View - Coming in Phase 3</div>} />
                  <Route path="live-event/join" element={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 text-2xl">Join Event - Coming in Phase 4</div>} />
                  <Route path="live-event/participate/:eventId/:sessionId" element={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 text-2xl">Participant View - Coming in Phase 4</div>} />
                  <Route path="live-event/results/:eventId" element={<div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 text-2xl">Results View - Coming in Phase 6</div>} />
                  <Route path="schools" element={<Schools />} />
                  <Route path="scholarship" element={<ScholarshipHome />} />
                  <Route path="scholarship/register" element={<ScholarshipRegister />} />
                  {/* Legal Pages */}
                  <Route path="terms" element={<Terms />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="scholarship-rules" element={<ScholarshipRules />} />
                  <Route path="ai-disclaimer" element={<AIDisclaimer />} />
                  <Route path="contact" element={<Contact />} />
                  {/* Subscription Pages */}
                  <Route path="pricing" element={<Pricing />} />
                  <Route path="account/subscription" element={<SubscriptionManagement />} />
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
