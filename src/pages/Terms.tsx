import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Terms() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-600 mb-8">Effective Date: January 1, 2025</p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using Quizist.AI ("the Platform"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Platform Purpose</h2>
              <p className="text-gray-700 leading-relaxed">
                Quizist.AI is an educational platform providing AI-generated quizzes and skill-based academic competitions. 
                The Platform is designed to support learning and provide merit-based scholarship opportunities. 
                No academic outcome or scholarship award is guaranteed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Users must provide accurate information when creating an account. Scholarship competitions may impose 
                specific eligibility requirements including age, grade level, or geographic location.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Users under 13 years of age may use practice features but are not eligible to participate in 
                scholarship competitions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Accounts</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Each user may maintain only one account</li>
                <li>Account sharing is prohibited</li>
                <li>Impersonation of another person is prohibited</li>
                <li>Violations may result in account suspension or termination</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Scholarship Competitions</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Participation is free of charge</li>
                <li>Each participant is allowed one attempt per competition</li>
                <li>Winners are determined by score and time according to Official Scholarship Rules</li>
                <li>Quizist.AI reserves the right to disqualify participants for rule violations</li>
                <li>All decisions regarding competition results are final</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. AI-Generated Content</h2>
              <p className="text-gray-700 leading-relaxed">
                Quiz content is generated using artificial intelligence and is provided "as is" without warranties 
                of any kind. Quizist.AI does not guarantee the accuracy, completeness, or reliability of AI-generated 
                content. Users should verify information independently for critical applications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. No Guarantee of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Quizist.AI is not responsible for service interruptions caused by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Internet connectivity issues</li>
                <li>Device failures or compatibility problems</li>
                <li>Power outages</li>
                <li>External technical interruptions</li>
                <li>Scheduled or emergency maintenance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, Quizist.AI shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred 
                directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Prohibited Conduct</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Users agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Use bots, scripts, or automated tools</li>
                <li>Attempt to gain unauthorized access to the Platform</li>
                <li>Share competition questions or answers</li>
                <li>Create multiple accounts</li>
                <li>Interfere with other users' experience</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                Quizist.AI reserves the right to modify these Terms of Service at any time. Changes will be effective 
                immediately upon posting. Continued use of the Platform after changes constitutes acceptance of the 
                modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                Quizist.AI may terminate or suspend your account at any time, with or without notice, for conduct 
                that violates these Terms or is harmful to other users, Quizist.AI, or third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the Commonwealth of 
                Virginia, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-gray-700 font-medium mt-2">
                Email: support@quizist.ai
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last Updated: January 1, 2025
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
