import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, Trophy, Brain, CheckCircle, DollarSign, Clock, BarChart } from 'lucide-react';

export default function Schools() {
  const [formData, setFormData] = useState({
    schoolName: '',
    contactName: '',
    email: '',
    phone: '',
    studentCount: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    alert('Thank you! We will contact you within 24 hours to schedule your demo.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6">
              AI-Powered Merit Scholarship System
              <br />
              <span className="text-purple-300">For Schools & Educational Institutions</span>
            </h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto mb-8">
              Transform how your school distributes scholarships with our fair, AI-generated competition platform. 
              Reward student knowledge with real financial incentives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-4 text-lg font-semibold">
                Schedule Free Demo
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-900 px-8 py-4 text-lg font-semibold">
                Download Brochure
              </Button>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Shield className="h-8 w-8 mx-auto mb-2 text-purple-300" />
              <div className="text-2xl font-bold">100%</div>
              <div className="text-purple-200">Fair & Unbiased</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Brain className="h-8 w-8 mx-auto mb-2 text-purple-300" />
              <div className="text-2xl font-bold">AI-Powered</div>
              <div className="text-purple-200">Question Generation</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Clock className="h-8 w-8 mx-auto mb-2 text-purple-300" />
              <div className="text-2xl font-bold">5 Minutes</div>
              <div className="text-purple-200">Setup Time</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-purple-300" />
              <div className="text-2xl font-bold">Real Prizes</div>
              <div className="text-purple-200">Student Motivation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem & Solution */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Traditional Scholarship Distribution is Broken
            </h2>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p>Subjective essay-based evaluations create bias</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p>Time-intensive application processes discourage students</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p>Limited transparency in selection criteria</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <p>Administrative burden on school staff</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Quizist.AI: Merit-Based Solution
            </h2>
            <div className="space-y-4 text-gray-600">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                <p>AI-generated questions eliminate human bias</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                <p>Students compete based purely on knowledge</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                <p>Transparent, real-time leaderboards</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                <p>Automated administration and prize distribution</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything Your School Needs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>AI Question Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Generate unlimited, fair questions across all subjects. No human bias, just pure academic assessment.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Role Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Complete admin panel with teacher, student, and administrator roles. Secure and scalable.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Trophy className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Competition Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Create, schedule, and manage scholarship competitions with automated prize distribution.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Track student performance, participation rates, and competition effectiveness.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Security & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">COPPA and FERPA compliant. Secure data handling with enterprise-grade protection.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Flexible Funding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">School-funded or sponsor-funded prizes. Multiple revenue models to fit your budget.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Simple, Transparent Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Small School</CardTitle>
                <div className="text-3xl font-bold text-purple-600">$999</div>
                <div className="text-gray-600">per year</div>
                <div className="text-sm text-gray-500">300-800 students</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Unlimited competitions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    AI question generation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Basic analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Email support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Medium School</CardTitle>
                <div className="text-3xl font-bold text-purple-600">$2,499</div>
                <div className="text-gray-600">per year</div>
                <div className="text-sm text-gray-500">800-1500 students</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Everything in Small School
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Custom branding
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Large School/District</CardTitle>
                <div className="text-3xl font-bold text-purple-600">Custom</div>
                <div className="text-gray-600">pricing</div>
                <div className="text-sm text-gray-500">1500+ students</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Everything in Medium School
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Multi-school management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    API integration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Dedicated support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Scholarship Program?
            </h2>
            <p className="text-xl text-gray-600">
              Schedule a free demo and see how Quizist.AI can benefit your students.
            </p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School/Institution Name *
                    </label>
                    <input
                      type="text"
                      name="schoolName"
                      value={formData.schoolName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Students
                  </label>
                  <select
                    name="studentCount"
                    value={formData.studentCount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select range</option>
                    <option value="under-300">Under 300</option>
                    <option value="300-800">300-800</option>
                    <option value="800-1500">800-1500</option>
                    <option value="1500-3000">1500-3000</option>
                    <option value="over-3000">Over 3000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Tell us about your scholarship program goals..."
                  />
                </div>

                <div className="text-center">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 px-8 py-3 text-lg font-semibold">
                    Schedule Free Demo
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}