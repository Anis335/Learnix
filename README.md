# Learnix

Existing Learnix application with the Tests assessment system, offline question-bank fallback, and student feedback/reviews integrated without replacing the existing frontend or authentication flow.

## Requirements

- Node.js 20 or newer
- Firebase project with Authentication and Cloud Firestore
- Firebase Admin service-account credentials for the backend
- Optional Gemini API key (tests continue with the offline bank when generation is unavailable)
- The Karachi Board AI Exam Paper generator uses the BSEK 20/40/40 structure: science subjects generate 12 MCQs, 12 short questions and 6 descriptive questions; Mathematics generates 15 MCQs, 10 short questions and 5 descriptive questions.

## Local setup

1. Install backend dependencies: `cd backend && npm install`.
2. Copy `backend/.env.example` to `backend/.env` and configure `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `GEMINI_API_KEY` (optional), `GEMINI_MODEL`, and `ALLOWED_ORIGINS`.
3. Start the API with `cd backend && npm start`.
4. For the full browser experience, deploy the existing Netlify site or run it with the Netlify CLI so the existing `/api/*` redirect routes requests to the function. Configure the same environment variables in that environment.
5. Sign in and complete the existing Learnix study-profile onboarding before opening Tests or Feedback & reviews.

Never commit real service-account credentials or Gemini keys.

## AI practice papers

The dashboard's **Exam paper** section generates a downloadable Word `.docx` practice paper for the Karachi Board Class 9 and Class 10 subjects currently represented in the Karachi syllabus catalog. Gemini is instructed to use the catalog chapters and Sindh Textbook Board topic boundaries. If Gemini is temporarily unavailable, the API generates the paper from the verified Karachi question bank instead of returning an empty download.

The paper structure follows the BSEK model/past-paper pattern researched from the BSEK model-paper listing and recent Karachi Board paper reproductions: 20% objective, 40% short-answer, and 40% descriptive. The generated file is labelled as a practice resource and is not presented as an official board paper.

## Tests

Run `cd backend && npm test` to validate the extracted source question banks and MCQ answer-key structure. These are data-integrity tests, not a live Firebase/Gemini end-to-end test. Live API tests require configured Firebase credentials and a test account.

## Offline question bank

Structured source-derived JSON is under `backend/src/question-bank/`:

- `federal/class-9/` and `federal/class-10/`
- `karachi/class-9/` and `karachi/class-10/`
- each contains nine subject files with 30 short and 30 long questions per subject
- `federal/class-9/mcqs.json` contains the 120 source MCQs and answer keys

The subjective source documents do not include model answers or marking rubrics. These are represented as `null` / empty arrays; the application does not invent answers. Offline subjective submissions show self-review and available source answer information without claiming AI grading.

## Test behavior

- Gemini generation is attempted with a 25-second timeout; invalid responses, errors, missing configuration, and timeouts fall back to the matching board/class/subject bank.
- Offline short tests contain exactly 10 randomly selected questions; offline long tests contain exactly 5.
- MCQ tests are restricted to Federal Board Class 9. The source document provides only 12–15 MCQs per subject, so an offline 30-question MCQ test correctly returns an insufficient-bank error. Gemini may generate a 30-question test when available.
- MCQ answer keys are kept in Firestore and never returned by the generation endpoint. Backend submission computes score, correct/incorrect/unanswered counts, and percentage.
- Test documents are stored under the authenticated user's Firestore path. The API verifies Firebase ID tokens and ownership.
- Feedback and website reviews are submitted through authenticated API endpoints. Website reviews are public to signed-in Learnix users; feedback is private to the Learnix backend.

## Deployment

Deploy the existing Netlify frontend and backend function as before. Configure the same environment variables in Netlify. Firestore rules deny direct client access to test records and feedback/review collections; the backend uses Firebase Admin SDK.
