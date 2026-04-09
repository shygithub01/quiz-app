# Testing Guide: AI Quiz Generation Improvements

## Deployment Status
✅ **Backend Deployed**: Firebase Functions (generateQuiz)
✅ **Frontend Deployed**: Firebase Hosting
🌐 **Live URL**: https://quizapp-42057.web.app

---

## Prerequisites

1. **Sign in as Admin**:
   - Go to https://quizapp-42057.web.app
   - Sign in with your admin account (role: "super_admin" in Firestore)

2. **Open Browser Console** (for debugging):
   - Press F12 or Right-click → Inspect
   - Go to Console tab
   - Keep it open to see logs

---

## Test 1: Basic Quiz Generation Flow

### Goal: Verify the new review page workflow

**Steps**:
1. Navigate to Quiz Generator page
2. Enter a topic: **"Odia Culture"**
3. Set difficulty: **Medium**
4. Set number of questions: **10**
5. Click **"Generate Quiz"**

**Expected Results**:
- ✅ Loading spinner appears
- ✅ After ~5-10 seconds, automatically redirected to `/admin/quiz-review`
- ✅ Review page shows all 10 generated questions
- ✅ Header shows: "Review AI-Generated Questions"
- ✅ Stats show: "10 Total Questions, 0 Verified, X Issues"

**What to Check**:
- Questions are displayed in cards
- Each card has: question text, 4 options (A-D), correct answer (green), explanation
- Buttons visible: Edit, Verify, Issue
- "Approve All & Save" button at bottom (disabled until all verified)

---

## Test 2: Two-Step Validation (AI Verification)

### Goal: Verify that AI automatically flags suspicious questions

**Steps**:
1. Generate quiz with topic: **"Odia Culture"** (10 questions)
2. Wait for review page to load
3. Look for **yellow warning boxes** on question cards

**Expected Results**:
- ✅ Some questions may have yellow warning boxes labeled "AI Verification Warning"
- ✅ Warning shows specific issue (e.g., "This answer may be disputed" or "Ambiguous question")
- ✅ Toast notification appears: "X question(s) were flagged during AI verification"
- ✅ Issue count in header shows number of flagged questions

**What to Check**:
- Yellow warning box has AlertTriangle icon
- Warning text is specific and helpful
- Questions with warnings are NOT marked as verified by default

**Console Logs to Check**:
```
🔍 Starting two-step validation...
✅ Verification complete: X questions flagged with issues
```

---

## Test 3: Category Detection

### Goal: Verify that different topics are categorized correctly

**Test Different Topics**:

| Topic | Expected Category | Check Console For |
|-------|------------------|-------------------|
| "Indian History" | history | `📂 Detected category: history` |
| "Geography of India" | geography | `📂 Detected category: geography` |
| "Odia Dance Forms" | culture | `📂 Detected category: culture` |
| "Physics Concepts" | science | `📂 Detected category: science` |
| "Shakespeare Works" | literature | `📂 Detected category: literature` |
| "Cricket Records" | sports | `📂 Detected category: sports` |
| "Random Topic" | general | `📂 Detected category: general` |

**Steps for Each Topic**:
1. Generate quiz with the topic
2. Open browser console
3. Look for category detection log
4. Verify questions are relevant to the category

**Expected Results**:
- ✅ Console shows detected category
- ✅ Questions are appropriate for the category
- ✅ Category-specific accuracy rules are applied (check question quality)

---

## Test 4: Manual Review UI - Verify Questions

### Goal: Test the verify/issue marking functionality

**Steps**:
1. Generate any quiz (10 questions)
2. On review page, click **"Verify"** on first question
3. Click **"Issue"** on second question
4. Leave third question unmarked

**Expected Results**:
- ✅ First question: Card turns green, shows "Verified" badge
- ✅ Second question: Card turns red, shows "Has Issue" badge
- ✅ Third question: Stays gray (pending)
- ✅ Stats update: "1 Verified, 1 Issues"
- ✅ "Approve All & Save" button stays disabled (not all verified)

**What to Check**:
- Color coding works correctly
- Stats update in real-time
- Cannot approve until all questions are verified or removed

---

## Test 5: Manual Review UI - Edit Questions

### Goal: Test the inline editing functionality

**Steps**:
1. Generate any quiz
2. Click **"Edit"** on first question
3. Modify the question text
4. Change option A text
5. Change correct answer from A to B
6. Modify explanation
7. Click **"Save"**

**Expected Results**:
- ✅ Edit mode shows input fields for all editable parts
- ✅ Correct answer dropdown shows A, B, C, D options
- ✅ After save: Changes are applied
- ✅ Question is automatically marked as "Verified"
- ✅ Card turns green
- ✅ Toast shows: "Question Updated"

**What to Check**:
- All fields are editable
- Changes persist after save
- Can cancel edit without saving
- Edited question is marked verified

---

## Test 6: Manual Review UI - Remove Questions

### Goal: Test question removal functionality

**Steps**:
1. Generate quiz with 10 questions
2. Mark first question as "Has Issue"
3. Click **"Remove This Question"** button
4. Confirm removal

**Expected Results**:
- ✅ Question is removed from list
- ✅ Total count updates: "9 Total Questions"
- ✅ Question IDs remain unchanged (no re-numbering)
- ✅ Toast shows: "Question Removed"

**What to Check**:
- Removed question disappears
- Other questions stay in place
- Can remove multiple questions
- Stats update correctly

---

## Test 7: Approve All & Save

### Goal: Test the complete workflow from generation to quiz

**Steps**:
1. Generate quiz with 5 questions
2. Verify all 5 questions (click "Verify" on each)
3. Click **"Approve All & Save"**

**Expected Results**:
- ✅ Redirected back to Quiz Generator page
- ✅ Quiz loads automatically with verified questions
- ✅ Timer starts
- ✅ Can take the quiz normally
- ✅ Toast shows: "Quiz Ready! 5 verified questions loaded."

**What to Check**:
- All approved questions are loaded
- Quiz works normally (can answer questions)
- Timer works
- Can submit quiz and see results

---

## Test 8: Cannot Approve with Issues

### Goal: Verify validation prevents approving problematic questions

**Steps**:
1. Generate quiz with 10 questions
2. Verify 8 questions
3. Mark 2 questions as "Has Issue"
4. Try to click **"Approve All & Save"**

**Expected Results**:
- ✅ Button is disabled (grayed out)
- ✅ Clicking shows toast: "Cannot Approve - 2 question(s) marked with issues"
- ✅ Must remove or fix issue questions first

**What to Check**:
- Cannot proceed with flagged issues
- Clear error message
- Must resolve all issues before approval

---

## Test 9: Cancel Review

### Goal: Test canceling the review process

**Steps**:
1. Generate any quiz
2. On review page, click **"Cancel Review"**

**Expected Results**:
- ✅ Redirected back to Quiz Generator page
- ✅ No questions are loaded
- ✅ Can generate a new quiz
- ✅ Previous questions are discarded

---

## Test 10: File Upload with Review

### Goal: Verify review works with file uploads too

**Steps**:
1. Go to Quiz Generator
2. Upload a text/PDF file
3. Set number of questions: 10
4. Click "Generate Quiz"

**Expected Results**:
- ✅ Redirected to review page
- ✅ Questions based on file content
- ✅ All review features work (verify, edit, remove)
- ✅ Can approve and use quiz

---

## Test 11: Large Question Sets (50 Questions)

### Goal: Test with maximum question count

**Steps**:
1. Generate quiz with topic: "Indian History"
2. Set number of questions: **50**
3. Wait for generation (~15-20 seconds)

**Expected Results**:
- ✅ All 50 questions generated
- ✅ Review page loads (may take a moment)
- ✅ Can scroll through all questions
- ✅ Verification works for all questions
- ✅ Stats show "50 Total Questions"

**What to Check**:
- No timeout errors
- All questions are valid
- Review UI handles large sets well
- Can verify and approve all 50

---

## Test 12: Verification Issue Examples

### Goal: See what types of issues AI flags

**Try These Topics** (known to have issues):
1. **"Odia Movies and Awards"** - High-risk category
2. **"Population of Indian Cities"** - Outdated data risk
3. **"Famous Singers and Songs"** - Easy to confuse
4. **"First/Oldest/Largest in India"** - Disputed claims

**Expected Results**:
- ✅ More questions flagged with issues
- ✅ Warnings are specific and helpful
- ✅ Admin can review and fix/remove

---

## Common Issues & Troubleshooting

### Issue: Review page doesn't load
**Solution**: 
- Check browser console for errors
- Verify you're signed in as admin
- Try refreshing the page
- Check network tab for API errors

### Issue: No verification warnings appear
**Solution**:
- This is normal if questions are accurate
- Try topics known to have issues (see Test 12)
- Check console for verification logs

### Issue: "Approve All" button stays disabled
**Solution**:
- Verify ALL questions (green checkmark on each)
- Remove or fix any questions marked with issues
- Check stats: "X of Y verified"

### Issue: Questions don't load after approval
**Solution**:
- Check browser console for errors
- Verify navigation state is passed correctly
- Try generating a new quiz

---

## Backend Logs to Monitor

Open Firebase Console → Functions → Logs:

**Look for these logs**:
```
🧠 Generating quiz from topic: [topic]
📂 Detected category: [category]
🎲 Topic variation: [variation]
🤖 OpenAI topic response received
✅ Successfully generated X questions from topic
🔍 Starting two-step validation...
✅ Verification complete: X questions flagged with issues
```

**Error logs to watch for**:
```
❌ Verification failed: [error]
❌ AI generation error: [error]
```

---

## Success Criteria

✅ **All tests pass**
✅ **Review page loads correctly**
✅ **AI verification flags suspicious questions**
✅ **Category detection works for all categories**
✅ **Can edit, verify, and remove questions**
✅ **Approve workflow completes successfully**
✅ **Quiz loads with verified questions**
✅ **No console errors**

---

## Performance Benchmarks

| Action | Expected Time |
|--------|--------------|
| Generate 10 questions | 5-10 seconds |
| Generate 50 questions | 15-20 seconds |
| Two-step validation | +2-3 seconds |
| Review page load | <1 second |
| Edit and save | Instant |
| Approve and load quiz | <1 second |

---

## Next Steps After Testing

1. **If all tests pass**: System is ready for production use
2. **If issues found**: Document them and report
3. **Monitor usage**: Check Firebase logs for errors
4. **Gather feedback**: Ask admins about review UI usability
5. **Iterate**: Improve based on real-world usage

---

## Quick Test Checklist

- [ ] Generate quiz with topic
- [ ] Review page loads automatically
- [ ] AI verification warnings appear
- [ ] Category detection works
- [ ] Can verify questions
- [ ] Can edit questions
- [ ] Can remove questions
- [ ] Can approve all questions
- [ ] Quiz loads with verified questions
- [ ] Can take and complete quiz
- [ ] No console errors

---

## Contact for Issues

If you encounter any problems during testing:
1. Check browser console for errors
2. Check Firebase Functions logs
3. Document the issue with screenshots
4. Note the exact steps to reproduce

Happy testing! 🎉
