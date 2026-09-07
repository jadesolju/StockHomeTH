/**
 * Firebase Admin SDK Helper
 * Project ID: stockhometh-349c9
 */

let firebaseAdminInstance: any = null;

export async function getFirebaseAdmin(): Promise<any> {
  if (firebaseAdminInstance) return firebaseAdminInstance;

  try {
    // @ts-ignore
    const adminModule = await import(/* webpackIgnore: true */ 'firebase-admin');
    const admin = adminModule?.default || adminModule;
    
    if (admin && admin.apps && !admin.apps.length) {
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
        try {
          admin.initializeApp({ projectId });
        } catch {
          // Ignore if default credentials not set in local dev
        }
      }
    }
    firebaseAdminInstance = admin;
    return firebaseAdminInstance;
  } catch (err) {
    console.warn('[Firebase Admin] Optional Firebase Admin SDK is not active.');
    return null;
  }
}

export const firebaseAdmin = {
  getApp: () => getFirebaseAdmin(),
};
