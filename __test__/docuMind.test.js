const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Environment variables - Ensure these are set in your .env or environment
const MAIN_BASE_URL = process.env.MAIN_BASE_URL || 'http://localhost:3000/api';
const LOCAL_BASE_URL = process.env.LOCAL_BASE_URL || 'http://localhost:3000/api/learning'; // Assuming /learning is part of the path for these services
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://openrouter.ai/api/v1'; // Updated to OpenRouter
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'YOUR_OPENROUTER_OR_DEEPSEEK_API_KEY'; // Replace with your actual key

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'yitzhakedmundtiomanalu@mail.ugm.ac.id';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Z@cky4DocuMind';

// --- Jest Test Suite ---
describe('DocuMind API Integration Tests', () => {
  // Global timeout for all tests in this suite
  jest.setTimeout(30000); // 30 seconds, adjust as needed

  // Shared state
  let sessionCookies = null;
  let csrfToken = null; // Assuming your API might use CSRF tokens with sessions
  let dynamicDocumentId = null; // Will be set by Create Document test
  let dynamicQuizId = null; // Will be set by Create Quiz test
  let dynamicConversationId = null; // Will be set by Create Conversation test

  // Hardcoded IDs for tests if dynamic creation isn't a prerequisite for that specific test block
  // Ensure these IDs exist in your test environment if used directly without prior creation in tests.
  const FALLBACK_DOCUMENT_ID = process.env.TEST_FALLBACK_DOCUMENT_ID || '68361a0d4bce793bd629bf39';
  const FALLBACK_CONVERSATION_ID = process.env.TEST_FALLBACK_CONVERSATION_ID || '6835fff970450c5109ca6257';


  // Helper to refresh session (login) and get cookies/CSRF token
  const refreshSession = async () => {
    try {
      console.log(`Attempting to refresh session for ${TEST_USER_EMAIL} at ${MAIN_BASE_URL}/auth/session`);
      const response = await request(MAIN_BASE_URL)
        .post('/auth/session')
        .send({
          email: TEST_USER_EMAIL,
          password: TEST_USER_PASSWORD
        })
        .set('Accept', 'application/json');

      console.log('Refresh Session Response Status:', response.status);
      // console.log('Refresh Session Response Body:', response.body); // Uncomment for detailed body
      // console.log('Refresh Session Response Headers:', response.headers); // Uncomment for detailed headers

      if (response.status === 200 && response.headers['set-cookie']) {
        const cookies = response.headers['set-cookie'];
        // Attempt to extract CSRF token from body (common in NextAuth.js) or a custom header
        const extractedCsrfToken = response.body?.csrfToken || response.headers['x-csrf-token'] || null;
        console.log('Session refreshed. Cookies obtained. CSRF Token:', extractedCsrfToken);
        return {
          cookies: cookies,
          csrfToken: extractedCsrfToken
        };
      }
      console.error('Failed to refresh session: Status or Cookies missing.', { status: response.status, cookiesExist: !!response.headers['set-cookie'] });
      throw new Error(`Failed to refresh session. Status: ${response.status}. Body: ${JSON.stringify(response.body)}`);
    } catch (error) {
      console.error('Error during refreshSession:', error.message);
      if (error.response) {
        console.error('Refresh session error response data:', error.response.data);
      }
      throw error; // Re-throw to fail the calling test/hook
    }
  };

  // Retry logic (optional, but can help with flaky network tests)
  const retryRequest = async (requestFn, maxRetries = 2, delayMs = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Request attempt ${attempt} of ${maxRetries}`);
        return await requestFn();
      } catch (error) {
        console.error(`Request attempt ${attempt} failed:`, error.message);
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  };


  // --- Authentication Setup ---
  beforeAll(async () => {
    try {
      const session = await refreshSession();
      sessionCookies = session.cookies;
      csrfToken = session.csrfToken;
      if (!sessionCookies) {
        throw new Error('Failed to obtain session cookies in beforeAll.');
      }
    } catch (error) {
      console.error('CRITICAL: Global beforeAll session refresh failed. Most tests will likely fail.', error.message);
      // Optionally rethrow to stop all tests if login is absolutely critical from the start
      // throw error;
    }
  });

  // --- Auth Endpoints ---
  describe('Auth Endpoints', () => {
    // sessionCookies and csrfToken from global beforeAll will be used
    // Or, you can re-fetch them specifically for this block if needed

    test('POST /auth/session - Sign In (redundant if beforeAll succeeds, good for direct test)', async () => {
      const response = await request(MAIN_BASE_URL)
        .post('/auth/session')
        .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
        .set('Accept', 'application/json');
      console.log('Test Sign In Response Body:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id'); // Or other properties indicating successful login
      // Ensure cookies are set if this test is run in isolation
      if (response.headers['set-cookie']) {
        sessionCookies = response.headers['set-cookie']; // Update global for subsequent tests if needed
        csrfToken = response.body?.csrfToken || response.headers['x-csrf-token'] || csrfToken;
      }
    });

    test('GET /auth/session - Check Session', async () => {
      if (!sessionCookies) {
        console.warn('Skipping Check Session: No session cookies available.');
        return; // Or throw new Error('Session cookies not set');
      }
      const response = await request(MAIN_BASE_URL)
        .get('/auth/session')
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || ''); // Send CSRF if available and needed

      console.log('Check Session Response Body:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      // Add more specific assertions, e.g., expect(response.body.user.email).toBe(TEST_USER_EMAIL);
    });

    test('POST /auth/signout - Sign Out', async () => {
      if (!sessionCookies) {
        console.warn('Skipping Sign Out: No session cookies available.');
        return;
      }
      const response = await request(MAIN_BASE_URL)
        .post('/auth/signout')
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || ''); // Send CSRF if available and needed

      console.log('Sign Out Response Body:', response.body);
      expect(response.status).toBe(200); // Or whatever your API returns
      // After sign out, sessionCookies should ideally be invalidated by the server.
      // For subsequent tests, you might want to set sessionCookies = null or re-login.
    });
  });

  // --- Document Endpoints ---
  describe('Document Endpoints', () => {
    // Uses sessionCookies & csrfToken from global beforeAll or refreshed if needed
    // If auth failed in beforeAll, these tests will likely fail.

    // Optional: Refresh session specifically for this block if needed
    // beforeAll(async () => {
    //   const session = await refreshSession();
    //   sessionCookies = session.cookies;
    //   csrfToken = session.csrfToken;
    // });

    test('POST /documents - Create Document', async () => {
      if (!sessionCookies) {
        throw new Error('Cannot create document: User not authenticated (no session cookies).');
      }
      const filePath = path.resolve(__dirname, 'ASD-RADIX.pdf'); // Ensure this file exists
      if (!fs.existsSync(filePath)) {
        console.error('Test file not found:', filePath);
        throw new Error(`Test file ASD-RADIX.pdf not found at ${filePath}`);
      }

      console.log(`Attempting to create document at ${LOCAL_BASE_URL}/documents`);
  const response = await request(LOCAL_BASE_URL) // <--- Ensure this await is directly on the supertest chain
    .post('/documents')
    .attach('file', filePath)
    .set('Cookie', sessionCookies.join('; '))
    .set('Accept', 'application/json')
    .set('X-CSRF-Token', csrfToken || '');

  // Logs that were previously "after timeout" should now be here
  console.log('Create Document Response Status:', response.status);
  console.log('Create Document Response Body:', response.body);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('_id');
  dynamicDocumentId = response.body._id;
  console.log('Created Document ID:', dynamicDocumentId);
}, 100000);

    test('GET /documents - Read Document', async () => {
      if (!dynamicDocumentId) {
        console.warn('Skipping Read Document: dynamicDocumentId not set.');
        return; // Or use FALLBACK_DOCUMENT_ID if appropriate for your test strategy
      }
      if (!sessionCookies) throw new Error('Cannot read document: User not authenticated.');

      const docToRead = dynamicDocumentId;
      console.log(`Attempting to read document ${docToRead} from ${LOCAL_BASE_URL}/documents`);
      const response = await request(LOCAL_BASE_URL)
        .get(`/documents?id=${docToRead}`)
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Read Document Response Body:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', docToRead);
    });

    test('PATCH /documents/summarize - Summarize Document', async () => {
      if (!dynamicDocumentId) {
        console.warn('Skipping Summarize Document: dynamicDocumentId not set.');
        return;
      }
      if (!sessionCookies) throw new Error('Cannot summarize document: User not authenticated.');

      console.log(`Attempting to summarize document ${dynamicDocumentId}`);
      const response = await request(LOCAL_BASE_URL)
        .patch(`/documents/summarize?id=${dynamicDocumentId}`)
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Summarize Document Response Status:', response.status);
      console.log('Summarize Document Response Body:', response.body);
      expect(response.status).toBe(200); // Or 202 if it's an async job
      expect(response.body).toHaveProperty('summary'); // Or similar expected property
    },100000);

    test('PATCH /documents/access - Update Document Access', async () => {
      if (!dynamicDocumentId) {
        console.warn('Skipping Update Document Access: dynamicDocumentId not set.');
        return;
      }
      if (!sessionCookies) throw new Error('Cannot update access: User not authenticated.');

      const newAccess = 'public';
      console.log(`Attempting to update access for document ${dynamicDocumentId} to ${newAccess}`);
      const response = await request(LOCAL_BASE_URL)
        .patch(`/documents/access?documentId=${dynamicDocumentId}`)
        .send({ access: newAccess })
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Update Access Response Body:', response.body);
      expect(response.status).toBe(200);
      // Add assertion for the change, e.g.
      // expect(response.body.access).toBe(newAccess);
    });

    test('DELETE /documents - Delete Document', async () => {
      if (!dynamicDocumentId) {
        console.warn('Skipping Delete Document: dynamicDocumentId not set. This means create failed or was skipped.');
        return;
      }
      if (!sessionCookies) throw new Error('Cannot delete document: User not authenticated.');

      const docToDelete = dynamicDocumentId;
      console.log(`Attempting to delete document ${docToDelete}`);
      const response = await request(LOCAL_BASE_URL)
        .delete(`/documents?id=${docToDelete}`)
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Delete Document Response Status:', response.status);
      expect(response.status).toBe(200); // Or 204 No Content

      // Verify deletion by trying to read it again
      console.log(`Verifying deletion by attempting to read document ${docToDelete}`);
      const verifyResponse = await request(LOCAL_BASE_URL)
        .get(`/documents?id=${docToDelete}`)
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');
      expect(verifyResponse.status).toBe(404); // Expect Not Found

      dynamicDocumentId = null; // Clear the ID as it's deleted
    });
  });


  // --- Conversation Endpoints ---
 describe('Conversation Endpoints', () => {
    let suiteSessionCookies = null; // Use a new variable for this suite's cookies
    let suiteCsrfToken = null;
    let suiteDocumentId = null; // Document created specifically for this suite

    beforeAll(async () => {
        // 1. Ensure session
        try {
            const session = await refreshSession(); // refreshSession is globally defined
            suiteSessionCookies = session.cookies;
            suiteCsrfToken = session.csrfToken;
        } catch (e) {
            console.error("CRITICAL: Failed to refresh session for Conversation tests. Suite will likely fail.", e.message);
            // Not throwing here to let tests attempt to run and show individual failures
        }

        // 2. Create a prerequisite document IF session was obtained
        if (suiteSessionCookies) {
            try {
                console.log("Creating prerequisite document for Conversation tests...");
                const filePath = path.resolve(__dirname, 'ASD-RADIX.pdf');
                const docResponse = await request(LOCAL_BASE_URL)
                    .post('/documents')
                    .attach('file', filePath)
                    .set('Cookie', suiteSessionCookies.join('; '))
                    .set('X-CSRF-Token', suiteCsrfToken || '');

                if (docResponse.status === 201 && docResponse.body._id) {
                    suiteDocumentId = docResponse.body._id;
                    console.log(`Successfully created document ${suiteDocumentId} for Conversation tests.`);
                } else {
                    console.error(`Failed to create prerequisite document for Conversation tests. Status: ${docResponse.status}, Body: ${JSON.stringify(docResponse.body)}. Tests in this suite may fail or use fallback.`);
                    // Optionally use FALLBACK_DOCUMENT_ID here if creation fails and you want to proceed
                    // suiteDocumentId = FALLBACK_DOCUMENT_ID; 
                }
            } catch (docError) {
                console.error('Error creating prerequisite document for Conversation tests:', docError.message);
                // suiteDocumentId = FALLBACK_DOCUMENT_ID;
            }
        } else {
             console.error("Skipping prerequisite document creation for Conversation tests due to missing session.");
        }
    }, 60000); // Increased timeout for beforeAll if it includes document creation

    test('POST /conversation - Create Conversation', async () => {
        if (!suiteDocumentId) {
            console.warn('Skipping Create Conversation: Prerequisite document ID not available.');
            // You could make this an explicit failure if a document is always required:
            // throw new Error('Prerequisite document ID not available for Create Conversation.');
            return; 
        }
        if (!suiteSessionCookies) throw new Error('Cannot create conversation: User not authenticated.');

        const response = await request(LOCAL_BASE_URL)
            .post('/conversation')
            .send({
                documentId: suiteDocumentId, // Use the ID created for this suite
                message: 'What is the main topic of this document?'
            })
            .set('Cookie', suiteSessionCookies.join('; '))
            .set('Accept', 'application/json')
            .set('X-CSRF-Token', suiteCsrfToken || '');

        console.log('Create Conversation Response Status:', response.status);
        console.log('Create Conversation Response Body:', response.body);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        dynamicConversationId = response.body.id; // This can still be global if other tests in *this suite* need it
    }, 100000);
    test('GET /conversation - Read Conversation', async () => {
      const convIdToRead = dynamicConversationId || FALLBACK_CONVERSATION_ID;
      if (!convIdToRead) {
        console.warn('Skipping Read Conversation: No conversation ID available.');
        return;
      }
      if (!sessionCookies) throw new Error('Cannot read conversation: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .get(`/conversation?id=${convIdToRead}`)
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Read Conversation Response Body:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', convIdToRead);
    });

    test('PATCH /conversation - Continue Conversation', async () => {
      const convIdToContinue = dynamicConversationId || FALLBACK_CONVERSATION_ID;
      if (!convIdToContinue) {
        console.warn('Skipping Continue Conversation: No conversation ID available.');
        return;
      }
      if (!sessionCookies) throw new Error('Cannot continue conversation: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .patch(`/conversation?id=${convIdToContinue}`)
        .send({ message: 'Tell me more about the introduction.' })
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Continue Conversation Response Body:', response.body);
      expect(response.status).toBe(200);
      // Assert that new messages are added or context is updated
    });

    test('DELETE /conversation - Delete Conversation', async () => {
      const convIdToDelete = dynamicConversationId || FALLBACK_CONVERSATION_ID;
      if (!convIdToDelete || convIdToDelete === FALLBACK_CONVERSATION_ID && !dynamicConversationId) {
          console.warn('Skipping Delete Conversation: No dynamically created conversation ID available to delete safely.');
          return;
      }
      if (!sessionCookies) throw new Error('Cannot delete conversation: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .delete(`/conversation?id=${convIdToDelete}`)
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Delete Conversation Response Status:', response.status);
      expect(response.status).toBe(200); // Or 204
      dynamicConversationId = null;
    });
  });


  // --- Flashcard Endpoints ---
  describe('Flashcard Endpoints', () => {
    const currentDocumentIdForFlashcards = dynamicDocumentId || FALLBACK_DOCUMENT_ID;

    beforeAll(async () => {
        if (!sessionCookies) {
          console.warn('No session for Flashcard Endpoints beforeAll, attempting to refresh.');
          try {
            const session = await refreshSession();
            sessionCookies = session.cookies;
            csrfToken = session.csrfToken;
          } catch(e) {
            console.error("Failed to refresh session for Flashcard tests.");
          }
        }
    });

    test('POST /flashcards - Create Flashcards', async () => {
      if (!currentDocumentIdForFlashcards) throw new Error('Document ID for flashcards is not set.');
      if (!sessionCookies) throw new Error('Cannot create flashcards: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .post('/flashcards')
        .send({
          documentId: currentDocumentIdForFlashcards,
          count: 3,
          regeneratePrompt: null
        })
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Create Flashcards Response Status:', response.status);
      console.log('Create Flashcards Response Body:', response.body);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('flashcards');
      expect(response.body.flashcards).toBeInstanceOf(Array);
      // expect(response.body.flashcards.length).toBe(3);
    });

    test('GET /flashcards - Read Flashcards by Document', async () => {
      if (!currentDocumentIdForFlashcards) throw new Error('Document ID for flashcards is not set.');
      if (!sessionCookies) throw new Error('Cannot read flashcards: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .get(`/flashcards?docsId=${currentDocumentIdForFlashcards}`)
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Read Flashcards Response Body:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('flashcards');
    });
  });


  // --- Quiz Endpoints ---
  describe('Quiz Endpoints', () => {
    const currentDocumentIdForQuizzes = dynamicDocumentId || FALLBACK_DOCUMENT_ID;

    beforeAll(async () => {
        if (!sessionCookies) {
          console.warn('No session for Quiz Endpoints beforeAll, attempting to refresh.');
          try {
            const session = await refreshSession();
            sessionCookies = session.cookies;
            csrfToken = session.csrfToken;
          } catch(e) {
            console.error("Failed to refresh session for Quiz tests.");
          }
        }
    });

    test('POST /quizes - Create Quiz', async () => {
      if (!currentDocumentIdForQuizzes) throw new Error('Document ID for quizzes is not set.');
      if (!sessionCookies) throw new Error('Cannot create quiz: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .post('/quizes') // Note: 'quizes' might be a typo for 'quizzes' in your API path
        .send({
          documentId: currentDocumentIdForQuizzes,
          count: 2,
          regeneratePrompt: null
        })
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Create Quiz Response Status:', response.status);
      console.log('Create Quiz Response Body:', response.body);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      dynamicQuizId = response.body.id;
    });

    test('GET /quizes - Read Quizzes by Document', async () => {
      if (!currentDocumentIdForQuizzes) throw new Error('Document ID for quizzes is not set.');
      if (!sessionCookies) throw new Error('Cannot read quizzes: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .get(`/quizes?docsId=${currentDocumentIdForQuizzes}`)
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Read Quizzes Response Body:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('quizes'); // Or 'quizzes'
    });

    test('GET /quizes/answers - Read Quiz Answers', async () => {
      if (!dynamicQuizId) {
        console.warn('Skipping Read Quiz Answers: dynamicQuizId not set.');
        return;
      }
      if (!sessionCookies) throw new Error('Cannot read quiz answers: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .get(`/quizes/answers?quizesId=${dynamicQuizId}`)
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Read Quiz Answers Response Body:', response.body);
      expect(response.status).toBe(200);
      // Add assertions based on expected answer structure, e.g. expect(response.body).toHaveProperty('attempts');
    });

    test('POST /quizes/answers - Check Multiple Choice Answers', async () => {
      if (!dynamicQuizId) {
        console.warn('Skipping Check Multiple Choice: dynamicQuizId not set.');
        return;
      }
      if (!sessionCookies) throw new Error('Cannot check answers: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .post('/quizes/answers')
        .send({
          quizesId: dynamicQuizId,
          quizType: 'multiple',
          answers: ['Some answer 1', 'Another answer 2'] // Provide actual expected answers
        })
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Check Multiple Choice Response Body:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
    });
  });


  // --- Report Endpoints ---
  describe('Report Endpoints', () => {
    const currentDocumentIdForReport = dynamicDocumentId || FALLBACK_DOCUMENT_ID;

    beforeAll(async () => {
        if (!sessionCookies) {
          console.warn('No session for Report Endpoints beforeAll, attempting to refresh.');
          try {
            const session = await refreshSession();
            sessionCookies = session.cookies;
            csrfToken = session.csrfToken;
          } catch(e) {
            console.error("Failed to refresh session for Report tests.");
          }
        }
    });

    test('PATCH /report - Submit Report', async () => {
      if (!currentDocumentIdForReport) throw new Error('Document ID for report is not set.');
      if (!sessionCookies) throw new Error('Cannot submit report: User not authenticated.');

      const response = await request(LOCAL_BASE_URL)
        .patch('/report')
        .send({
          documentId: currentDocumentIdForReport,
          question: 'Sample question being reported.',
          reportDetails: 'Details about why this question is being reported.'
        })
        .set('Cookie', sessionCookies.join('; '))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', csrfToken || '');

      console.log('Submit Report Response Status:', response.status);
      console.log('Submit Report Response Body:', response.body);
      expect(response.status).toBe(200); // Or your API's success status
      // Add assertions for the response body if applicable
    });
  });


  // --- OpenRouter (formerly DeepSeek) API Endpoints ---
  describe('OpenRouter API Endpoints', () => {
    // These tests do not depend on the sessionCookies from your main app

    test('POST /chat/completions - OpenRouter Chat', async () => {
      if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'YOUR_OPENROUTER_OR_DEEPSEEK_API_KEY') {
        console.warn('Skipping OpenRouter Chat test: API key not set.');
        return;
      }
      const response = await request(DEEPSEEK_BASE_URL)
        .post('/chat/completions')
        .send({
          model: 'mistralai/mixtral-8x7b-instruct', // Valid OpenRouter model
          messages: [{ role: 'user', content: 'Tell a very short story.' }]
        })
        .set('Authorization', `Bearer ${DEEPSEEK_API_KEY}`)
        .set('Accept', 'application/json')
        .set('HTTP-Referer', 'http://localhost') // Some models on OpenRouter require/prefer a referer
        .set('X-Title', 'DocuMind Test'); // Optional: Title for OpenRouter dashboard

      console.log('OpenRouter Chat Response Body:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('choices');
      expect(response.body.choices.length).toBeGreaterThan(0);
    });

    test('GET /auth/key - Check OpenRouter API Key Limit', async () => {
       if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'YOUR_OPENROUTER_OR_DEEPSEEK_API_KEY') {
        console.warn('Skipping OpenRouter Key Limit test: API key not set.');
        return;
      }
      const response = await request(DEEPSEEK_BASE_URL)
        .get('/auth/key') // This specific endpoint might be OpenRouter specific
        .set('Authorization', `Bearer ${DEEPSEEK_API_KEY}`)
        .set('Accept', 'application/json');

      console.log('OpenRouter Key Limit Response Body:', response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data'); // Based on your previous successful log
      // Add more specific assertions if needed, e.g., expect(response.body.data.limit_remaining).toBeGreaterThan(0);
    });
  });
});