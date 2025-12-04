import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompetitions } from '@/components/ui/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Users, DollarSign } from 'lucide-react';

interface Competition {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  prizePool: number;
  participantCount: number;
}

export default function Competitions() {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const data = await getCompetitions();
      setCompetitions(data);
    } catch (error) {
      console.error('Failed to load competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompetitions = competitions.filter(comp => {
    if (filter === 'all') return true;
    return comp.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-indigo-600 flex items-center gap-3">
              <Trophy className="h-10 w-10" />
              Scholarship Competitions
            </h1>
            <p className="text-gray-600 mt-2">
              Compete for scholarships by demonstrating your knowledge and speed
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {['all', 'active', 'upcoming', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === tab
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Competitions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No competitions found</p>
              <p className="text-gray-500 mt-2">Check back soon for new scholarship opportunities!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredCompetitions.map((competition) => (
              <Card key={competition.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{competition.title}</CardTitle>
                      <CardDescription>{competition.description}</CardDescription>
                    </div>
                    {getStatusBadge(competition.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        ${competition.prizePool.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{competition.participantCount} participants</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {competition.status === 'active' && (
                      <Button 
                        onClick={() => navigate(`/competitions/${competition.id}`)}
                        className="flex-1"
                      >
                        Join Competition
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/competitions/${competition.id}`)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
