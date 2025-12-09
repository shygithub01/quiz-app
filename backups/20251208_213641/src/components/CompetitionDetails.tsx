import { useState, useEffect } from 'react';
import { getActiveCompetitionSettings } from '../components/ui/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  Users, 
  BookOpen, 
  AlertCircle,
  CheckCircle,
  Phone
} from 'lucide-react';

interface CompetitionDetailsProps {
  showFullDetails?: boolean;
}

export default function CompetitionDetails({ showFullDetails = false }: CompetitionDetailsProps) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const competitionSettings = await getActiveCompetitionSettings();
        setSettings(competitionSettings);
      } catch (error) {
        console.error('Error loading competition settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-white/10 rounded-lg"></div>
      </div>
    );
  }

  if (!settings) {
    console.log('❌ CompetitionDetails: No settings loaded');
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white mb-2">Loading Competition Details...</h3>
          <p className="text-white/70">
            Please wait while we load the competition information.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!settings.publishDetails) {
    console.log('⚠️ CompetitionDetails: Settings exist but not published');
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white mb-2">Competition Details Coming Soon</h3>
          <p className="text-white/70">
            Detailed competition information will be published closer to the event date.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  console.log('✅ CompetitionDetails: Rendering full details', settings);



  const getRegistrationStatus = () => {
    const now = new Date();
    const deadline = new Date(settings.registrationDeadline);
    const competitionDate = new Date(settings.date);
    
    if (competitionDate < now) return { status: 'completed', message: 'Competition has ended' };
    if (!settings.registrationOpen) return { status: 'closed', message: 'Registration is closed' };
    if (deadline < now) return { status: 'closed', message: 'Registration deadline has passed' };
    
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { 
      status: 'open', 
      message: `Registration closes in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`
    };
  };

  const registrationStatus = getRegistrationStatus();

  return (
    <div className="space-y-6">
      {/* Competition Overview */}
      <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            {settings.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <div className="text-lg font-bold text-white">{settings.shortDate}</div>
              <div className="text-blue-200 text-sm">Competition Date</div>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <div className="text-lg font-bold text-white">{settings.testOpenTime} - {settings.testCloseTime}</div>
              <div className="text-green-200 text-sm">Test Window</div>
            </div>
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-lg font-bold text-white">{settings.prizePool}</div>
              <div className="text-yellow-200 text-sm">Total Prizes</div>
            </div>
            <div className="text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-purple-400" />
              <div className="text-lg font-bold text-white">{settings.questionCount}</div>
              <div className="text-purple-200 text-sm">Questions</div>
            </div>
          </div>

          {/* Registration Status */}
          <div className={`p-4 rounded-lg border ${
            registrationStatus.status === 'open' 
              ? 'bg-green-500/20 border-green-400/30' 
              : 'bg-red-500/20 border-red-400/30'
          }`}>
            <div className="flex items-center gap-2">
              {registrationStatus.status === 'open' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <span className={`font-medium ${
                registrationStatus.status === 'open' ? 'text-green-100' : 'text-red-100'
              }`}>
                {registrationStatus.message}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {showFullDetails && (
        <>
          {/* Eligibility Requirements */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Eligibility Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {settings.eligibilityRequirements?.map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-white/80">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Competition Rules */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Competition Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {settings.rules?.map((rule: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-white/80">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-300 text-sm font-medium">{index + 1}</span>
                    </div>
                    {rule}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Test Instructions */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Test Day Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {settings.instructions?.map((instruction: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-white/80">
                    <CheckCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    {instruction}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Prize Breakdown */}
          <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Prize Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {settings.prizeBreakdown?.map((prize: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-white/80">
                    <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-300 text-sm font-medium">🏆</span>
                    </div>
                    {prize}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {settings.contactInfo && (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80">{settings.contactInfo}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}