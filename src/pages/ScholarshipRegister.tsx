import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveScholarshipRegistration, checkScholarshipRegistration } from '../components/ui/firebase';
import { COMPETITION_CONFIG, getPrizePool } from '../config/competition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  School, 
  User, 

  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Clock
} from 'lucide-react';

interface RegistrationData {
  county: string;
  gradeLevel: string;
  school: string;
  birthYear: string;
  parentEmail?: string;
  agreeToTerms: boolean;
  agreeToScholarshipRules?: boolean;
  acknowledgeMeritBased?: boolean;
  marketingConsent: boolean;
}

export default function ScholarshipRegister() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [competitionSettings, setCompetitionSettings] = useState<any>(null);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    county: '',
    gradeLevel: '',
    school: '',
    birthYear: '',
    parentEmail: '',
    agreeToTerms: false,
    agreeToScholarshipRules: false,
    acknowledgeMeritBased: false,
    marketingConsent: false
  });

  useEffect(() => {
    if (!user) {
      navigate('/scholarship');
    } else {
      // Load competition settings and check existing registration
      loadCompetitionData();
    }
  }, [user, navigate]);

  const loadCompetitionData = async () => {
    try {
      // Load actual competitions from competitions collection
      const { getCompetitions } = await import('../components/ui/firebase');
      const competitions = await getCompetitions();
      
      // Find the next active or upcoming scholarship competition
      const scholarshipCompetitions = competitions.filter((c: any) => !c.isPractice);
      const now = new Date();
      
      console.log('📊 All scholarship competitions:', scholarshipCompetitions.map((c: any) => ({
        title: c.title,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        endDatePassed: new Date(c.endDate) < now
      })));
      
      // Filter by actual dates, not just status (status might not be updated)
      const activeOrUpcoming = scholarshipCompetitions.filter((c: any) => {
        const endDate = new Date(c.endDate);
        const isNotEnded = endDate >= now;
        return isNotEnded && (c.status === 'active' || c.status === 'upcoming');
      });
      
      console.log('🎯 Active/Upcoming competitions (by date):', activeOrUpcoming.length);
      
      if (activeOrUpcoming.length > 0) {
        // Sort by start date to get the next one
        const sorted = activeOrUpcoming.sort((a: any, b: any) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        const nextCompetition = sorted[0];
        
        // Convert competition to settings format for display
        const settings = {
          dateTime: new Date(nextCompetition.startDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          duration: nextCompetition.duration || '60 minutes',
          questionCount: nextCompetition.questionCount || 50,
          subjects: 'Math, Science, English, Social Studies', // Default for now
          prizePool: nextCompetition.prizePool ? `$${nextCompetition.prizePool}` : '$300',
          status: nextCompetition.status
        };
        
        setCompetitionSettings(settings);
        console.log('🏆 Loaded next scholarship competition:', nextCompetition);
        console.log('📋 Display settings:', settings);
      } else {
        // Check if there are any completed competitions
        const completedCompetitions = scholarshipCompetitions.filter((c: any) => c.status === 'completed');
        
        if (completedCompetitions.length > 0) {
          // Show "competition completed, next one coming soon" message
          setCompetitionSettings({
            status: 'no_upcoming',
            message: 'The latest competition has ended. New competitions coming soon!'
          });
          console.log('📅 All competitions completed, showing coming soon message');
        } else {
          // No competitions at all
          setCompetitionSettings({
            status: 'no_competitions',
            message: 'No competitions available yet. Check back soon!'
          });
          console.log('⚠️ No scholarship competitions found');
        }
      }
      
      // Check existing registration
      await checkExistingRegistration();
    } catch (error) {
      console.error('❌ Error loading competition data:', error);
      setCompetitionSettings(null);
    }
  };

  const checkExistingRegistration = async () => {
    if (user) {
      const existing = await checkScholarshipRegistration(user.uid);
      if (existing) {
        setExistingRegistration(existing);
        setIsUpdating(true);
        // Pre-fill form with existing data
        setRegistrationData({
          county: existing.county || '',
          gradeLevel: existing.gradeLevel || '',
          school: existing.school || '',
          birthYear: existing.birthYear || '',
          parentEmail: existing.parentEmail || '',
          agreeToTerms: true,
          agreeToScholarshipRules: true,
          acknowledgeMeritBased: true,
          marketingConsent: existing.marketingConsent || false
        });
        setIsEligible(existing.county === 'henrico');
      }
    }
  };

  // Auto-redirect after sign-in
  useEffect(() => {
    if (user && step === 1 && registrationData.county === '') {
      // User just signed in, start the registration process
      // No need to redirect, just ensure they're on step 1
    }
  }, [user, step, registrationData.county]);

  const henricoSchools = [
    'Deep Run High School',
    'Freeman High School',
    'Glen Allen High School',
    'Godwin High School',
    'Hermitage High School',
    'Highland Springs High School',
    'J.R. Tucker High School',
    'Mills E. Godwin High School',
    'Short Pump Middle School',
    'Tuckahoe Middle School',
    'Other Henrico School'
  ];

  const colleges = [
    'Virginia Commonwealth University (VCU)',
    'University of Richmond',
    'Virginia Union University',
    'J. Sargeant Reynolds Community College',
    'Other College/University'
  ];

  const counties = [
    { value: 'henrico', label: 'Henrico County, VA', available: true },
    { value: 'chesterfield', label: 'Chesterfield County, VA', available: false, comingSoon: 'Summer 2025' },
    { value: 'richmond', label: 'Richmond City, VA', available: false, comingSoon: 'Fall 2025' },
    { value: 'hanover', label: 'Hanover County, VA', available: false, comingSoon: 'Fall 2025' },
    { value: 'other', label: 'Other Virginia Location', available: false, comingSoon: '2026' }
  ];

  const handleCountyChange = (county: string) => {
    setRegistrationData(prev => ({ ...prev, county }));
    setIsEligible(county === 'henrico');
  };

  const handleInputChange = (field: keyof RegistrationData, value: string | boolean) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }));
  };

  const isUnder18 = () => {
    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(registrationData.birthYear);
    return currentYear - birthYear < 18;
  };

  const isUnder13 = () => {
    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(registrationData.birthYear);
    return currentYear - birthYear < 13;
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return registrationData.county !== '';
      case 2:
        return registrationData.gradeLevel !== '' && registrationData.school !== '';
      case 3:
        // Block under-13 from proceeding
        if (isUnder13()) {
          return false;
        }
        
        const hasRequiredFields = registrationData.birthYear !== '' && 
                                  registrationData.agreeToTerms &&
                                  registrationData.agreeToScholarshipRules &&
                                  registrationData.acknowledgeMeritBased;
        const hasParentEmailIfNeeded = !isUnder18() || (registrationData.parentEmail !== '' && registrationData.parentEmail !== undefined && registrationData.parentEmail.includes('@'));
        console.log('🔍 Step 3 validation:', {
          birthYear: registrationData.birthYear,
          agreeToTerms: registrationData.agreeToTerms,
          agreeToScholarshipRules: registrationData.agreeToScholarshipRules,
          acknowledgeMeritBased: registrationData.acknowledgeMeritBased,
          isUnder18: isUnder18(),
          isUnder13: isUnder13(),
          parentEmail: registrationData.parentEmail,
          hasRequiredFields,
          hasParentEmailIfNeeded,
          canProceed: hasRequiredFields && hasParentEmailIfNeeded
        });
        return hasRequiredFields && hasParentEmailIfNeeded;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('❌ Please sign in to complete registration.');
      return;
    }
    
    console.log('🎯 Starting registration submission...');
    console.log('📝 Registration data:', registrationData);
    console.log('👤 User ID:', user.uid);
    
    try {
      // Save registration data
      const result = await saveScholarshipRegistration(user.uid, registrationData);
      console.log('📊 Registration result:', result);
      
      if (result.success) {
        if (isEligible) {
          // Register for competition
          alert(isUpdating 
            ? '✅ Registration Updated Successfully!\n\n🎯 Your information has been updated\n💰 Still registered for March 15th competition\n📧 Check your email for any updates'
            : '🎉 Registration Complete! Welcome to the Henrico Merit Scholarship Program!\n\n✅ You\'re registered for March 15th competition\n💰 Competing for $300 in prizes\n📧 Check your email for competition details\n📚 Practice mode now available'
          );
          navigate('/competitions');
        } else {
          // Add to waitlist
          alert(isUpdating
            ? '✅ Waitlist Registration Updated!\n\n📧 Your information has been updated\n🚀 Timeline: ' + counties.find(c => c.value === registrationData.county)?.comingSoon
            : '📧 Waitlist Registration Complete!\n\n✅ You\'ll be notified when scholarships launch in your area\n🚀 Expected timeline: ' + counties.find(c => c.value === registrationData.county)?.comingSoon + '\n📬 We\'ll email you as soon as registration opens'
          );
          navigate('/scholarship');
        }
      } else {
        console.error('❌ Registration failed:', result.error);
        alert(`❌ Registration failed: ${result.error instanceof Error ? result.error.message : 'Unknown error'}. Please try again.`);
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      alert(`❌ Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const renderStep1 = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <MapPin className="h-6 w-6 text-purple-600" />
          Step 1: Location Eligibility
        </CardTitle>
        <p className="text-gray-600">
          Select your county to check eligibility for current scholarships
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {counties.map((county) => (
          <div
            key={county.value}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              registrationData.county === county.value
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'
            } ${!county.available ? 'opacity-75' : ''}`}
            onClick={() => handleCountyChange(county.value)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  registrationData.county === county.value
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300'
                }`} />
                <div>
                  <div className="font-medium">{county.label}</div>
                  {!county.available && (
                    <div className="text-sm text-orange-600">
                      Coming {county.comingSoon} - Join Waitlist
                    </div>
                  )}
                </div>
              </div>
              {county.available && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Available Now
                </div>
              )}
            </div>
          </div>
        ))}

        {registrationData.county && (
          <div className={`mt-6 p-4 rounded-lg ${
            isEligible 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-orange-50 border border-orange-200'
          }`}>
            <div className="flex items-start gap-3">
              {isEligible ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              )}
              <div>
                {isEligible ? (
                  <>
                    <div className="font-medium text-green-800">✅ You're Eligible!</div>
                    <div className="text-green-700 text-sm mt-1">
                      {competitionSettings?.status === 'no_upcoming' || competitionSettings?.status === 'no_competitions' ? (
                        'Complete registration to be notified when the next competition opens.'
                      ) : (
                        `Henrico County students can register for the next competition with ${competitionSettings?.prizePool || getPrizePool()} in prizes.`
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium text-orange-800">📧 Join Our Waitlist</div>
                    <div className="text-orange-700 text-sm mt-1">
                      Scholarships aren't available in your area yet, but we're expanding! 
                      Complete registration to join the waitlist and be notified when we launch in your county.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <School className="h-6 w-6 text-purple-600" />
          Step 2: Academic Information
        </CardTitle>
        <p className="text-gray-600">
          Tell us about your current education level
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grade Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Current Grade Level *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['9th Grade', '10th Grade', '11th Grade', '12th Grade', 'College Student', 'Graduate Student'].map((grade) => (
              <div
                key={grade}
                className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                  registrationData.gradeLevel === grade
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => handleInputChange('gradeLevel', grade)}
              >
                {grade}
              </div>
            ))}
          </div>
        </div>

        {/* School Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            School/Institution *
          </label>
          <select
            value={registrationData.school}
            onChange={(e) => handleInputChange('school', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select your school...</option>
            
            {(registrationData.gradeLevel === 'College Student' || registrationData.gradeLevel === 'Graduate Student') ? (
              <>
                <optgroup label="Colleges & Universities">
                  {colleges.map((college) => (
                    <option key={college} value={college}>{college}</option>
                  ))}
                </optgroup>
              </>
            ) : (
              <>
                <optgroup label="Henrico High Schools">
                  {henricoSchools.map((school) => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        </div>

        {/* Prize Information */}
        {isEligible && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-800">Prize Information</span>
            </div>
            <div className="text-sm text-purple-700">
              {registrationData.gradeLevel.includes('Grade') ? (
                'High school students compete for prizes up to $150 per competition.'
              ) : (
                'College students compete for prizes up to $150 per competition.'
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <User className="h-6 w-6 text-purple-600" />
          Step 3: Final Details
        </CardTitle>
        <p className="text-gray-600">
          Complete your registration information
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Birth Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Year *
          </label>
          <select
            value={registrationData.birthYear}
            onChange={(e) => handleInputChange('birthYear', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select year...</option>
            {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i - 14).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {/* Age Gating Warning for Under 13 */}
          {registrationData.birthYear && isUnder13() && (
            <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-orange-800">Age Requirement Notice</div>
                  <div className="text-orange-700 text-sm mt-1">
                    Scholarship competitions are available to students age 13 and above. 
                    You can still use our practice mode to improve your skills!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Parent Email (if under 18) */}
        {isUnder18() && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent/Guardian Email * (Required for minors)
            </label>
            <input
              type="email"
              value={registrationData.parentEmail}
              onChange={(e) => handleInputChange('parentEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="parent@email.com"
            />
            <p className="text-sm text-gray-600 mt-1">
              We'll send competition details and parental consent information to this email.
            </p>
          </div>
        )}

        {/* Terms Agreement - Enhanced with Legal Requirements */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={registrationData.agreeToTerms}
              onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
              className="mt-1 flex-shrink-0"
              disabled={isUnder13()}
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              I agree to the <a href="/terms" target="_blank" className="text-purple-600 hover:underline font-medium">Terms of Service</a> and 
              <a href="/privacy" target="_blank" className="text-purple-600 hover:underline ml-1 font-medium">Privacy Policy</a>. *
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="scholarshipRules"
              checked={registrationData.agreeToScholarshipRules || false}
              onChange={(e) => handleInputChange('agreeToScholarshipRules', e.target.checked)}
              className="mt-1 flex-shrink-0"
              disabled={isUnder13()}
            />
            <label htmlFor="scholarshipRules" className="text-sm text-gray-700">
              I agree to the <a href="/scholarship-rules" target="_blank" className="text-purple-600 hover:underline font-medium">Official Scholarship Rules</a>. *
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="meritBased"
              checked={registrationData.acknowledgeMeritBased || false}
              onChange={(e) => handleInputChange('acknowledgeMeritBased', e.target.checked)}
              className="mt-1 flex-shrink-0"
              disabled={isUnder13()}
            />
            <label htmlFor="meritBased" className="text-sm text-gray-700">
              I understand that scholarships are <span className="font-semibold">free, merit-based</span>, and results are final. 
              Paid features do not influence scholarship outcomes. *
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="marketing"
              checked={registrationData.marketingConsent}
              onChange={(e) => handleInputChange('marketingConsent', e.target.checked)}
              className="mt-1 flex-shrink-0"
            />
            <label htmlFor="marketing" className="text-sm text-gray-700">
              I'd like to receive updates about new competitions and scholarship opportunities. (Optional)
            </label>
          </div>
        </div>

        {/* Registration Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Registration Summary:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>📍 Location: {counties.find(c => c.value === registrationData.county)?.label}</div>
            <div>🎓 Level: {registrationData.gradeLevel}</div>
            <div>🏫 School: {registrationData.school}</div>
            {isEligible ? (
              <div className="text-green-600 font-medium">✅ Eligible for March 15th competition ($300 prizes)</div>
            ) : (
              <div className="text-orange-600 font-medium">📧 Will be added to waitlist for future expansion</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="text-center p-8">
            <CardContent className="space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <User className="h-8 w-8 text-white" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Complete Your Scholarship Registration
                </h2>
                <p className="text-gray-600">
                  Sign in with Google to register for the Henrico Merit Scholarship Program
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">What happens next:</h3>
                <div className="text-sm text-green-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Sign in securely with your Google account</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Complete eligibility information (2 minutes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Get registered for March 15th competition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Compete for $300 in prizes!</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate('/scholarship')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-3"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Signed in as {user.displayName || user.email}</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isUpdating ? 'Update Your Registration' : 'Complete Your Scholarship Registration'}
          </h1>
          <p className="text-gray-600">
            {isUpdating 
              ? 'Update your information for the scholarship program'
              : 'Just a few quick questions to get you registered for the March 15th competition'
            }
          </p>
          {isUpdating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 text-blue-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">
                  {existingRegistration?.county === 'henrico' 
                    ? 'Currently registered for March 15th competition'
                    : `Currently on waitlist for ${existingRegistration?.county} expansion`
                  }
                </span>
              </div>
            </div>
          )}
          
          {/* Progress Bar */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => step === 1 ? navigate('/scholarship') : setStep(step - 1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? 'Back to Home' : 'Previous'}
          </Button>

          <Button
            onClick={() => step === 3 ? handleSubmit() : setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            title={!canProceed() ? 'Please fill in all required fields' : ''}
          >
            {step === 3 ? (
              isEligible ? 'Complete Registration' : 'Join Waitlist'
            ) : (
              'Next'
            )}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Competition Info */}
        {isEligible && (
          <div className="mt-8 max-w-2xl mx-auto">
            {competitionSettings?.status === 'no_upcoming' || competitionSettings?.status === 'no_competitions' ? (
              <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-orange-800 mb-2">
                        {competitionSettings?.status === 'no_upcoming' ? '📅 Competition Completed' : '🚀 Coming Soon'}
                      </h3>
                      <p className="text-orange-700 mb-4">
                        {competitionSettings?.message}
                      </p>
                      <p className="text-sm text-orange-600">
                        Complete your registration now to be notified when the next competition opens.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800">Next Competition Details</h3>
                  </div>
                  {competitionSettings ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-green-800">Date & Time:</div>
                        <div className="text-green-700">
                          {competitionSettings.dateTime}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-green-800">Duration:</div>
                        <div className="text-green-700">
                          {competitionSettings.duration} ({competitionSettings.questionCount} questions)
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-green-800">Subjects:</div>
                        <div className="text-green-700">
                          {competitionSettings.subjects}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-green-800">Prize Pool:</div>
                        <div className="text-green-700">
                          {competitionSettings.prizePool} ({COMPETITION_CONFIG.prizes.first}, {COMPETITION_CONFIG.prizes.second}, {COMPETITION_CONFIG.prizes.third})
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-green-700">
                      Loading competition details...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}