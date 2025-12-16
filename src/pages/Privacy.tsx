import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Privacy() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600 mb-8">Effective Date: January 1, 2025</p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Quizist.AI ("we," "our," or "us") is committed to protecting the privacy of our users, especially 
                students and minors. This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                information when you use our Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Name and email address</li>
                <li>Grade level and school name</li>
                <li>Birth year (for age verification)</li>
                <li>Parent or guardian email address (optional)</li>
                <li>County or geographic location (for scholarship eligibility)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Usage Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Quiz activity and performance data</li>
                <li>Competition participation and scores</li>
                <li>Time spent on quizzes</li>
                <li>Login and activity timestamps</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use collected information for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Platform functionality and user authentication</li>
                <li>Eligibility verification for scholarship competitions</li>
                <li>Fair competition enforcement and fraud prevention</li>
                <li>Communication with users and parents</li>
                <li>Platform improvement and analytics</li>
                <li>Compliance with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Children's Privacy (COPPA Compliance)</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-900 font-medium">
                  We take children's privacy seriously and comply with the Children's Online Privacy Protection Act (COPPA).
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Users Under 13</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>May use practice quiz features only</li>
                <li>Cannot participate in scholarship competitions</li>
                <li>Limited data collection (name, email, quiz activity only)</li>
                <li>Parent notification sent upon account creation</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Users 13 and Above</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>May participate in all Platform features</li>
                <li>Parent awareness recommended for minors</li>
                <li>Parent notification available upon request</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Parental Rights</h3>
              <p className="text-gray-700 leading-relaxed mb-2">Parents and guardians may:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Review their child's personal information</li>
                <li>Request correction or deletion of information</li>
                <li>Refuse further collection or use of information</li>
                <li>Contact us at privacy@quizist.ai</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or rent personal information. We may share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>With Parents:</strong> Upon request or as required for minors</li>
                <li><strong>Service Providers:</strong> Third parties who assist in Platform operations (e.g., hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                <li><strong>Competition Winners:</strong> Names may be publicly displayed on leaderboards</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational measures to protect personal information against 
                unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over 
                the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain personal information for as long as necessary to provide services, comply with legal 
                obligations, resolve disputes, and enforce agreements. Users may request account deletion at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent (where applicable)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar technologies to enhance user experience, analyze Platform usage, and 
                maintain user sessions. Users can control cookie preferences through browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Third-Party Links</h2>
              <p className="text-gray-700 leading-relaxed">
                The Platform may contain links to third-party websites. We are not responsible for the privacy 
                practices of these external sites. We encourage users to review privacy policies of any third-party 
                sites they visit.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy periodically. Changes will be posted on this page with an updated 
                effective date. Continued use of the Platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions, concerns, or requests regarding this Privacy Policy or your personal information, 
                please contact us at:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 font-medium">Privacy Inquiries:</p>
                <p className="text-gray-700">Email: privacy@quizist.ai</p>
                <p className="text-gray-700 mt-2 font-medium">General Support:</p>
                <p className="text-gray-700">Email: support@quizist.ai</p>
              </div>
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
