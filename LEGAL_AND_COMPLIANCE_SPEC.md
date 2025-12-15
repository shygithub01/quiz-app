# Quizist.AI – Legal, Compliance & Freemium Specification
**Version: 1.0 (Final)**  
**Last Updated: December 14, 2024**

This document defines the REQUIRED legal disclosures, policies, UI copy, and platform logic for Quizist.AI, an AI-powered educational and scholarship platform. This specification is intended for direct implementation by engineering agents.

---

## SECTION 1 — PLATFORM POSITIONING

Quizist.AI is an EDUCATIONAL platform that provides:
- AI-generated quizzes for learning and practice
- Skill-based academic competitions
- Merit-based scholarship competitions

**Core principles:**
- Scholarships are FREE to enter
- Scholarships are MERIT-BASED only
- Paid features NEVER influence scholarship outcomes
- No gambling, sweepstakes, or chance-based rewards

---

## SECTION 2 — FREEMIUM MODEL (MANDATORY)

**FREE TIER:**
- Practice quizzes (unlimited)
- Limited AI quiz generation (5 per month)
- Scholarship competition participation (one attempt)

**PAID / PREMIUM TIER ($12.99/month or $99/year):**
- Advanced analytics
- Unlimited quiz generation
- Parent dashboards
- Enhanced learning tools
- PDF downloads
- Priority AI generation

**STRICT RULE:** Paid features must NEVER affect:
- Scholarship eligibility
- Scoring
- Ranking
- Tie-breaking
- Prize distribution

---

## SECTION 3 — AGE & MINOR HANDLING (COPPA-SAFE)

**AGE RULES:**
- Users under 13 years old:
  - Allowed: Practice mode ONLY
  - Blocked: Scholarship participation
- Users 13 and above:
  - Allowed: Practice + Scholarship
  - Parental awareness recommended

**IMPLEMENTATION LOGIC:**
```typescript
if (currentYear - birthYear < 13) {
  // Disable scholarship registration
  // Display message:
  // "Scholarship competitions are available to students age 13 and above."
}
```

---

## SECTION 4 — REQUIRED LEGAL PAGES (ROUTES)

ALL pages must be linked in the global footer.

**Routes:**
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy
- `/scholarship-rules` - Official Scholarship Rules
- `/ai-disclaimer` - AI Content Disclaimer
- `/contact` - Contact Information

---

## SECTION 5 — TERMS OF SERVICE (COPY)

**Title:** Terms of Service  
**Effective Date:** January 1, 2025

### 1. Acceptance of Terms
By accessing or using Quizist.AI, you agree to these Terms.

### 2. Platform Purpose
Quizist.AI is an educational platform providing quizzes and skill-based competitions. No academic outcome or scholarship is guaranteed.

### 3. Eligibility
Users must provide accurate information. Scholarship competitions may impose age, grade, or location requirements.

### 4. Accounts
- One account per user
- No impersonation or sharing
- Violations may result in suspension or termination

### 5. Scholarship Competitions
- Free to enter
- One attempt per participant
- Winners determined by score and time per Official Rules
- Quizist.AI may disqualify rule violations

### 6. AI-Generated Content
Content is AI-generated and provided "as is". Quizist.AI does not guarantee accuracy.

### 7. No Guarantee of Service
Quizist.AI is not responsible for:
- Internet issues
- Device failures
- Power outages
- External technical interruptions

### 8. Limitation of Liability
Quizist.AI is not liable for indirect or consequential damages.

### 9. Modifications
Terms may be updated at any time.

### 10. Contact
support@quizist.ai

---

## SECTION 6 — OFFICIAL SCHOLARSHIP RULES (COPY)

**Title:** Quizist.AI Merit Scholarship Program

### 1. No Purchase Necessary
Participation is free.

### 2. Eligibility
Must meet competition-specific criteria (age, grade, location).

### 3. Competition Format
- One attempt
- Timed quiz
- Multiple-choice questions

### 4. Scoring & Ranking
Ranking order:
1. Total correct answers
2. Time taken
3. Earliest submission

### 5. Disqualification
Including but not limited to:
- Multiple accounts
- Sharing answers
- Bots or automation
- System tampering

### 6. Prizes
Prize amounts disclosed before competition start. Distributed electronically within a reasonable timeframe.

### 7. Taxes
Winners are responsible for applicable taxes.

### 8. Final Decisions
All Quizist.AI decisions are final.

---

## SECTION 7 — PRIVACY POLICY (STUDENT-SAFE)

**Collected Data:**
- Name, email
- Grade, school
- Birth year
- Quiz activity and scores
- Parent email (optional)

**Data Usage:**
- Platform functionality
- Eligibility verification
- Fair competition enforcement
- User and parent communication

**Children's Privacy:**
- Under 13: no scholarship participation
- Parents may request access, correction, or deletion

**Contact:** privacy@quizist.ai

---

## SECTION 8 — AI DISCLAIMER (COPY)

Quizist.AI uses artificial intelligence to generate quiz content. AI-generated material may contain inaccuracies. Content is intended for educational use only.

---

## SECTION 9 — REGISTRATION CHECKBOXES (REQUIRED)

```
[ ] I agree to the Terms of Service
[ ] I agree to the Official Scholarship Rules
[ ] I understand scholarships are free, merit-based, and results are final

(Optional)
[ ] I agree to receive updates and announcements
```

---

## SECTION 10 — PARENT NOTIFICATION EMAILS

### EMAIL 1 — ACCOUNT REGISTRATION

**Subject:** Your Child Registered on Quizist.AI

**Body:**
```
Hello,

This email is to inform you that your child has created an account on Quizist.AI, an educational quiz and scholarship platform.

If you wish to review or delete your child's information, contact: privacy@quizist.ai

— Quizist.AI Team
```

### EMAIL 2 — SCHOLARSHIP PARTICIPATION

**Subject:** Scholarship Competition Participation Notice

**Body:**
```
Hello,

Your child has registered for a Quizist.AI merit-based scholarship competition. Participation is free and results are based solely on academic performance.

Contact privacy@quizist.ai for questions.

— Quizist.AI Team
```

---

## SECTION 11 — SCHOLARSHIP PAGE UI COPY

**ABOVE REGISTER BUTTON:**
```
Merit-Based Scholarship Notice

Scholarships are free and awarded solely based on quiz performance. 
No paid features influence results. One attempt per participant.
```

**BELOW REGISTER BUTTON:**
```
Internet connectivity and device limitations may affect participation. 
Quizist.AI is not responsible for such issues.
```

---

## SECTION 12 — FREE VS PAID CLARITY (GLOBAL)

**GLOBAL BANNER (Scholarship Pages):**
```
Scholarships are free and merit-based. Paid features do not impact results.
```

**PAID FEATURE DESCRIPTION:**
```
Premium features enhance learning tools only. They do not affect 
scholarship eligibility, scoring, or ranking.
```

---

## SECTION 13 — PRE-LAUNCH COMPLIANCE CHECKLIST

- [ ] Age gating enforced (under 13 blocked from scholarships)
- [ ] Parent emails enabled
- [ ] Legal pages live (/terms, /privacy, /scholarship-rules, /ai-disclaimer, /contact)
- [ ] Footer links present on all pages
- [ ] Registration checkboxes required
- [ ] Paid features isolated from scholarship logic
- [ ] Support & privacy emails active (support@quizist.ai, privacy@quizist.ai)
- [ ] "Merit-based, free" messaging on all scholarship pages
- [ ] Parent notification emails configured
- [ ] Age verification in registration form

---

## IMPLEMENTATION PRIORITY

### PHASE 0: Legal Compliance (MUST DO FIRST)
**Before any monetization:**
1. Create all legal pages
2. Add footer with legal links
3. Implement age gating
4. Add registration checkboxes
5. Set up parent notification emails
6. Add scholarship disclaimers

### PHASE 1: Then Freemium
Only after legal compliance is complete, proceed with freemium implementation.

---

## END OF SPECIFICATION

✅ **What this gives you:**
- One authoritative source of truth
- No ambiguity for your coding agent
- Direct mapping to routes, UI, guards, emails
- Lawyer-review-ready
- Investor / school / parent friendly
