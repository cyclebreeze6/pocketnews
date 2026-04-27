import admin from 'firebase-admin';

const projectIdArg = process.argv.find((arg) => arg.startsWith('--project='));
const projectId = projectIdArg ? projectIdArg.split('=')[1] : process.env.FIREBASE_PROJECT_ID;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

function initAdmin() {
  if (admin.apps.length) return;

  if (serviceAccountJson && serviceAccountJson.length > 2) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId || serviceAccount.project_id,
    });
    return;
  }

  admin.initializeApp({
    projectId,
  });
}

async function main() {
  initAdmin();

  const db = admin.firestore();
  const snapshot = await db.collection('podcasts').get();

  if (snapshot.empty) {
    console.log('No podcast documents found.');
    return;
  }

  let updated = 0;
  let scanned = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snapshot.docs) {
    scanned += 1;
    const data = docSnap.data() || {};
    const hasCategory = typeof data.contentCategory === 'string' && data.contentCategory.trim().length > 0;

    if (!hasCategory) {
      batch.update(docSnap.ref, { contentCategory: 'My Headlines' });
      batchCount += 1;
      updated += 1;
    }

    if (batchCount === 400) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Scanned ${scanned} podcast documents.`);
  console.log(`Backfilled ${updated} podcast documents with contentCategory=My Headlines.`);
}

main().catch((error) => {
  console.error('Backfill failed:', error.message || error);
  process.exit(1);
});
