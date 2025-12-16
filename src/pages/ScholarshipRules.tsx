import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, AlertCircle } from 'lucide-react';

export default function ScholarshipRules() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Button 
          onClick={() => navigate('/')} 
          variant="outline"
          className="mb-6"
        >
          ← Back to Home
        </Button>

        <Card>
          <CardContent className="p-8 prose prose-sm max-w-none">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-10 w-10 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900 mb-0">Official Scholarship Rules</h1>
            </div>
            <p className="text-gray-600 mb-8">Quizist.AI Merit Scholarship Program</p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-green-900 mb-2">No Purchase Necessary</h3>
                  <p className="text-green-800 mb-0">
                    Participation in Quizist.AI scholarship competitions is completely FREE. 
                    No payment or purchase is required to enter or win.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To participate in scholarship competitions, participants must:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Be at least 13 years of age at the time of registration</li>
                <li>Meet competition-specific criteria (grade level, geographic location, etc.)</li>
                <li>Provide accurate registration information</li>
                <li>Have a valid email address</li>
                <li>Agree to these Official Rules and the Terms of Service</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Specific competitions may have additional eligibility requirements, which will be clearly stated 
                on the competition details page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Competition Format</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Structure</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>One Attempt:</strong> Each participant is allowed ONE attempt per competition</li>
                <li><strong>Timed Quiz:</strong> Competitions are timed; duration specified before start</li>
                <li><strong>Multiple Choice:</strong> Questions are multiple-choice format with 4 options</li>
                <li><strong>No Pausing:</strong> Once started, the quiz cannot be paused or resumed</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Technical Requirements</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Stable internet connection required</li>
                <li>Compatible device (computer, tablet, or smartphone)</li>
                <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>JavaScript enabled</li>
              </ul>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                <p className="text-orange-900 text-sm mb-0">
                  <strong>Important:</strong> Quizist.AI is not responsible for technical issues including but not 
                  limited to internet connectivity problems, device failures, or power outages that may affect 
                  participation.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Scoring and Ranking</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Winners are determined by the following criteria, in order of priority:
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
                <ol className="list-decimal pl-6 text-gray-900 space-y-3">
                  <li className="font-semibold">
                    <span className="text-blue-600">Total Correct Answers</span>
                    <p className="font-normal text-gray-700 mt-1">
                      Participant with the highest number of correct answers ranks higher
                    </p>
                  </li>
                  <li className="font-semibold">
                    <span className="text-blue-600">Time Taken</span>
                    <p className="font-normal text-gray-700 mt-1">
                      If tied on correct answers, participant who completed the quiz faster ranks higher
                    </p>
                  </li>
                  <li className="font-semibold">
                    <span className="text-blue-600">Submission Time</span>
                    <p className="font-normal text-gray-700 mt-1">
                      If still tied, participant who submitted earlier ranks higher
                    </p>
                  </li>
                </ol>
              </div>

              <p className="text-gray-700 leading-relaxed">
                All scoring is automated and objective. There is no subjective judging component.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Prohibited Conduct and Disqualification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The following actions will result in immediate disqualification:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Creating or using multiple accounts</li>
                <li>Sharing questions or answers with others</li>
                <li>Using bots, scripts, or automated tools</li>
                <li>Attempting to tamper with the Platform or competition system</li>
                <li>Collaborating with other participants during the competition</li>
                <li>Using external resources or assistance during the timed quiz</li>
                <li>Providing false or misleading registration information</li>
                <li>Any other conduct deemed unfair or fraudulent</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Quizist.AI reserves the right to investigate suspicious activity and disqualify participants 
                at its sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prizes</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Prize Structure</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Prize amounts are disclosed on the competition details page before registration</li>
                <li>Prizes are awarded as specified (typically 1st, 2nd, and 3rd place)</li>
                <li>Prize distribution is based solely on final ranking</li>
                <li>No substitution or transfer of prizes</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Prize Distribution</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Winners will be notified via email within 48 hours of competition end</li>
                <li>Prizes are distributed electronically (e.g., PayPal, Venmo, bank transfer)</li>
                <li>Winners must respond within 7 days to claim their prize</li>
                <li>Unclaimed prizes may be forfeited</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Tax Responsibility</h3>
              <p className="text-gray-700 leading-relaxed">
                Winners are solely responsible for any applicable federal, state, or local taxes on prizes. 
                Quizist.AI will provide tax documentation as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Paid Features and Fair Competition</h2>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">Merit-Based Competition Guarantee</h3>
                <p className="text-purple-800 mb-3">
                  Quizist.AI may offer paid premium features for enhanced learning tools. However:
                </p>
                <ul className="list-disc pl-6 text-purple-800 space-y-2">
                  <li>Paid features DO NOT affect scholarship eligibility</li>
                  <li>Paid features DO NOT influence scoring or ranking</li>
                  <li>Paid features DO NOT provide advantages in competitions</li>
                  <li>All participants compete on equal terms regardless of subscription status</li>
                </ul>
                <p className="text-purple-800 mt-3 mb-0">
                  Scholarships are awarded purely based on merit (knowledge and speed).
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disputes and Final Decisions</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>All decisions by Quizist.AI regarding competition results are final and binding</li>
                <li>Disputes must be submitted in writing to support@quizist.ai within 48 hours of competition end</li>
                <li>Quizist.AI will review disputes but is not obligated to change results</li>
                <li>No appeals process beyond initial dispute review</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Publicity</h2>
              <p className="text-gray-700 leading-relaxed">
                By participating, winners consent to the use of their name, school, and ranking on public 
                leaderboards and in promotional materials, unless prohibited by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modification and Cancellation</h2>
              <p className="text-gray-700 leading-relaxed">
                Quizist.AI reserves the right to modify, suspend, or cancel any competition at any time for any 
                reason, including but not limited to technical difficulties, fraud, or insufficient participation. 
                In the event of cancellation, participants will be notified and no prizes will be awarded.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                By participating, participants agree to release and hold harmless Quizist.AI from any and all 
                liability for injuries, losses, or damages of any kind arising from participation in competitions 
                or acceptance of prizes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Official Rules are governed by the laws of the Commonwealth of Virginia, without regard to 
                conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions about these Official Rules or specific competitions, contact:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">Email: support@quizist.ai</p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last Updated: January 1, 2025
              </p>
              <p className="text-sm text-gray-500 mt-2">
                By registering for a scholarship competition, you acknowledge that you have read, understood, 
                and agree to be bound by these Official Rules.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
