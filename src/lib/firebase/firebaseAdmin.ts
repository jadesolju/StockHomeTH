import * as admin from 'firebase-admin';

// Initialize Firebase Admin safely (prevent re-initialization error)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'stockhometh-349c9';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Default initialization or placeholder (avoids server crash in development)
    try {
      admin.initializeApp({
        projectId,
      });
    } catch {
      // Ignore if no default credentials available in local dev
    }
  }
}

export const firebaseAdmin = admin;
