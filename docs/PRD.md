# Product Requirements Document (PRD)

## Title: Phonetiq - Minimal Pair Pronunciation Practice
**Status:** Live (current)
**Live URL:** https://phonetiq.mihassan.com

### Overview
Phonetiq helps learners practice English minimal pairs (e.g., *ship* vs *sheep*) with clear listen-first examples and microphone-based pronunciation validation. The product combines pre-generated TTS audio with server-side STT validation and local progress tracking.

### Target Audience
ESL/EFL learners, speech therapy users, and pronunciation-focused self-learners improving phonemic awareness and production.

### Current User Stories
* **As a learner**, I want to hear each word clearly so I can internalize the sound contrast.
* **As a learner**, I want to record and receive immediate recognition feedback while practicing one side of a minimal pair.
* **As a learner**, I want recognition to prefer only the 2 target words and return a safe retry state when uncertain.
* **As a learner**, I want practice sessions to prioritize weak and unseen pairs in manageable batches.
* **As a learner**, I want to track my progress (accuracy, attempts, completions, streaks, weak areas) and jump into weak-pair practice.
* **As a learner**, I want to filter content by category and dialect relevance.

### Current Product Scope
* Learn mode (pair listening and navigation)
* Practice mode (record → STT → correct/incorrect/no-match)
* Batch-based adaptive sessions (default: 15 pairs; 5 weak-pair quota)
* Categories mode with real progress summaries
* Profile mode with key stats and weak-pair practice action
* Local-only persistence of performance data (browser storage)
* Optional Google OAuth for account creation and cross-device progress sync

### Future Roadmap
* Expand the seeded `au_only` dataset with additional research-backed contrasts
* Classroom/teacher custom lists and assignments
* More advanced review scheduling and personalized practice plans
* STT quality analytics/tuning dashboards

### Out of Scope (current)
* Teacher admin tooling and multi-user class management
