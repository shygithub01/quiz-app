// Admin Quiz Templates List - View and Edit Quiz Templates
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../components/ui/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../components/ui/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Edit, Plus } from 'lucide-react';

export default function AdminQuizTemplatesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) {
      alert('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }

    await loadTemplates();
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesRef = collection(db, 'quizTemplates');
      const snapshot = await getDocs(templatesRef);
      const templateList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(templateList);
      console.log('✅ Loaded', templateList.length, 'quiz templates');
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      alert('Failed to load quiz templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestions = (templateId: string) => {
    navigate(`/admin/quiz-templates/${templateId}/edit`);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="h-8 w-8 text-indigo-600" />
              Quiz Templates
            </h1>
            <p className="text-gray-600 mt-1">
              View and edit quiz question templates
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/competition-settings')}
            >
              Back to Settings
            </Button>
            <Button
              onClick={() => navigate('/admin/create-competition')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Template
            </Button>
          </div>
        </div>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Quiz Templates</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Edit questions, view details, or delete templates
            </p>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No quiz templates created yet</p>
                <Button
                  onClick={() => navigate('/admin/create-competition')}
                  className="mt-4"
                >
                  Create Your First Template
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{template.title}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {template.subject || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="font-semibold">{template.questions?.length || 0}</span> questions
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            template.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            template.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {template.difficulty?.toUpperCase() || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(template.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditQuestions(template.id)}
                              className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors flex items-center gap-1"
                              title="Edit questions"
                            >
                              <Edit className="h-3 w-3" />
                              Edit Questions
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
