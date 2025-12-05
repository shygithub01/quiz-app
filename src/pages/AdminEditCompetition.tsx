import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getCompetitionById, 
  updateCompetition,
  isAdmin
} from '@/components/ui/firebase';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

export default function AdminEditCompetition() {
  const { id: competitionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [competition, setCompetition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'upcoming',
    rules: '',
    prizes: ''
  });

  useEffect(() => {
    loadData();
  }, [competitionId, user]);

  const loadData = async () => {
    if (!competitionId || !user?.uid) return;

    try {
      setLoading(true);

      // Check if user is admin
      const adminStatus = await isAdmin(user.uid);
      if (!adminStatus) {
        alert('Access denied. Admin only.');
        navigate('/');
        return;
      }

      // Load competition
      const comp = await getCompetitionById(competitionId);
      if (!comp) {
        alert('Competition not found');
        navigate('/admin/competitions');
        return;
      }

      setCompetition(comp);

      // Convert dates for form inputs
      const startDate = comp.startDate ? new Date(comp.startDate.toDate ? comp.startDate.toDate() : comp.startDate) : new Date();
      const endDate = comp.endDate ? new Date(comp.endDate.toDate ? comp.endDate.toDate() : comp.endDate) : new Date();

      setFormData({
        title: comp.title || '',
        description: comp.description || '',
        startDate: startDate.toISOString().slice(0, 16), // Format for datetime-local
        endDate: endDate.toISOString().slice(0, 16),
        status: comp.status || 'upcoming',
        rules: Array.isArray(comp.rules) ? comp.rules.join('\n') : (comp.rules || ''),
        prizes: Array.isArray(comp.prizes) ? comp.prizes.join('\n') : (comp.prizes || '')
      });

      // Templates not needed for editing

    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load competition data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitionId) return;

    try {
      setSaving(true);

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        status: formData.status,
        rules: formData.rules.split('\n').filter(r => r.trim()),
        prizes: formData.prizes.split('\n').filter(p => p.trim())
      };

      await updateCompetition(competitionId, updateData);
      alert('✅ Competition updated successfully!');
      navigate(`/competitions/${competitionId}`);

    } catch (error) {
      console.error('Error updating competition:', error);
      alert('❌ Failed to update competition');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/competitions/${competitionId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Competition
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Competition</h1>
              <p className="text-gray-600 mt-2">Update competition details and settings</p>
            </div>
          </div>
        </div>

        {/* Warning for Active Competitions */}
        {competition?.status === 'active' && competition?.participantCount > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">⚠️ Active Competition Warning</p>
                  <p>This competition has {competition.participantCount} participants. Changing dates or status may affect ongoing participation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Competition Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter competition title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the competition"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Rules */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rules (one per line)
                </label>
                <textarea
                  name="rules"
                  value={formData.rules}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter competition rules, one per line"
                />
              </div>

              {/* Prizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prizes (one per line)
                </label>
                <textarea
                  name="prizes"
                  value={formData.prizes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter prizes, one per line (1st place, 2nd place, etc.)"
                />
              </div>

              {/* Quiz Template Info (Read-only) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Quiz Template (Cannot be changed)</h3>
                <p className="text-sm text-gray-600">
                  Template ID: {competition?.quizTemplateId}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Questions cannot be modified after competition creation to maintain fairness.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/competitions/${competitionId}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}