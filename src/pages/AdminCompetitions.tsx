import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompetition } from '@/components/ui/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/components/ui/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function AdminCompetitions() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    quizTemplateId: '',
    competitionType: 'scholarship' as 'scholarship' | 'practice',
    status: 'upcoming' as 'upcoming' | 'active' | 'completed',
    rules: '',
    prizes: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templatesRef = collection(db, 'quizTemplates');
      const snapshot = await getDocs(templatesRef);
      const templateList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(templateList);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const prizesArray = formData.prizes.split('\n').filter(p => p.trim());
      
      const competitionData = {
        ...formData,
        rules: formData.rules.split('\n').filter(r => r.trim()),
        prizes: formData.competitionType === 'scholarship' ? prizesArray : [],
        prizePool: formData.competitionType === 'scholarship' ? 1000 : 0,
        competitionType: formData.competitionType
      };
      
      await createCompetition(competitionData);
      alert('Competition created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        quizTemplateId: '',
        competitionType: 'scholarship',
        status: 'upcoming',
        rules: '',
        prizes: ''
      });
    } catch (error) {
      console.error('Failed to create competition:', error);
      alert('Failed to create competition');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-4 mb-6">
          <Button onClick={() => navigate('/admin/quiz-templates')} className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz Template First
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quiz Template</label>
                <select
                  required
                  value={formData.quizTemplateId}
                  onChange={(e) => setFormData({ ...formData, quizTemplateId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a quiz template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title} ({template.questions?.length || 0} questions)
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No templates available. Create one first.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Competition Type</label>
                  <select
                    value={formData.competitionType}
                    onChange={(e) => setFormData({ ...formData, competitionType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="scholarship">🏆 Scholarship Competition (One Attempt)</option>
                    <option value="practice">📚 Practice Session (Multiple Attempts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rules (one per line)</label>
                <textarea
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Complete all questions&#10;No external resources&#10;Each question worth equal points"
                />
              </div>

              {formData.competitionType === 'scholarship' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Prizes (one per line)</label>
                  <textarea
                    value={formData.prizes}
                    onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="1st Place: $500 + Trophy&#10;2nd Place: $300 + Medal&#10;3rd Place: $100 + Medal"
                  />
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">📚 Practice Session Benefits</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Multiple attempts allowed</li>
                    <li>• Detailed explanations for each question</li>
                    <li>• Progress tracking and improvement analytics</li>
                    <li>• Perfect preparation for scholarship competitions</li>
                  </ul>
                </div>
              )}

              <Button type="submit" className="w-full">
                Create Competition
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
