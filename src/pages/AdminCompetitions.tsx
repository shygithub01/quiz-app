import { useState } from 'react';
import { createCompetition } from '@/components/ui/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminCompetitions() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    quizTemplateId: '',
    status: 'upcoming' as 'upcoming' | 'active' | 'completed',
    rules: '',
    prizes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const competitionData = {
        ...formData,
        rules: formData.rules.split('\n').filter(r => r.trim()),
        prizes: formData.prizes.split('\n').filter(p => p.trim())
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
                <label className="block text-sm font-medium mb-1">Quiz Template ID</label>
                <input
                  type="text"
                  required
                  value={formData.quizTemplateId}
                  onChange={(e) => setFormData({ ...formData, quizTemplateId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter quiz template ID"
                />
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
