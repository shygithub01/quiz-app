# Implementation Plan: Create Competition Type Selection

## Overview

This plan implements a redesigned AdminCreateCompetition page with a new Step 0 for competition type selection. The implementation adds visual type selection cards (Practice, Scholarship, Live Event) and dynamically renders type-specific fields in Step 2 based on the selected type.

## Tasks

- [x] 1. Create TypeSelectionCard component
  - Create new component file `src/components/TypeSelectionCard.tsx`
  - Implement radio button with card styling
  - Add icon, title, and description display
  - Handle selection state with visual highlighting
  - Emit selection events to parent component
  - _Requirements: 1.2, 8.3_

- [ ] 2. Add Step 0 type selection to AdminCreateCompetition
  - [x] 2.1 Add competitionType state and type metadata
    - Add `competitionType` state variable (null | 'practice' | 'scholarship' | 'liveEvent')
    - Define COMPETITION_TYPES metadata object with labels, descriptions, and icons
    - Import necessary icons from lucide-react (Target, Trophy, Presentation)
    - _Requirements: 1.1, 1.3_
  
  - [x] 2.2 Implement Step 0 UI with three type selection cards
    - Render Step 0 card above existing Step 1
    - Display three TypeSelectionCard components for each type
    - Wire up handleTypeSelection callback
    - Add visual feedback for selected card
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 2.3 Write unit tests for type selection logic
    - Test handleTypeSelection updates state correctly
    - Test Step 1 enables when type is selected
    - Test type switching maintains Step 1 enabled state
    - _Requirements: 1.4, 1.5_

- [ ] 3. Implement step progression control
  - [x] 3.1 Add step enablement logic
    - Disable Step 1 when competitionType is null
    - Enable Step 1 when competitionType is selected
    - Disable Step 2 when questionsGenerated is false
    - Enable Step 2 when questionsGenerated is true
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 3.2 Add visual feedback for disabled steps
    - Apply opacity-50 class to disabled Step 1 card
    - Apply opacity-50 class to disabled Step 2 card
    - Disable all inputs in disabled steps
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 3.3 Write property test for step progression
    - **Property 1: Type selection enables Step 1**
    - **Validates: Requirements 1.4, 2.2**
    - Test that selecting any valid type enables Step 1
    - _Requirements: 1.4, 2.2_

- [ ] 4. Refactor Step 2 for dynamic field rendering
  - [ ] 4.1 Extract common fields into reusable section
    - Create renderCommonFields() helper function
    - Include: title, description, dates, times, duration
    - All fields should respect questionsGenerated state
    - _Requirements: 4.1, 7.5_
  
  - [ ] 4.2 Create type-specific field rendering functions
    - Create renderPracticeFields() for Practice type (eligibleCounty)
    - Create renderScholarshipFields() for Scholarship type (eligibleCounty, prizePool, registration)
    - Create renderLiveEventFields() for Live Event type (eventDate, questionTimer, maxParticipants, bonuses)
    - _Requirements: 4.2, 4.3, 4.4, 7.1, 7.2, 7.3_
  
  - [ ] 4.3 Implement conditional rendering in Step 2
    - Use switch/if statement based on competitionType
    - Render common fields for all types
    - Render type-specific fields based on selected type
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 4.4 Write property test for dynamic field rendering
    - **Property 5: Type-specific fields render correctly**
    - **Validates: Requirements 4.1, 7.4, 7.5**
    - Test that each type renders correct fields
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Checkpoint - Ensure UI renders correctly
  - Verify Step 0 displays three type cards
  - Verify Step 1 enables/disables based on type selection
  - Verify Step 2 shows correct fields for each type
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement form validation
  - [ ] 6.1 Create validateFormData() function
    - Validate all common required fields (title, dates, duration)
    - Validate date range (start < end)
    - Validate type-specific required fields based on competitionType
    - Return ValidationResult with valid flag and error messages
    - _Requirements: 5.1, 5.2, 5.3, 5.7_
  
  - [ ] 6.2 Add numeric validation for Live Event fields
    - Validate questionTimer is between 15 and 120 seconds
    - Validate maxParticipants is between 1 and 100
    - Add error messages for out-of-range values
    - _Requirements: 5.4, 5.5_
  
  - [ ] 6.3 Add registration date validation for Scholarship
    - Validate registration dates are before competition dates
    - Add specific error message for invalid registration dates
    - _Requirements: 10.5_
  
  - [ ]* 6.4 Write property tests for validation
    - **Property 7: Numeric validation enforces bounds**
    - **Validates: Requirements 5.4, 5.5**
    - **Property 8: Date validation enforces ordering**
    - **Validates: Requirements 5.7**
    - Test validation with various valid and invalid inputs
    - _Requirements: 5.4, 5.5, 5.7_

- [ ] 7. Update form submission handler
  - [ ] 7.1 Integrate validation into handleCreateCompetition
    - Call validateFormData() before submission
    - Display validation errors to user if validation fails
    - Prevent submission if validation fails
    - _Requirements: 2.5, 5.6, 6.5_
  
  - [ ] 7.2 Update competition data structure for type-specific fields
    - Conditionally include eligibleCounty for Practice and Scholarship
    - Conditionally include prizePool for Scholarship
    - Conditionally include liveEventSettings for Live Event
    - Set isPractice flag correctly based on type
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 7.3 Update Live Event creation logic
    - Only create Live Event in Realtime Database when type is 'liveEvent'
    - Pass questionTimer, maxParticipants, and bonus settings
    - Handle Live Event creation errors gracefully
    - _Requirements: 6.3, 9.4_
  
  - [ ]* 7.4 Write integration tests for form submission
    - Test Practice competition creation
    - Test Scholarship competition creation
    - Test Live Event creation with Realtime Database
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8. Implement type change handling
  - [ ] 8.1 Add resetTypeSpecificFields() function
    - Reset Practice-specific fields when switching away from Practice
    - Reset Scholarship-specific fields when switching away from Scholarship
    - Reset Live Event-specific fields when switching away from Live Event
    - Preserve common fields and generated questions
    - _Requirements: 4.5_
  
  - [ ] 8.2 Call resetTypeSpecificFields in handleTypeSelection
    - Only reset if questionsGenerated is true
    - Log type change for debugging
    - _Requirements: 4.5_
  
  - [ ]* 8.3 Write property test for type change behavior
    - **Property 6: Type change resets type-specific fields**
    - **Validates: Requirements 4.5**
    - Test that switching types resets fields correctly
    - _Requirements: 4.5_

- [ ] 9. Add error handling and recovery
  - [ ] 9.1 Preserve form state on validation errors
    - Ensure all form fields maintain values after validation failure
    - Display specific error messages to user
    - _Requirements: 9.2_
  
  - [ ] 9.2 Preserve form state on question generation errors
    - Maintain all form state when generation fails
    - Allow user to retry with same parameters
    - _Requirements: 9.1_
  
  - [ ] 9.3 Handle Live Event creation failures
    - Display warning if Live Event creation fails after competition creation
    - Offer to continue with regular competition
    - Redirect appropriately based on success/failure
    - _Requirements: 9.4_
  
  - [ ]* 9.4 Write property test for error recovery
    - **Property 10: Error states preserve form data**
    - **Validates: Requirements 6.5, 9.1, 9.2, 9.3**
    - Test that errors don't lose user data
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10. Update UI feedback and loading states
  - [ ] 10.1 Add loading indicators
    - Show spinner during question generation
    - Show loading state on submit button during creation
    - Disable buttons during async operations
    - _Requirements: 8.4, 8.5_
  
  - [ ] 10.2 Add success feedback
    - Display success message after question generation
    - Display success message after competition creation
    - Include relevant IDs and PINs in success messages
    - _Requirements: 6.4_
  
  - [ ] 10.3 Update step titles and descriptions
    - Update Step 0 title: "Step 0: Choose Competition Type"
    - Update Step 1 title: "Step 1: Generate Questions with AI"
    - Update Step 2 title: "Step 2: Competition Details"
    - Add helpful descriptions for each step
    - _Requirements: 8.1, 8.2_

- [ ] 11. Final integration and testing
  - [ ] 11.1 Test complete workflow for each type
    - Test Practice: Select type → Generate questions → Fill details → Submit
    - Test Scholarship: Select type → Generate questions → Fill details → Submit
    - Test Live Event: Select type → Generate questions → Fill details → Submit
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 11.2 Test type switching scenarios
    - Test switching types before question generation
    - Test switching types after question generation
    - Verify fields reset correctly
    - _Requirements: 1.5, 4.5_
  
  - [ ] 11.3 Test validation edge cases
    - Test with missing required fields
    - Test with invalid date ranges
    - Test with out-of-range numeric values
    - Test with invalid date formats
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 11.4 Run all property-based tests
    - Execute all property tests with multiple iterations
    - Verify all properties hold across random inputs
    - Fix any discovered edge cases
    - _Requirements: All_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Manually test all three competition types end-to-end
  - Verify error handling works correctly
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The implementation uses TypeScript and React with existing UI components
- Live Event creation requires integration with Firebase Realtime Database
- Form validation should provide clear, actionable error messages
