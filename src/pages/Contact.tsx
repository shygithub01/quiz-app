import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, MessageSquare, Shield, HelpCircle } from 'lucide-react';

export default function Contact() {
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
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
            <p className="text-gray-600 mb-8">We're here to help! Reach out to us for any questions or concerns.</p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* General Support */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">General Support</h2>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Questions about the platform, technical issues, or general inquiries
                  </p>
                  <a 
                    href="mailto:support@quizist.ai"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Mail className="h-4 w-4" />
                    support@quizist.ai
                  </a>
                </CardContent>
              </Card>

              {/* Privacy Inquiries */}
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Privacy & Data</h2>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Privacy concerns, data requests, or parental inquiries about student information
                  </p>
                  <a 
                    href="mailto:privacy@quizist.ai"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Mail className="h-4 w-4" />
                    privacy@quizist.ai
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Common Questions */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="h-8 w-8 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-900">Common Questions</h2>
              </div>

              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">How do I reset my password?</h3>
                  <p className="text-gray-700">
                    Quizist.AI uses Google Sign-In for authentication. To reset your password, visit your 
                    Google account settings.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Are scholarship competitions really free?</h3>
                  <p className="text-gray-700">
                    Yes! All scholarship competitions are 100% free to enter. No payment or purchase is ever 
                    required to participate or win.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">How do I delete my account?</h3>
                  <p className="text-gray-700">
                    To delete your account and all associated data, please email privacy@quizist.ai with your 
                    request. We will process deletions within 7 business days.
                  </p>
                </div>

                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">Can parents access their child's information?</h3>
                  <p className="text-gray-700">
                    Yes. Parents can request access to, correction of, or deletion of their child's information 
                    by emailing privacy@quizist.ai with verification of parental relationship.
                  </p>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">I found an error in a quiz question. What should I do?</h3>
                  <p className="text-gray-700">
                    Please report it to support@quizist.ai with the quiz ID and question number. We review all 
                    reports and make improvements based on user feedback.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-bold text-gray-900 mb-2">How are scholarship winners selected?</h3>
                  <p className="text-gray-700">
                    Winners are determined objectively by: (1) total correct answers, (2) time taken, and 
                    (3) submission time. See our{' '}
                    <button 
                      onClick={() => navigate('/scholarship-rules')}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Official Scholarship Rules
                    </button>
                    {' '}for complete details.
                  </p>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Response Time</h3>
              <p className="text-gray-700 mb-4">
                We strive to respond to all inquiries within 24-48 hours during business days (Monday-Friday). 
                Privacy-related requests are prioritized and typically processed within 7 business days.
              </p>
              <p className="text-gray-700">
                For urgent matters related to active scholarship competitions, please include "URGENT" in your 
                email subject line.
              </p>
            </div>

            {/* Business Information */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Business Information</h3>
              <div className="text-gray-700 space-y-2">
                <p><strong>Platform:</strong> Quizist.AI</p>
                <p><strong>Location:</strong> Henrico County, Virginia, USA</p>
                <p><strong>Email:</strong> support@quizist.ai</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
