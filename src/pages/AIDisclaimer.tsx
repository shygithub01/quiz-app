import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, AlertTriangle } from 'lucide-react';

export default function AIDisclaimer() {
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
              <Brain className="h-10 w-10 text-purple-500" />
              <h1 className="text-3xl font-bold text-gray-900 mb-0">AI Content Disclaimer</h1>
            </div>
            <p className="text-gray-600 mb-8">Understanding AI-Generated Quiz Content</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-yellow-900 mb-2">Important Notice</h3>
                  <p className="text-yellow-800 mb-0">
                    Quizist.AI uses artificial intelligence (AI) to generate quiz content. While we strive for 
                    accuracy, AI-generated material may contain errors or inaccuracies. Users should verify 
                    information independently for critical applications.
                  </p>
                </div>
              </div>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What is AI-Generated Content?</h2>
              <p className="text-gray-700 leading-relaxed">
                Quizist.AI utilizes advanced artificial intelligence models, specifically OpenAI's GPT-4, to 
                automatically generate quiz questions, answer options, and explanations based on user-provided 
                topics or documents. This technology enables rapid creation of educational content across a wide 
                range of subjects.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Limitations of AI-Generated Content</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Potential Inaccuracies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                AI-generated content may contain:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Factual errors or outdated information</li>
                <li>Misinterpretations of source material</li>
                <li>Ambiguous or unclear phrasing</li>
                <li>Incorrect answer designations</li>
                <li>Biased or incomplete perspectives</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Subject Matter Limitations</h3>
              <p className="text-gray-700 leading-relaxed">
                AI models have knowledge cutoff dates and may not reflect the most current information in rapidly 
                evolving fields. Additionally, AI may struggle with highly specialized or technical subjects.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Context Understanding</h3>
              <p className="text-gray-700 leading-relaxed">
                While advanced, AI may not fully understand nuanced context, cultural references, or domain-specific 
                terminology, potentially leading to inappropriate or irrelevant questions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Educational Purpose Only</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Quizist.AI content is intended for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Educational practice and learning</strong> - Self-assessment and skill development</li>
                <li><strong>Study preparation</strong> - Supplementary material for exam preparation</li>
                <li><strong>Knowledge testing</strong> - Informal evaluation of understanding</li>
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-red-900 font-semibold mb-2">Not Suitable For:</p>
                <ul className="list-disc pl-6 text-red-800 space-y-1">
                  <li>Official academic assessments or grading</li>
                  <li>Professional certification or licensing exams</li>
                  <li>Medical, legal, or financial advice</li>
                  <li>Safety-critical applications</li>
                  <li>Sole source of learning material</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By using Quizist.AI, users acknowledge and agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Verify information from authoritative sources when accuracy is critical</li>
                <li>Use AI-generated content as supplementary material, not primary learning resources</li>
                <li>Exercise critical thinking when reviewing quiz content</li>
                <li>Report obvious errors or inappropriate content to support@quizist.ai</li>
                <li>Not rely solely on Quizist.AI for exam preparation or academic success</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Quality Assurance Efforts</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                While we cannot guarantee 100% accuracy, Quizist.AI implements several quality measures:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Use of advanced AI models (GPT-4) with high accuracy rates</li>
                <li>Prompt engineering to improve question quality</li>
                <li>User feedback mechanisms to identify and address issues</li>
                <li>Continuous monitoring and improvement of AI outputs</li>
                <li>Subject-specific templates for better context</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Scholarship Competitions</h2>
              <p className="text-gray-700 leading-relaxed">
                For scholarship competitions, quiz questions are:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Generated using consistent AI parameters for fairness</li>
                <li>Reviewed for obvious errors before competition launch</li>
                <li>Applied equally to all participants</li>
                <li>Subject to dispute review if significant errors are identified</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, minor inaccuracies or ambiguities may still occur. All participants face the same 
                questions under the same conditions, ensuring fair competition.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Reporting Issues</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you encounter content that appears to be:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Factually incorrect</li>
                <li>Inappropriate or offensive</li>
                <li>Unclear or ambiguous</li>
                <li>Technically flawed</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Please report it to: <strong>support@quizist.ai</strong>
              </p>
              <p className="text-gray-700 leading-relaxed">
                Include the quiz ID, question number, and description of the issue. We review all reports and 
                make improvements based on user feedback.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. No Warranties</h2>
              <p className="text-gray-700 leading-relaxed">
                AI-generated content is provided "AS IS" without warranties of any kind, either express or implied, 
                including but not limited to warranties of accuracy, completeness, reliability, or fitness for a 
                particular purpose.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                Quizist.AI shall not be liable for any damages arising from:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Inaccurate or misleading AI-generated content</li>
                <li>Reliance on quiz content for academic or professional purposes</li>
                <li>Decisions made based on quiz results</li>
                <li>Any other use of AI-generated material</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Future Improvements</h2>
              <p className="text-gray-700 leading-relaxed">
                We are committed to continuously improving our AI-generated content through:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Upgrading to newer AI models as they become available</li>
                <li>Refining prompts and generation parameters</li>
                <li>Incorporating user feedback</li>
                <li>Implementing additional quality checks</li>
                <li>Expanding subject matter expertise</li>
              </ul>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Summary</h3>
                <p className="text-blue-800 mb-0">
                  Quizist.AI uses AI to create educational quiz content quickly and efficiently. While we strive 
                  for quality, users should treat this content as supplementary learning material and verify 
                  critical information from authoritative sources. By using our Platform, you acknowledge these 
                  limitations and agree to use AI-generated content responsibly.
                </p>
              </div>
            </div>

            <div className="mt-8">
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
