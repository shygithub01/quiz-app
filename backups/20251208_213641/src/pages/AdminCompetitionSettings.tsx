import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  saveCompetitionSettings, 
  updateCompetitionSettings,
  getAllCompetitionSettings,
  isAdmin 
} from '../components/ui/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Save,
  Plus,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface CompetitionSettings {
  id?: string;
  name: string;
  date: string;
  time: string;
  dateTime: string;
  shortDate: string;
  prizePool: string;
  duration: string;
  questionCount: number;
  subjects: string;
  eligibleCounty: string;
  isActive: boolean;
  registrationOpen: boolean;
  registrationDeadline: string;
  // New detailed fields
  testOpenTime: string;
  testCloseTime: string;
  rules: string[];
  instructions: string[];
  eligibilityRequirements: string[];
  prizeBreakdown: string[];
  contactInfo: string;
  publishDetails: boolean;
  autoCloseRegistration: boolean;
}

export default function AdminCompetitionSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allSettings, setAllSettings] = useState<CompetitionSettings[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CompetitionSettings>({
    name: 'Henrico Merit Scholarship Competition',
    date: '2025-03-15',
    time: '10:00',
    dateTime: 'March 15, 2025 at 10:00 AM',
    shortDate: 'March 15',
    prizePool: '$300',
    duration: '60 minutes',
    questionCount: 50,
    subjects: 'Math, Science, English, Social Studies',
    eligibleCounty: 'henrico',
    isActive: true,
    registrationOpen: true,
    registrationDeadline: '2025-03-14',
    testOpenTime: '10:00',
    testCloseTime: '11:00',
    rules: [
      'Complete all questions within the time limit',
      'No external resources or help allowed',
      'Each question is worth equal points',
      'Ties are broken by completion time',
      'Must be a current student in eligible county'
    ],
    instructions: [
      'Sign in 15 minutes before test start time',
      'Ensure stable internet connection',
      'Use a computer or tablet (not phone)',
      'Find a quiet space without distractions',
      'Have scratch paper and pencil ready'
    ],
    eligibilityRequirements: [
      'Current student in Henrico County',
      'Grades 9-12 only',
      'Must have parent/guardian consent if under 18',
      'One attempt per student',
      'Must complete registration by deadline'
    ],
    prizeBreakdown: [
      '1st Place: $150 + Certificate',
      '2nd Place: $100 + Certificate', 
      '3rd Place: $50 + Certificate',
      'Top 10: Recognition certificates'
    ],
    contactInfo: 'For questions: scholarship@quizist.ai or call (555) 123-4567',
    publishDetails: true,
    autoCloseRegistration: true
  });

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      const adminStatus = await isAdmin(user.uid);
      if (!adminStatus) {
        navigate('/');
        return;
      }

      setIsAdminUser(true);
      await loadAllSettings();
      setLoading(false);
    };

    checkAdminAndLoad();
  }, [user, navigate]);

  const loadAllSettings = async () => {
    try {
      const settings = await getAllCompetitionSettings();
      setAllSettings(settings);
      
      // Load active settings into form
      const activeSettings = settings.find(s => s.isActive);
      if (activeSettings) {
        setFormData(activeSettings);
        setEditingId(activeSettings.id || null);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleInputChange = (field: keyof CompetitionSettings, value: string | number | boolean | string[]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate derived fields
      if (field === 'date' || field === 'time') {
        const date = field === 'date' ? value as string : prev.date;
        const time = field === 'time' ? value as string : prev.time;
        
        if (date && time) {
          const dateObj = new Date(`${date}T${time}`);
          updated.dateTime = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
          updated.shortDate = dateObj.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric' 
          });
          
          // Auto-set registration deadline to day before if not set
          if (!prev.registrationDeadline) {
            const deadlineDate = new Date(dateObj);
            deadlineDate.setDate(deadlineDate.getDate() - 1);
            updated.registrationDeadline = deadlineDate.toISOString().split('T')[0];
          }
          
          // Auto-close registration if date is in past and autoCloseRegistration is enabled
          if (updated.autoCloseRegistration) {
            const now = new Date();
            const regDeadline = new Date(updated.registrationDeadline);
            updated.registrationOpen = regDeadline > now;
          }
        }
      }
      
      return updated;
    });
  };

  const handleArrayChange = (field: keyof CompetitionSettings, index: number, value: string) => {
    setFormData(prev => {
      const array = [...(prev[field] as string[])];
      array[index] = value;
      return { ...prev, [field]: array };
    });
  };

  const addArrayItem = (field: keyof CompetitionSettings) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayItem = (field: keyof CompetitionSettings, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (editingId) {
        await updateCompetitionSettings(editingId, formData);
      } else {
        await saveCompetitionSettings(formData);
      }
      
      await loadAllSettings();
      alert('✅ Competition settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNewCompetition = () => {
    setFormData({
      name: 'New Competition',
      date: '',
      time: '10:00',
      dateTime: '',
      shortDate: '',
      prizePool: '$300',
      duration: '60 minutes',
      questionCount: 50,
      subjects: 'Math, Science, English, Social Studies',
      eligibleCounty: 'henrico',
      isActive: false,
      registrationOpen: true,
      registrationDeadline: '',
      testOpenTime: '10:00',
      testCloseTime: '11:00',
      rules: ['Complete all questions within the time limit'],
      instructions: ['Sign in 15 minutes before test start time'],
      eligibilityRequirements: ['Current student in eligible county'],
      prizeBreakdown: ['1st Place: $150', '2nd Place: $100', '3rd Place: $50'],
      contactInfo: 'For questions: scholarship@quizist.ai',
      publishDetails: false,
      autoCloseRegistration: true
    });
    setEditingId(null);
  };

  const handleEditCompetition = (settings: CompetitionSettings) => {
    setFormData(settings);
    setEditingId(settings.id || null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="h-10 w-10" />
            Competition Settings
          </h1>
          <p className="text-purple-200">Manage scholarship competition schedules and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Edit className="h-5 w-5" />
                {editingId ? 'Edit Competition' : 'Create New Competition'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Competition Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Prize Pool</label>
                    <input
                      type="text"
                      value={formData.prizePool}
                      onChange={(e) => handleInputChange('prizePool', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                      placeholder="$300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Duration</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                      placeholder="60 minutes"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Question Count</label>
                    <input
                      type="number"
                      value={formData.questionCount}
                      onChange={(e) => handleInputChange('questionCount', parseInt(e.target.value))}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Eligible County</label>
                    <select
                      value={formData.eligibleCounty}
                      onChange={(e) => handleInputChange('eligibleCounty', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                    >
                      <option value="henrico">Henrico County</option>
                      <option value="chesterfield">Chesterfield County</option>
                      <option value="richmond">Richmond City</option>
                      <option value="hanover">Hanover County</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Subjects</label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) => handleInputChange('subjects', e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                    placeholder="Math, Science, English, Social Studies"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Registration Deadline</label>
                  <input
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Test Opens At</label>
                    <input
                      type="time"
                      value={formData.testOpenTime}
                      onChange={(e) => handleInputChange('testOpenTime', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Test Closes At</label>
                    <input
                      type="time"
                      value={formData.testCloseTime}
                      onChange={(e) => handleInputChange('testCloseTime', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                    />
                  </div>
                </div>

                {/* Rules Section */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Competition Rules</label>
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => handleArrayChange('rules', index, e.target.value)}
                        className="flex-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                        placeholder="Enter rule..."
                      />
                      <Button
                        type="button"
                        onClick={() => removeArrayItem('rules', index)}
                        variant="outline"
                        size="sm"
                        className="border-red-400 text-red-300 hover:bg-red-500/20"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() => addArrayItem('rules')}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/70 hover:bg-white/10"
                  >
                    + Add Rule
                  </Button>
                </div>

                {/* Instructions Section */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Test Instructions</label>
                  {formData.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => handleArrayChange('instructions', index, e.target.value)}
                        className="flex-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm"
                        placeholder="Enter instruction..."
                      />
                      <Button
                        type="button"
                        onClick={() => removeArrayItem('instructions', index)}
                        variant="outline"
                        size="sm"
                        className="border-red-400 text-red-300 hover:bg-red-500/20"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() => addArrayItem('instructions')}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/70 hover:bg-white/10"
                  >
                    + Add Instruction
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Contact Information</label>
                  <textarea
                    value={formData.contactInfo}
                    onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white"
                    rows={2}
                    placeholder="Contact email, phone, or support information"
                  />
                </div>

                {/* Status Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Active Competition</span>
                    <button
                      onClick={() => handleInputChange('isActive', !formData.isActive)}
                      className="flex items-center gap-2"
                    >
                      {formData.isActive ? (
                        <ToggleRight className="h-6 w-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                      <span className="text-white">{formData.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Registration Open</span>
                    <button
                      onClick={() => handleInputChange('registrationOpen', !formData.registrationOpen)}
                      className="flex items-center gap-2"
                    >
                      {formData.registrationOpen ? (
                        <ToggleRight className="h-6 w-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                      <span className="text-white">{formData.registrationOpen ? 'Open' : 'Closed'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Publish Details to Students</span>
                    <button
                      onClick={() => handleInputChange('publishDetails', !formData.publishDetails)}
                      className="flex items-center gap-2"
                    >
                      {formData.publishDetails ? (
                        <ToggleRight className="h-6 w-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                      <span className="text-white">{formData.publishDetails ? 'Published' : 'Draft'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Auto-Close Registration</span>
                    <button
                      onClick={() => handleInputChange('autoCloseRegistration', !formData.autoCloseRegistration)}
                      className="flex items-center gap-2"
                    >
                      {formData.autoCloseRegistration ? (
                        <ToggleRight className="h-6 w-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                      <span className="text-white">{formData.autoCloseRegistration ? 'Auto' : 'Manual'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {formData.dateTime && (
                <div className="bg-green-500/20 rounded-lg p-4 border border-green-400/30">
                  <h4 className="text-green-100 font-medium mb-2">Preview:</h4>
                  <p className="text-green-200 text-sm">{formData.dateTime}</p>
                  <p className="text-green-200 text-sm">{formData.shortDate} • {formData.prizePool} • {formData.duration}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button
                  onClick={handleNewCompetition}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Competitions */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5" />
                All Competitions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allSettings.map((settings) => (
                  <div
                    key={settings.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      settings.isActive
                        ? 'bg-green-500/20 border-green-400/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => handleEditCompetition(settings)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{settings.name}</h4>
                      <div className="flex items-center gap-2">
                        {settings.isActive && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                            Active
                          </span>
                        )}
                        {settings.registrationOpen && (
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                            Open
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-white/70 text-sm">{settings.dateTime}</p>
                    <p className="text-white/60 text-xs">{settings.prizePool} • {settings.eligibleCounty}</p>
                  </div>
                ))}
                
                {allSettings.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    No competitions configured yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}