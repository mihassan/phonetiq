# Product Requirements Document (PRD)

## Title: Phonetiq - Minimal Pair Pronunciation Practice
**Status:** Planning

### Overview
Phonetiq is a web application designed to help English language learners master "minimal pairs" (words that differ by only one phonological element, like "ship" vs. "sheep"). The app provides auditory examples and leverages speech recognition to validate the user's pronunciation.

### Target Audience
ESL/EFL learners, speech therapy patients, and linguistics enthusiasts looking to improve phonemic awareness and pronunciation accuracy.

### Core User Stories (v1)
*   **As a user**, I want to see a pair of confusing words so that I know what sounds I am practicing.
*   **As a user in Learn Mode**, I want to click a word to hear its correct pronunciation (via Text-to-Speech) so I can learn the difference.
*   **As a user in Practice Mode**, I want to speak into my microphone and have the app tell me which word it heard, validating my pronunciation.
*   **As a user**, I want to navigate through a comprehensive list of common English minimal pairs categorized by phonetic difficulty (e.g., Vowels, Consonants, Fricatives).

### Future User Stories (v2 - Requires Auth/Backend)
*   **As a returning user**, I want to log in so my progress is saved.
*   **As a user**, I want the app to track which pairs I struggle with and surface them more frequently (Spaced Repetition).
*   **As a teacher**, I want to create custom lists of word pairs for my classroom.

### Out of Scope (v1)
*   User authentication (Anonymous usage only).
*   Progress tracking (State is lost on refresh).
