import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

export const updateCampaignStatuses = async () => {
  const db = getFirestore();
  const today = new Date().toISOString().split('T')[0]; // es: "2025-06-26"
  const batch = writeBatch(db);

  // SCHEDULED → ACTIVE
  const q1 = query(
    collection(db, 'campaigns'),
    where('status', '==', 'SCHEDULED'),
    where('startDate', '<=', today)
  );
  const snapshot1 = await getDocs(q1);
  snapshot1.forEach((doc) => {
    batch.update(doc.ref, { status: 'ACTIVE' });
  });

  // SCHEDULED / ACTIVE → COMPLETED
  const q2 = query(
    collection(db, 'campaigns'),
    where('status', 'in', ['SCHEDULED', 'ACTIVE']),
    where('endDate', '<', today)
  );
  const snapshot2 = await getDocs(q2);
  snapshot2.forEach((doc) => {
    batch.update(doc.ref, { status: 'COMPLETED' });
  });

  await batch.commit();
  console.log(`✔️ Campaigns updated — Active: ${snapshot1.size}, Completed: ${snapshot2.size}`);
};
