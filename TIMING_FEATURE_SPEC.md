# Quiz Timing Feature Implementation Specification

## Overview
Add a live timer to track how long users take to complete quizzes. Display the timer during the quiz and save the completion time to Firestore.

## Current Working State
- Tag: `BEFORE_NEW_ENHANCEMENTS`
- All quiz features working (generation, history, retakes, results)
- No timing functionality exists

## Requirements

### 1. Live Timer Display
- Show a timer in MM:SS format during quiz
- Timer starts when quiz begins
- Timer updates every second
- Display in top-right corner of question card
- Format: "0:00" → "0:01" → "1:00" etc.

### 2. Time Tracking
- Record start time when quiz begins
- Calculate total time when quiz completes
- Save time in seconds to Firestore

### 3. Time Display
- Show completion time in results screen
- Show time in Past Quizzes history
- Format: "Time: M:SS" (e.g., "Time: 2:34")

## Files to Modify

### File 1: `src/components/ui/firebase.ts`

**Location**: Interface definition (around line 105)

**Change**: Add `timeSpent` field to QuizAttempt interface

```typescript
interface QuizAttempt {
  id?: string;
  userId: string;
  quizTemplateId: string;
  userAnswers: string[];
  score: number | null;
  completedAt: Timestamp | null;
  startedAt: Timestamp;
  timeSpent?: number; // ADD THIS LINE - time in seconds
}
```

**Location**: getUserAttempts function (around line 165-180)

**Change**: Return timeSpent in the attempts array

```typescript
attempts.push({
  id: attemptDoc.id,
  title: template?.title || 'Unknown Quiz',
  type: template?.type || 'unknown',
  questionCount: template?.questions?.length || 0,
  score: attemptData.score,
  userAnswers: attemptData.userAnswers || [],
  completedAt: attemptData.completedAt?.toDate ? attemptData.completedAt.toDate().toISOString() : attemptData.completedAt,
  startedAt: attemptData.startedAt?.toDate ? attemptData.startedAt.toDate().toISOString() : attemptData.startedAt,
  settings: template?.settings || {},
  questions: template?.questions || [],
  quizTemplateId: attemptData.quizTemplateId,
  timeSpent: attemptData.timeSpent // ADD THIS LINE
});
```

---

### File 2: `src/components/api/index.ts`

**Location**: updateQuizCompletion function (around line 249)

**Change**: Accept and save timeSpent parameter

```typescript
export const updateQuizCompletion = async (
  userId: string, 
  attemptId: string, 
  completionData: {
    answers: string[];
    score: number;
    completedAt: string;
    timeSpent?: number; // ADD THIS LINE
  }
) => {
  try {
    await updateAttempt(userId, attemptId, {
      userAnswers: completionData.answers,
      score: completionData.score,
      completedAt: Timestamp.fromDate(new Date(completionData.completedAt)),
      timeSpent: completionData.timeSpent // ADD THIS LINE
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating quiz completion:', error);
    throw error;
  }
};
```

---

### File 3: `src/pages/Home.tsx`

**Location 1**: QuizState interface (around line 37)

**Change**: Add timing fields

```typescript
interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: string[];
  score: number;
  showResults: boolean;
  quizId?: string;
  attemptId?: string;
  isReviewMode?: boolean;
  startTime?: number; // ADD THIS - timestamp when quiz started
  currentTime?: number; // ADD THIS - current timestamp for live timer
}
```

**Location 2**: State declarations (around line 75)

**Change**: Add timer effect after state declarations

```typescript
const [recentQuizzes, setRecentQuizzes] = useState<QuizHistoryItem[]>([]);

// ADD THIS ENTIRE BLOCK:
// Timer effect - updates every second when quiz is active
useEffect(() => {
  if (quizState.startTime && !quizState.showResults && quizState.questions.length > 0) {
    const interval = setInterval(() => {
      setQuizState(prev => ({ ...prev, currentTime: Date.now() }));
    }, 1000);
    return () => clearInterval(interval);
  }
}, [quizState.startTime, quizState.showResults, quizState.questions.length]);
```

**Location 3**: Quiz generation success handler (around line 150)

**Change**: Set startTime when quiz begins

```typescript
if (response.success && response.quiz) {
  const startTime = Date.now(); // ADD THIS LINE
  setQuizState({
    ...initialQuizState,
    questions: response.quiz,
    quizId: response.quizId,
    attemptId: response.attemptId,
    startTime, // ADD THIS LINE
    currentTime: startTime // ADD THIS LINE
  });
```

**Location 4**: Answer submission handler (around line 185)

**Change**: Calculate and save timeSpent on completion

FIND THIS CODE:
```typescript
const newState = {
  ...prev,
  userAnswers: newAnswers,
  currentQuestionIndex: isLastQuestion ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
  score: newScore,
  showResults: isLastQuestion
};

// Save completion when quiz finishes
if (isLastQuestion && user?.uid && prev.attemptId) {
  updateQuizCompletion(user.uid, prev.attemptId, {
    answers: newAnswers,
    score: newScore,
    completedAt: new Date().toISOString()
  }).catch(error => {
    console.error('Failed to save quiz completion:', error);
  });
}
```

REPLACE WITH:
```typescript
// Calculate time spent if quiz is finishing
const timeSpent = isLastQuestion && prev.startTime 
  ? Math.floor((Date.now() - prev.startTime) / 1000)
  : undefined;

const newState = {
  ...prev,
  userAnswers: newAnswers,
  currentQuestionIndex: isLastQuestion ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
  score: newScore,
  showResults: isLastQuestion
};

// Save completion when quiz finishes
if (isLastQuestion && user?.uid && prev.attemptId) {
  updateQuizCompletion(user.uid, prev.attemptId, {
    answers: newAnswers,
    score: newScore,
    completedAt: new Date().toISOString(),
    timeSpent // ADD THIS LINE
  }).catch(error => {
    console.error('Failed to save quiz completion:', error);
  });
}
```

**Location 5**: Question card header (around line 540)

**Change**: Add live timer display

FIND THIS CODE:
```typescript
<Card variant="glass" className="animate-fade-in-up">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Book className="w-5 h-5" />
      Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
    </CardTitle>
  </CardHeader>
```

REPLACE WITH:
```typescript
<Card variant="glass" className="animate-fade-in-up">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Book className="w-5 h-5" />
        Question {quizState.currentQuestionIndex + 1} of {quizState.questions.length}
      </CardTitle>
      {quizState.startTime && quizState.currentTime && (
        <div className="flex items-center gap-2 bg-indigo-100 px-3 py-1 rounded-lg">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-900">
            {Math.floor((quizState.currentTime - quizState.startTime) / 60000)}:{Math.floor(((quizState.currentTime - quizState.startTime) % 60000) / 1000).toString().padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  </CardHeader>
```

**Location 6**: Results screen (around line 680)

**Change**: Display time in results

FIND THIS CODE:
```typescript
<CardDescription>
  You scored {quizState.score} out of {quizState.questions.length}
</CardDescription>
```

REPLACE WITH:
```typescript
<CardDescription>
  You scored {quizState.score} out of {quizState.questions.length}
  {quizState.startTime && quizState.currentTime && (
    <span className="ml-3 text-indigo-300">
      • Time: {Math.floor((quizState.currentTime - quizState.startTime) / 60000)}:{Math.floor(((quizState.currentTime - quizState.startTime) % 60000) / 1000).toString().padStart(2, '0')}
    </span>
  )}
</CardDescription>
```

---

### File 4: `src/pages/PastQuizzes.tsx`

**Location 1**: PastQuiz interface (around line 10)

**Change**: Add timeSpent field

```typescript
interface PastQuiz {
  id: string;
  title: string;
  type: 'document' | 'topic';
  score?: number;
  questionCount: number;
  createdAt: string;
  completedAt?: string;
  timeSpent?: number; // ADD THIS LINE
  settings?: {
    difficulty?: string;
    numQuestions?: number;
  };
}
```

**Location 2**: Quiz mapping (around line 50)

**Change**: Include timeSpent in mapped data

```typescript
const quizzes: PastQuiz[] = attempts.map(attempt => ({
  id: attempt.id,
  title: attempt.title,
  type: attempt.type,
  score: attempt.score || 0,
  questionCount: attempt.questionCount,
  createdAt: attempt.startedAt,
  completedAt: attempt.completedAt,
  timeSpent: attempt.timeSpent, // ADD THIS LINE
  settings: attempt.settings
}));
```

**Location 3**: Quiz list display (around line 150)

**Change**: Display time in quiz history

FIND THIS CODE:
```typescript
{quiz.score !== undefined && quiz.completedAt && (
  <p className="text-sm text-gray-600 mt-1">
    Score: {quiz.score}/{quiz.questionCount} 
    ({Math.round((quiz.score / quiz.questionCount) * 100)}%)
  </p>
)}
```

REPLACE WITH:
```typescript
{quiz.score !== undefined && quiz.completedAt && (
  <p className="text-sm text-gray-600 mt-1">
    Score: {quiz.score}/{quiz.questionCount} 
    ({Math.round((quiz.score / quiz.questionCount) * 100)}%)
    {quiz.timeSpent && (
      <span className="ml-3 text-indigo-600">
        • Time: {Math.floor(quiz.timeSpent / 60)}:{(quiz.timeSpent % 60).toString().padStart(2, '0')}
      </span>
    )}
  </p>
)}
```

---

## Testing Checklist

After implementing:

1. ✅ Generate a new quiz
2. ✅ Verify timer appears in top-right corner
3. ✅ Verify timer counts up every second (0:00, 0:01, 0:02...)
4. ✅ Complete the quiz
5. ✅ Verify time shows in results screen
6. ✅ Go to Past Quizzes
7. ✅ Verify time shows for completed quiz
8. ✅ Check browser console for any errors

## Database Schema

No Firestore rules changes needed. The `timeSpent` field will be added to existing attempts documents:

```
users/{userId}/attempts/{attemptId}
  - quizTemplateId: string
  - userAnswers: array
  - score: number
  - completedAt: timestamp
  - startedAt: timestamp
  - timeSpent: number (NEW - in seconds)
```

## Notes

- Time is stored in **seconds** in Firestore
- Time is displayed in **MM:SS** format in UI
- Timer only runs during active quiz (not in review mode)
- Old quizzes without timeSpent will not show time (graceful degradation)
- Timer stops when quiz is completed

## Current Project State

- Git tag: `BEFORE_NEW_ENHANCEMENTS`
- Branch: `timing-feature` (or create new)
- All existing features working
- No timing functionality exists yet

---

**End of Specification**
