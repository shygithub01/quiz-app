import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCompetitionById, checkUserParticipation } from '../components/ui/firebase';
import Leaderboard from '../components/Leaderboard';
import { Competition } from '../types';

const CompetitionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [checkingParticipation, setCheckingParticipation] = useState(false);

  useEffect(() => {
    const fetchCompetition = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getCompetitionById(id);
        if (data) {
          setCompetition(data);
          
          // Check if user has already participated
          if (user?.uid) {
            setCheckingParticipation(true);
            const participated = await checkUserParticipation(user.uid, id);
            setHasParticipated(participated);
            setCheckingParticipation(false);
          }
        } else {
          setError('Competition not found');
        }
      } catch (err) {
        console.error('Error fetching competition:', err);
        setError('Failed to load competition');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetition();
  }, [id, user]);

  const handleStartCompetition = () => {
    if (!user) {
      alert('Please sign in to participate');
      return;
    }
    
    if (competition?.status !== 'active') {
      alert('This competition is not currently active');
      return;
    }
    
    if (hasParticipated) {
      alert('You have already participated in this competition. Only one attempt is allowed.');
      return;
    }
    
    // Navigate to competition quiz page
    navigate(`/competition-quiz/${id}`);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return badges[status as keyof typeof badges] || badges.upcoming;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error || 'Competition not found'}</p>
          <button
            onClick={() => navigate('/competitions')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Competitions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/competitions')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          ← Back to Competitions
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {competition.title}
            </h1>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(competition.status)}`}>
              {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
            </span>
          </div>
          
          {competition.status === 'active' && (
            <button
              onClick={handleStartCompetition}
              disabled={hasParticipated || checkingParticipation}
              className={`px-6 py-3 rounded-lg font-medium ${
                hasParticipated 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {checkingParticipation 
                ? 'Checking...' 
                : hasParticipated 
                ? 'Already Participated' 
                : 'Start Competition'}
            </button>
          )}
          {hasParticipated && (
            <p className="text-sm text-gray-600 mt-2">
              You have completed this competition. Check the leaderboard below for your ranking.
            </p>
          )}
        </div>
      </div>

      {/* Competition Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Start Date</div>
          <div className="font-medium">{formatDate(competition.startDate)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">End Date</div>
          <div className="font-medium">{formatDate(competition.endDate)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Participants</div>
          <div className="font-medium text-2xl">{competition.participantCount || 0}</div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">About</h2>
        <p className="text-gray-700 whitespace-pre-line">{competition.description}</p>
      </div>

      {/* Rules */}
      {competition.rules && competition.rules.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Rules</h2>
          <ul className="list-disc list-inside space-y-2">
            {competition.rules.map((rule, index) => (
              <li key={index} className="text-gray-700">{rule}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Prizes */}
      {competition.prizes && competition.prizes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Prizes</h2>
          <ul className="space-y-2">
            {competition.prizes.map((prize, index) => (
              <li key={index} className="flex items-center text-gray-700">
                <span className="text-2xl mr-3">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}
                </span>
                {prize}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
        <Leaderboard competitionId={id!} />
      </div>
    </div>
  );
};

export default CompetitionDetails;
