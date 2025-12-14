# Quizist.AI - Complete Feature Documentation
**Version: Gold-V3**  
**Last Updated: December 2024**

---

## 📋 Table of Contents
1. [Platform Overview](#platform-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Public Pages](#public-pages)
4. [Student Features](#student-features)
5. [Admin Features](#admin-features)
6. [Technical Features](#technical-features)

---

## 🎯 Platform Overview

Quizist.AI is an AI-powered quiz generation and scholarship competition platform that serves three main purposes:

1. **Quiz Generator** - Transform documents or topics into intelligent quizzes
2. **Scholarship Competitions** - Merit-based competitions with real cash prizes
3. **Practice Sessions** - Unlimited practice attempts to improve skills

### Core Technologies
- **Frontend**: React + TypeScript + Vite
- **Backend**: Firebase (Firestore, Authentication, Functions, Hosting)
- **AI**: OpenAI GPT-4 for quiz generation
- **UI**: Tailwind CSS + shadcn/ui components

---

## 👥 User Roles & Permissions

### Role Hierarchy
1. **Super Admin** - Full system access, can manage all users and roles
2. **Admin** - Can manage competitions, templates, and reset attempts
3. **Teacher** - Can create competitions and view analytics
4. **Student** - Can participate in competitions and generate quizzes

### Authentication
- Google Sign-In (OAuth 2.0)
- Email-based user identification
- Role-based access control (RBAC)
- Session management via Firebase Auth

---

## 🌐 Public Pages

### 1. Home Page (`/`)
**Purpose**: Landing page showcasing platform features

**Features**:
- Hero section with animated background
- Featured scholarship competition banner
  - Shows competition title, prize pool, date, participant count
  - Displays "Coming Soon" if no active competition
  - Auto-hides expired competitions
- Two main paths:
  - **Try Quiz Generator**: For document/topic-based quiz creation
  - **For Students**: For scholarship competitions
- Feature showcase cards:
  - Document to Quiz (PDF, DOCX, TXT support)
  - Topic-Based Quizzes (multiple difficulty levels)
  - Merit Scholarships (cash prizes, fair competition)
- Call-to-action buttons with Google Sign-In integration

**User Experience**:
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Context-aware CTAs (different for signed-in vs guest users)

---

### 2. Scholarship Home (`/scholarship`)
**Purpose**: Dedicated landing page for scholarship program

**Features**:
- Competition countdown timer
- Prize breakdown (1st: $150, 2nd: $100, 3rd: $50)
- Registration status display
- Competition details section (only shown when competition exists)
- Student testimonials
- Expansion preview (upcoming counties)
- Location-based eligibility (Henrico County, VA)

**Registration States**:
- **Not Registered**: Shows "Register for Scholarship FREE" button
- **Registered**: Shows "You're Registered!" with competition access
- **No Competition**: Shows "Competition Coming Soon" message
- **Competition Ended**: Shows "Practice Now" button

**Dynamic Content**:
- Real-time countdown to competition start
- Participant count updates
- Competition status (upcoming/active/completed)

---

## 🎓 Student Features

### 3. Quiz Generator (`/quiz-generator`)
**Purpose**: AI-powered quiz creation from documents or topics

**Input Methods**:
1. **Document Upload**
   - Supported formats: PDF, DOCX, TXT
   - File size limit: 10MB
   - Text extraction and processing
   
2. **Topic Input**
   - Free-text topic entry
   - Subject selection
   - Difficulty level selection (Easy, Medium, Hard)

**Quiz Settings**:
- Number of questions (5-20)
- Question types: Multiple choice
- Difficulty levels: Easy, Medium, Hard
- Subject categories: Math, Science, History, English, etc.

**Quiz Generation Process**:
1. User uploads document or enters topic
2. AI analyzes content/topic
3. Generates questions with 4 options each
4. Provides correct answers and explanations
5. Displays quiz for immediate taking

**Quiz Taking Experience**:
- One question at a time
- Progress indicator
- Answer selection with visual feedback
- Submit button with confirmation
- Instant results with score
- Detailed explanations for each question
- Review mode showing correct/incorrect answers

---

### 4. Competitions Page (`/competitions`)
**Purpose**: Browse and join scholarship competitions

**Features**:
- Competition listing with cards
- Filter tabs: All, Active, Upcoming, Completed
- Competition types:
  - **Scholarship Competitions** (🏆): One attempt only, cash prizes
  - **Practice Sessions** (📚): Unlimited attempts, no prizes

**Competition Card Information**:
- Title and description
- Status badge (Upcoming/Active/Completed)
- Prize pool (scholarship only)
- Participant count (with marketing boost)
- Date range
- Action buttons:
  - **Join Competition** (scholarship, not participated)
  - **Already Participated** (scholarship, participated)
  - **Start Practice** (practice, active)
  - **Practice Ended** (practice, completed)
  - **View Details** (always available)
  - **Leaderboard** (always available)

**Button Logic**:
- **Scholarship Competitions**: One-time participation enforced
- **Practice Competitions**: Unlimited attempts allowed
- Status-based button states (active/upcoming/completed)
- Disabled states with clear messaging

---

### 5. Competition Details (`/competitions/:id`)
**Purpose**: Detailed view of a specific competition

**Information Displayed**:
- Competition title and status
- Type indicator (Scholarship/Practice)
- Start and end dates
- Participant count
- Prize pool and breakdown
- Rules and regulations
- Subject coverage
- Duration

**Action Buttons**:
- **Start Competition** (if active and not participated)
- **Take Another Practice Attempt** (practice only)
- **View Progress** (practice only, scrolls to history)
- Status buttons (Upcoming/Completed/Already Participated)

**Practice History Section** (Practice competitions only):
- List of all previous attempts
- Score for each attempt (X/Y format with percentage)
- Time spent on each attempt
- Completion timestamp
- Visual indicators for perfect scores
- Attempt numbering (most recent first)

**Admin Controls** (Admin users only):
- Manage Participants button
- Edit Competition button
- Reset My Attempt button

---

### 6. Competition Quiz (`/competitions/:id/quiz`)
**Purpose**: Take the actual competition quiz

**Features**:
- **Timer Display**:
  - Shows time remaining (if duration set)
  - Shows time elapsed (if no duration)
  - Color-coded warnings:
    - Green: Normal time
    - Yellow: Last 5 minutes
    - Red: Last minute (pulsing)
  - Auto-submit when time expires

**Quiz Interface**:
- One question at a time
- Question counter (X of Y)
- Multiple choice options (4 per question)
- Answer selection with visual feedback
- Navigation buttons (Previous/Next)
- Progress bar showing answered questions

**Question Navigation Grid**:
- Visual grid of all questions
- Color coding:
  - Blue: Current question
  - Green: Answered questions
  - Gray: Unanswered questions
- Click to jump to any question
- Checkmark icons on answered questions

**Submission**:
- Warning if unanswered questions exist
- Confirmation dialog
- Auto-submit on time expiration
- Loading state during submission

**Results Screen**:
- Final score display (X/Y)
- Percentage calculation
- Time spent
- Congratulatory message based on score
- Full answer review:
  - Each question with user's answer
  - Correct answer highlighted in green
  - Incorrect answer highlighted in red
  - Explanations for each question
- Action buttons:
  - **Practice Again** (practice competitions)
  - **View Leaderboard** (scholarship competitions)
  - **Browse Competitions**

**Practice vs Scholarship Differences**:
- Practice: Can retake unlimited times
- Scholarship: One attempt only, enforced at multiple levels
- Practice: Shows "Practice Session" banner
- Scholarship: Shows "One Attempt Only" warning

---

### 7. Competition Leaderboard (`/competitions/:id/leaderboard`)
**Purpose**: View rankings and scores

**Features**:
- Ranked list of participants
- Score display (X/Y format)
- Time spent for each participant
- User's own rank highlighted
- Top 3 special styling (gold, silver, bronze)
- Real-time updates
- Participant names and schools

---

### 8. Scholarship Registration (`/scholarship/register`)
**Purpose**: Register for scholarship competitions

**Registration Form**:
- County selection (Henrico only currently)
- Grade level (9th-12th)
- School selection (dropdown of local schools)
- Birth year
- Parent email (optional)
- Terms and conditions checkbox
- Marketing consent checkbox

**Validation**:
- All required fields must be filled
- Birth year must be reasonable (2005-2012)
- Email format validation
- Terms must be accepted

**Post-Registration**:
- Confirmation message
- Redirect to competitions page
- Registration status saved to Firestore
- User can update registration anytime

---

## 🔧 Admin Features

### 9. User Management (`/admin/users`)
**Purpose**: Manage all platform users (Super Admin only)

**Features**:
- **User Statistics Dashboard**:
  - Total users count
  - Super admins count
  - Admins count
  - Teachers count

**Search and Filters**:
- **Smart Search Bar**:
  - Context-sensitive word-boundary search
  - Searches display names at word starts
  - Searches email local parts at segment starts
  - Example: "L" matches "Lucy" but not "gmail"
- **Role Filter**: All Roles, Super Admin, Admin, Teacher, Student
- **Status Filter**: All Status, Active, Disabled
- **Results Counter**: Shows filtered vs total users
- **Pagination**: 50 users per page with page numbers

**User List Display**:
- Role icon (Crown/Shield/GraduationCap/Users)
- Display name with "(You)" indicator for current user
- Status badge (Active/Disabled)
- Email address with edit icon
- Role badge with color coding
- Last activity timestamp

**User Actions** (per user):
1. **View Details**: Navigate to user details page
2. **Change Role**: Dropdown to change user role
   - Student → Teacher → Admin → Super Admin
   - Confirmation dialog required
3. **Enable/Disable**: Toggle user account status
   - Disabled users cannot sign in
   - Confirmation dialog required
4. **Edit Email**: Click mail icon to update email
   - Prompt dialog with validation
   - Email format validation
   - Confirmation dialog required

**Restrictions**:
- Cannot modify own account
- Only Super Admins can access this page
- Role changes require confirmation
- Email changes require validation

**Role Hierarchy Info**:
- Super Admin: Full access, can manage all users and roles
- Admin: Can manage competitions, templates, and reset attempts
- Teacher: Can create competitions and view analytics
- Student: Can participate in competitions

---

### 10. User Details (`/admin/users/:userId`)
**Purpose**: Detailed view of individual user activity

**User Information**:
- Display name and email
- Role and status
- Account creation date
- Last login timestamp
- Last activity timestamp

**Activity Tracking**:
- **Scholarship Competition History**:
  - Competition name
  - Score achieved
  - Time spent
  - Completion date
  - Rank achieved
- **Practice Session History**:
  - Practice test name
  - Number of attempts
  - Best score
  - Average score
  - Total time spent
  - Improvement trend

**Statistics**:
- Total competitions participated
- Average score across all competitions
- Total time spent on platform
- Scholarship competitions vs practice sessions
- Win rate and rankings

**Admin Actions**:
- Reset user's competition attempts
- Change user role
- Enable/disable account
- View detailed attempt logs

---

### 11. Competition Settings (`/admin/competition-settings`)
**Purpose**: Manage competition configuration

**Features**:
- Set featured competition
- Configure competition visibility
- Manage competition status
- Set prize pools
- Configure eligibility rules

---

### 12. Create Competition (`/admin/create-competition`)
**Purpose**: Create new competitions

**Competition Form**:
- **Basic Information**:
  - Title
  - Description
  - Start date and time
  - End date and time
  
- **Competition Type**:
  - 🏆 Scholarship Competition (One Attempt)
  - 📚 Practice Session (Multiple Attempts)
  
- **Quiz Template Selection**:
  - Dropdown of available templates
  - Shows question count for each template
  - Link to create new template if none exist
  
- **Status**:
  - Upcoming
  - Active
  - Completed
  
- **Rules** (one per line):
  - Competition guidelines
  - Eligibility requirements
  - Conduct rules
  
- **Prizes** (scholarship only, one per line):
  - 1st place prize
  - 2nd place prize
  - 3rd place prize
  - Additional prizes

**Validation**:
- All required fields must be filled
- End date must be after start date
- Must select a quiz template
- Rules and prizes properly formatted

---

### 13. Quiz Templates (`/admin/quiz-templates`)
**Purpose**: Create reusable quiz question sets

**Creation Methods**:

**1. AI-Assisted Generation** (Recommended):
- **Subject Distribution**:
  - English (Grades 9-12)
  - Mathematics (Algebra II, Geometry, Pre-Calc)
  - Science (Biology, Chemistry, Physics)
  - Social Studies (History, Government)
  - Health & Wellness (Grades 9-10)
- **Total Questions Calculator**: Shows sum of all subjects
- **Difficulty Selection**: Easy, Medium, Hard
- **Generate Button**: Creates all questions at once
- **Generation Time**: 30-60 seconds
- **Review and Edit**: Can modify generated questions before saving

**2. Manual Creation**:
- Add questions one by one
- For each question:
  - Question text
  - 4 answer options
  - Correct answer selection
  - Explanation (optional)
- Add/Remove question buttons
- Reorder questions

**Template Information**:
- Template title
- Subject
- Difficulty level
- Total question count

**Question Format**:
- Multiple choice (4 options)
- One correct answer
- Optional explanation
- Numbered sequentially

**Validation**:
- All questions must have text
- All options must be filled
- Correct answer must be one of the options
- Template must have title and subject

---

### 14. Edit Competition (`/admin/competitions/:id/edit`)
**Purpose**: Modify existing competitions

**Editable Fields**:
- Title and description
- Start and end dates
- Status (upcoming/active/completed)
- Rules and prizes
- Quiz template (can swap)

**Restrictions**:
- Cannot edit active competitions with participants
- Cannot change competition type (scholarship/practice)
- Confirmation required for major changes

---

### 15. Manage Participants (`/admin/competitions/:id/participants`)
**Purpose**: View and manage competition participants

**Participant List**:
- Name and email
- Registration date
- Completion status
- Score (if completed)
- Time spent
- Rank

**Admin Actions**:
- Reset individual participant attempts
- Disqualify participants
- Export participant data
- View detailed attempt logs

---

### 16. Debug Competition (`/admin/debug-competition`)
**Purpose**: Troubleshoot competition issues

**Debug Tools**:
- View competition data structure
- Check quiz template integrity
- Verify participant records
- Test competition flow
- View error logs

---

### 17. Restore Data (`/admin/restore`)
**Purpose**: Restore backed-up data

**Features**:
- Upload backup files
- Preview restore data
- Selective restore (users/competitions/templates)
- Backup history
- Rollback capability

---

## 🔐 Technical Features

### Authentication & Authorization
- **Google OAuth 2.0**: Secure sign-in
- **Firebase Authentication**: Session management
- **Role-Based Access Control**: Enforced at multiple levels
- **Protected Routes**: Client-side and server-side validation

### Database (Firestore)
**Collections**:
- `users`: User profiles and roles
- `competitions`: Competition definitions
- `quizTemplates`: Reusable question sets
- `leaderboard`: Competition scores (scholarship)
- `practiceAttempts`: Practice session attempts
- `scholarshipRegistrations`: Student registration data
- `competitionSettings`: Platform configuration

**Security Rules**:
- Read/write permissions based on user roles
- Validation rules for data integrity
- Rate limiting for API calls

### Cloud Functions
- `generateCompetitionTemplate`: AI quiz generation
- `submitCompetitionAttempt`: Score submission and validation
- `resetUserAttempt`: Admin attempt reset
- `setUserRole`: Role management
- `setUserStatus`: Account enable/disable

### AI Integration
- **OpenAI GPT-4**: Question generation
- **Prompt Engineering**: Subject-specific templates
- **Quality Control**: Answer validation
- **Difficulty Calibration**: Adaptive question difficulty

### Performance Optimizations
- **Code Splitting**: Lazy loading of routes
- **Image Optimization**: Compressed assets
- **Caching**: Firebase caching strategies
- **Bundle Size**: Optimized build output

### Analytics & Monitoring
- **User Activity Tracking**: Login, quiz attempts, competition participation
- **Error Logging**: Client and server-side errors
- **Performance Metrics**: Page load times, API response times
- **Usage Statistics**: Daily active users, competition participation rates

---

## 📊 Key Metrics & Features

### Participant Count Boosting
- **Practice Tests**: +100 to actual count (marketing boost)
- **Scholarship Competitions**: +25 to actual count (marketing boost)
- **Actual Count Calculation**:
  - Practice: Unique users from `practiceAttempts` collection
  - Scholarship: `participantCount` field from competition document

### Competition Status Logic
- **Upcoming**: Start date in future
- **Active**: Between start and end dates
- **Completed**: End date in past
- **Auto-hide**: Expired featured competitions don't show on home page

### Search Algorithm (User Management)
- **Word Boundary Matching**: Searches at start of words in names
- **Email Segment Matching**: Searches at start of email parts (before @)
- **Example**: "L" matches "Lucy Mohapatra" but not "gmail.com"
- **Case Insensitive**: All searches are lowercase
- **Real-time**: Filters as you type

### Timer System (Competition Quiz)
- **Duration Parsing**: Supports "X minutes" or "X hours" format
- **Countdown Display**: Shows remaining time
- **Color Warnings**:
  - Normal: White background
  - 5 minutes left: Yellow background
  - 1 minute left: Red background with pulse animation
- **Auto-Submit**: Automatically submits when time expires
- **Grace Period**: 1.5 second delay before auto-submit to show expired state

---

## 🎨 UI/UX Features

### Design System
- **Color Palette**: Purple/Indigo gradient theme
- **Typography**: System fonts with fallbacks
- **Spacing**: Consistent 4px grid system
- **Animations**: Smooth transitions and hover effects

### Responsive Design
- **Mobile**: Optimized for phones (320px+)
- **Tablet**: Optimized for tablets (768px+)
- **Desktop**: Optimized for desktops (1024px+)
- **Touch-Friendly**: Large tap targets on mobile

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus states

### Loading States
- **Spinners**: For async operations
- **Skeleton Screens**: For content loading
- **Progress Bars**: For multi-step processes
- **Disabled States**: Clear visual feedback

### Error Handling
- **User-Friendly Messages**: Clear error descriptions
- **Retry Mechanisms**: Automatic retry for failed requests
- **Fallback UI**: Graceful degradation
- **Error Boundaries**: Catch React errors

---

## 🚀 Deployment & Infrastructure

### Hosting
- **Firebase Hosting**: Static site hosting
- **CDN**: Global content delivery
- **SSL**: Automatic HTTPS
- **Custom Domain**: Support for custom domains

### Build Process
- **Vite**: Fast build tool
- **TypeScript**: Type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Environment Variables
- **Firebase Config**: API keys and project IDs
- **OpenAI API Key**: For AI generation
- **Feature Flags**: Enable/disable features

### Monitoring
- **Firebase Analytics**: User behavior tracking
- **Error Reporting**: Crash and error logs
- **Performance Monitoring**: Page load and API metrics

---

## 📝 Future Enhancements

### Planned Features
1. **Geographic Expansion**: Chesterfield County, Richmond Metro, Statewide VA
2. **Subject-Specific Competitions**: Math-only, Science-only, etc.
3. **Team Competitions**: School vs school
4. **Leaderboard Seasons**: Monthly/quarterly rankings
5. **Achievement Badges**: Gamification elements
6. **Parent Dashboard**: Track student progress
7. **Teacher Tools**: Create custom quizzes for classes
8. **Mobile App**: Native iOS and Android apps

### Technical Improvements
1. **Real-time Leaderboard**: WebSocket updates
2. **Advanced Analytics**: Detailed performance insights
3. **AI Improvements**: Better question quality
4. **Offline Support**: Progressive Web App features
5. **Multi-language Support**: Spanish, etc.

---

## 📞 Support & Contact

### For Students
- Email: support@quizist.ai
- Help Center: /help
- FAQ: /faq

### For Schools
- Email: schools@quizist.ai
- Partnership Inquiries: /partnerships

### For Developers
- GitHub: github.com/quizist-ai
- API Docs: /api-docs
- Developer Portal: /developers

---

**Document Version**: Gold-V3  
**Last Updated**: December 13, 2024  
**Platform Status**: Production Ready  
**Active Users**: Growing  
**Active Competitions**: Henrico County Scholarship Program
