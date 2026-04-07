# Requirements Document: Create Competition Type Selection

## Introduction

This document specifies the requirements for redesigning the AdminCreateCompetition page to add a new Step 0 for competition type selection. The feature improves UX by making type selection prominent and enabling dynamic field rendering based on the selected competition type (Practice, Scholarship, or Live Event).

## Glossary

- **Competition_Type**: One of three values: Practice, Scholarship, or Live Event
- **Step_0**: The initial step where users select the competition type using radio button cards
- **Step_1**: The question generation step where AI generates quiz questions
- **Step_2**: The competition details step with type-specific fields
- **Type_Selection_Card**: A visual card component containing a radio button for selecting competition type
- **Form_State**: The complete state object managing all form data across the three steps
- **AI_Service**: The backend service that generates quiz questions
- **Firebase_Service**: The backend service for storing competitions and live events
- **Live_Event_Service**: The service managing real-time live event data

## Requirements

### Requirement 1: Type Selection Interface

**User Story:** As an admin, I want to select the competition type at the beginning of the creation process, so that I can see only the relevant fields for that type.

#### Acceptance Criteria

1. WHEN the admin lands on the AdminCreateCompetition page, THE System SHALL display Step 0 with three type selection cards
2. THE System SHALL display each type selection card with a radio button, icon, title, and description
3. WHEN no type is selected, THE System SHALL disable Step 1 and Step 2
4. WHEN the admin selects a competition type, THE System SHALL enable Step 1
5. WHEN the admin selects a different type after initial selection, THE System SHALL update the selection and maintain Step 1 enabled state

### Requirement 2: Step Progression Control

**User Story:** As an admin, I want the form to guide me through the steps in order, so that I don't miss required information.

#### Acceptance Criteria

1. WHEN Step 0 has no type selected, THE System SHALL disable Step 1 with visual feedback (reduced opacity)
2. WHEN a type is selected in Step 0, THE System SHALL enable Step 1 for question generation
3. WHEN questions have not been generated, THE System SHALL disable Step 2 with visual feedback
4. WHEN questions are successfully generated, THE System SHALL enable Step 2 with type-specific fields
5. WHEN the admin attempts to submit the form, THE System SHALL validate that all steps are complete

### Requirement 3: Question Generation

**User Story:** As an admin, I want to generate quiz questions using AI, so that I can create competitions quickly without manual question entry.

#### Acceptance Criteria

1. WHEN Step 1 is enabled, THE System SHALL display subject distribution inputs and difficulty selector
2. WHEN the admin clicks "Generate Questions", THE System SHALL call the AI generation service
3. WHILE questions are generating, THE System SHALL display a loading indicator and disable the generate button
4. WHEN question generation succeeds, THE System SHALL store the generated questions and enable Step 2
5. IF question generation fails, THEN THE System SHALL display an error message and allow retry

### Requirement 4: Dynamic Field Rendering

**User Story:** As an admin, I want to see only the fields relevant to my selected competition type, so that the form is not cluttered with unnecessary options.

#### Acceptance Criteria

1. WHEN Step 2 is enabled, THE System SHALL display common fields for all competition types
2. WHEN the competition type is Practice, THE System SHALL display the eligible county field
3. WHEN the competition type is Scholarship, THE System SHALL display eligible county, prize pool, and registration fields
4. WHEN the competition type is Live Event, THE System SHALL display event date, question timer, and live event settings
5. WHEN the admin changes the competition type after Step 2 is enabled, THE System SHALL reset type-specific fields to default values

### Requirement 5: Form Validation

**User Story:** As an admin, I want the system to validate my inputs, so that I don't create invalid competitions.

#### Acceptance Criteria

1. WHEN the admin submits the form, THE System SHALL validate that all common required fields are filled
2. WHEN the competition type is Practice, THE System SHALL validate that eligible county is selected
3. WHEN the competition type is Scholarship, THE System SHALL validate that prize pool and eligible county are provided
4. WHEN the competition type is Live Event, THE System SHALL validate that question timer is between 15 and 120 seconds
5. WHEN the competition type is Live Event, THE System SHALL validate that max participants is between 1 and 100
6. WHEN any validation fails, THE System SHALL display specific error messages and prevent submission
7. WHEN start date is after or equal to end date, THE System SHALL reject the form with an error message

### Requirement 6: Competition Creation

**User Story:** As an admin, I want to create competitions of different types, so that I can support various educational activities.

#### Acceptance Criteria

1. WHEN the form is valid and submitted for Practice type, THE System SHALL create a practice competition in Firebase
2. WHEN the form is valid and submitted for Scholarship type, THE System SHALL create a scholarship competition with registration data
3. WHEN the form is valid and submitted for Live Event type, THE System SHALL create both a competition and a live event entry
4. WHEN competition creation succeeds, THE System SHALL redirect the admin to the appropriate page
5. IF competition creation fails, THEN THE System SHALL display an error message and maintain form state

### Requirement 7: Type-Specific Data Storage

**User Story:** As a system, I need to store type-specific data correctly, so that competitions function according to their type.

#### Acceptance Criteria

1. WHEN storing a Practice competition, THE System SHALL include the eligible county field
2. WHEN storing a Scholarship competition, THE System SHALL include prize pool, registration dates, and eligibility requirements
3. WHEN storing a Live Event, THE System SHALL include question timer, max participants, and bonus settings in the Realtime Database
4. WHEN storing any competition, THE System SHALL include the generated questions as a quiz template
5. WHEN storing any competition, THE System SHALL include common fields: title, description, dates, and duration

### Requirement 8: User Interface Feedback

**User Story:** As an admin, I want clear visual feedback on my progress, so that I understand what step I'm on and what's required next.

#### Acceptance Criteria

1. WHEN a step is disabled, THE System SHALL display it with reduced opacity
2. WHEN a step is enabled, THE System SHALL display it with full opacity
3. WHEN a type selection card is selected, THE System SHALL highlight it visually
4. WHEN questions are generating, THE System SHALL display a loading spinner
5. WHEN form submission is in progress, THE System SHALL disable the submit button and show loading state

### Requirement 9: Error Recovery

**User Story:** As an admin, I want to recover from errors gracefully, so that I don't lose my work when something goes wrong.

#### Acceptance Criteria

1. WHEN question generation fails, THE System SHALL maintain all form state and allow retry
2. WHEN form validation fails, THE System SHALL maintain all entered data
3. WHEN competition creation fails, THE System SHALL display the error and maintain form state
4. IF Live Event creation fails after competition creation, THEN THE System SHALL notify the admin and offer to continue with regular competition
5. WHEN the admin navigates away and returns, THE System SHALL start with a fresh form state

### Requirement 10: Date and Time Handling

**User Story:** As an admin, I want to specify dates and times for competitions, so that they run at the correct times.

#### Acceptance Criteria

1. WHEN entering dates, THE System SHALL accept dates in YYYY-MM-DD format
2. WHEN entering times, THE System SHALL accept times in HH:MM format
3. WHEN the admin submits the form, THE System SHALL combine date and time into valid timestamps
4. WHEN the competition type is Live Event, THE System SHALL use a single event date instead of start/end range
5. WHEN the competition type is Scholarship, THE System SHALL validate that registration dates are before competition dates
