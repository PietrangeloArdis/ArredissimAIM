import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, DocumentData } from 'firebase/firestore';
import { db } from '../utils/firebase';

// Definiamo un'interfaccia di base per i nostri documenti
interface FirestoreDocument {
  id: string;
}

export const useCollection = <T extends DocumentData>(collectionName: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Gestisce le collezioni che potrebbero non avere un campo 'name' per l'ordinamento
    const aQuery = collectionName === 'campaigns'
      ? query(collection(db, collectionName), orderBy('createdAt', 'desc'))
      : query(collection(db, collectionName), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      aQuery,
      (snapshot) => {
        try {
          const result = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Converte i Timestamp di Firestore in stringhe ISO per coerenza
            createdAt: doc.data().createdAt?.toDate?.().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate?.().toISOString(),
          } as T & FirestoreDocument));
          setData(result);
          setError(null);
        } catch (err) {
          console.error(`Error processing ${collectionName}:`, err);
          setError(`Failed to load ${collectionName}`);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError('Failed to connect to the database.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading, error };
};