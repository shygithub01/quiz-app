import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getQuizHistory, deleteQuizFromHistory } from '@/components/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Trash2, Play, FileText, Target, Eye } from 'lucide-react'; // Added Eye icon
import { useNavigate } from 'react-router-dom';
const formatQuizTitle = (quiz) => {
    if (quiz.type === 'topic') {
        return `${quiz.title} (${quiz.settings?.difficulty || 'medium'}, ${quiz.settings?.numQuestions || quiz.questionCount}Q)`;
    }
    return quiz.title || 'Untitled Quiz';
};
export default function PastQuizzes() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [pastQuizzes, setPastQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadQuizzes = async () => {
            if (!user?.uid) {
                setLoading(false);
                return;
            }
            try {
                console.log('🔄 Loading quiz attempts for user:', user.uid);
                const attempts = await getQuizHistory(user.uid);
                const quizzes = attempts.map(attempt => ({
                    id: attempt.id,
                    title: attempt.title,
                    type: attempt.type,
                    score: attempt.score || 0, // Ensure score defaults to 0 if undefined
                    questionCount: attempt.questionCount,
                    createdAt: attempt.startedAt,
                    completedAt: attempt.completedAt,
                    settings: attempt.settings
                }));
                setPastQuizzes(quizzes);
                console.log('📊 Loaded quiz attempts:', quizzes.length);
            }
            catch (error) {
                console.error('Failed to load quiz attempts:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadQuizzes();
    }, [user?.uid]);
    const handleRetake = (quizId) => {
        navigate(`/?retake=${quizId}`);
    };
    // Added handleViewResults function
    const handleViewResults = (attemptId) => {
        navigate(`/?results=${attemptId}`);
    };
    const handleDelete = async (attemptId) => {
        if (!user?.uid)
            return;
        try {
            await deleteQuizFromHistory(attemptId, user.uid);
            setPastQuizzes(prev => prev.filter(q => q.id !== attemptId));
            console.log('🗑️ Quiz attempt deleted:', attemptId);
        }
        catch (error) {
            console.error('Error deleting quiz attempt:', error);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h1", { className: "text-3xl font-bold text-indigo-600 flex items-center gap-2", children: [_jsx(Clock, { className: "h-8 w-8" }), "Past Quizzes"] }), _jsx(Button, { onClick: () => navigate('/'), variant: "outline", className: "flex items-center gap-2", children: "Back to Home" })] }), _jsxs(Card, { className: "shadow-xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Your Quiz History" }) }), _jsx(CardContent, { children: loading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) })) : pastQuizzes.length === 0 ? (_jsx("p", { className: "text-center text-gray-500 py-8", children: "No past quizzes yet. Go back to home and generate some!" })) : (_jsx("div", { className: "space-y-4", children: pastQuizzes.map((quiz) => (_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `p-2 rounded-lg ${quiz.type === 'document' ? 'bg-blue-100' : 'bg-green-100'}`, children: quiz.type === 'document' ? (_jsx(FileText, { className: "h-5 w-5 text-blue-600" })) : (_jsx(Target, { className: "h-5 w-5 text-green-600" })) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: formatQuizTitle(quiz) }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Created: ", new Date(quiz.createdAt).toLocaleDateString(), quiz.completedAt ?
                                                                    ` • Completed: ${new Date(quiz.completedAt).toLocaleDateString()}` :
                                                                    ' • Not completed'] }), quiz.score !== undefined && quiz.completedAt && (_jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Score: ", quiz.score, "/", quiz.questionCount, "(", Math.round((quiz.score / quiz.questionCount) * 100), "%)"] }))] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleRetake(quiz.id), className: "flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200", children: [_jsx(Play, { className: "h-4 w-4" }), "Retake"] }), quiz.completedAt && quiz.score !== undefined && (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleViewResults(quiz.id), className: "flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 border-green-200", children: [_jsx(Eye, { className: "h-4 w-4" }), "Results"] })), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleDelete(quiz.id), className: "text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50", children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }, quiz.id))) })) })] })] }) }));
}
