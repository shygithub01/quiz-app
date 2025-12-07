import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCompetitionById, checkUserParticipation, resetUserAttempt, isAdmin } from '../components/ui/firebase';
import { Competition } from '../types';

const CompetitionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasParticipated, setHasParticipated] = useState(false);

  const [resetting, setResetting] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    const fetchCompetition = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getCompetitionById(id);
        if (data) {
          setCompetition(data);
          
          // Check if user has already participated and if user is admin
          if (user?.uid) {
            const [participated, adminStatus] = await Promise.all([
              checkUserParticipation(user.uid, id),
              isAdmin(user.uid)
            ]);
            setHasParticipated(participated);
            setUserIsAdmin(adminStatus);
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



  const handleResetAttempt = async () => {
    if (!user || !id) return;
    
    const confirmed = confirm(
      '⚠️ Are you sure you want to reset your attempt?\n\n' +
      'This will:\n' +
      '• Delete your score from the leaderboard\n' +
      '• Allow you to retake the competition\n' +
      '• Remove your previous answers\n\n' +
      'This action cannot be undone!'
    );
    
    if (!confirmed) return;
    
    try {
      setResetting(true);
      const result = await resetUserAttempt(user.uid, id);
      
      if (result.success) {
        alert('✅ Your attempt has been reset! You can now retake the competition.');
        setHasParticipated(false);
        // Refresh the page to update leaderboard
        window.location.reload();
      } else {
        alert('⚠️ ' + result.message);
      }
    } catch (error) {
      console.error('Error resetting attempt:', error);
      alert('❌ Failed to reset attempt. Please try again.');
    } finally {
      setResetting(false);
    }
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
        <div className="mb-6">
          <button
            onClick={() => navigate('/competitions')}
            className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            ← Back to Competitions
          </button>
        </div>
        
        {/* Competition Title and Status */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {competition.title}
          </h1>
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(competition.status)}`}>
            {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
          </span>
        </div>

        {/* Participation Status */}
        {hasParticipated && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-6">
            <p className="text-green-800 font-medium">
              ✅ You have completed this competition. Check the leaderboard for your ranking.
            </p>
          </div>
        )}

        {/* Reset for Practice Competitions (Students and Admins) */}
        {hasParticipated && (competition.competitionType || 'scholarship') === 'practice' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-medium text-green-900 mb-2 text-center">Practice Session Complete!</h3>
            <p className="text-green-800 text-center mb-4">Want to practice more? You can retake this session anytime.</p>
            <div className="flex justify-center">
              <button
                onClick={handleResetAttempt}
                disabled={resetting}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
                title="Retake this practice session"
              >
                {resetting ? '🔄 Preparing...' : '🔄 Retake Practice Session'}
              </button>
            </div>
          </div>
        )}

        {/* Admin Controls */}
        {userIsAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-medium text-blue-900 mb-4 text-center">Admin Controls</h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(`/admin/competitions/${id}/participants`)}
                className="px-6 py-3 rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                title="Admin: Manage all participants"
              >
                👥 Manage Participants
              </button>
              
              <button
                onClick={() => navigate(`/admin/competitions/${id}/edit`)}
                className="px-6 py-3 rounded-lg border-2 border-green-500 text-green-600 hover:bg-green-50 font-medium transition-colors"
                title="Admin: Edit competition details"
              >
                ✏️ Edit Competition
              </button>
              
              {hasParticipated && (
                <button
                  onClick={handleResetAttempt}
                  disabled={resetting}
                  className="px-6 py-3 rounded-lg border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-medium transition-colors"
                  title="Admin: Reset your own attempt"
                >
                  {resetting ? '🔄 Resetting...' : '🔄 Reset My Attempt'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Competition Type Banner */}
      {competition.competitionType === 'practice' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <h3 className="font-bold text-blue-900">Practice Session</h3>
              <p className="text-blue-800">Take this as many times as you want to improve your skills!</p>
            </div>
          </div>
        </div>
      )}

      {/* Competition Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Type</div>
          <div className="font-medium flex items-center gap-2">
            {(competition.competitionType || 'scholarship') === 'scholarship' ? (
              <>
                <span>🏆</span>
                <span>Scholarship</span>
              </>
            ) : (
              <>
                <span>📚</span>
                <span>Practice</span>
              </>
            )}
          </div>
        </div>

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



      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        {/* Start Competition Button */}
        {competition.status === 'active' && !hasParticipated && (
          <button
            onClick={() => navigate(`/competitions/${id}/quiz`)}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl font-medium text-lg"
          >
            🚀 Start Competition
          </button>
        )}
        
        {/* Competition Status Button (when not active or already participated) */}
        {(competition.status !== 'active' || hasParticipated) && (
          <button
            disabled
            className="px-8 py-4 bg-gray-300 text-gray-600 rounded-lg font-medium text-lg cursor-not-allowed"
          >
            {hasParticipated 
              ? '✅ Already Participated' 
              : competition.status === 'upcoming' 
                ? '📅 Competition Upcoming' 
                : '🏁 Competition Completed'
            }
          </button>
        )}

        {/* View Leaderboard Button */}
        <button
          onClick={() => navigate(`/competitions/${id}/leaderboard`)}
          className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl font-medium text-lg"
        >
          🏆 View Leaderboard
        </button>
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

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Competition Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{competition.participantCount || 0}</div>
            <div className="text-sm text-blue-800">Total Participants</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">50</div>
            <div className="text-sm text-green-800">Questions</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{competition.status === 'active' ? 'Live' : competition.status}</div>
            <div className="text-sm text-purple-800">Status</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate(`/competitions/${id}/leaderboard`)}
            className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-medium"
          >
            🏆 View Full Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetails;
