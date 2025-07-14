import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Manager } from '../types/manager';

export const useManagers = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for managers
  useEffect(() => {
    const managersRef = collection(db, 'managers');
    const q = query(managersRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const managerData: Manager[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            managerData.push({
              id: doc.id,
              ...data,
              // Convert Firestore Timestamps to ISO strings
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            } as Manager);
          });
          setManagers(managerData);
          setError(null);
        } catch (err) {
          console.error('Error processing managers:', err);
          setError('Failed to load managers');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching managers:', err);
        setError('Failed to connect to database. Please check your internet connection.');
        setLoading(false);
        
        // Fallback to demo data if Firestore is not available
        const demoData = generateDemoManagers();
        setManagers(demoData);
      }
    );

    return () => unsubscribe();
  }, []);

  const addManager = async (manager: Omit<Manager, 'id'>) => {
    try {
      setError(null);
      const managerData = {
        ...manager,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'managers'), managerData);
      
      // Return the manager with the new ID
      return {
        ...manager,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Error adding manager:', err);
      setError('Failed to add manager. Please try again.');
      throw err;
    }
  };

  const updateManager = async (id: string, updates: Partial<Manager>) => {
    try {
      setError(null);
      const managerRef = doc(db, 'managers', id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(managerRef, updateData);
    } catch (err) {
      console.error('Error updating manager:', err);
      setError('Failed to update manager. Please try again.');
      throw err;
    }
  };

  const deleteManager = async (id: string) => {
    try {
      setError(null);
      const managerRef = doc(db, 'managers', id);
      await deleteDoc(managerRef);
    } catch (err) {
      console.error('Error deleting manager:', err);
      setError('Failed to delete manager. Please try again.');
      throw err;
    }
  };

  const getActiveManagers = (): Manager[] => {
    return managers.filter(manager => manager.active);
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const managersRef = collection(db, 'managers');
      const q = query(managersRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const managerData: Manager[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        managerData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Manager);
      });
      
      setManagers(managerData);
    } catch (err) {
      console.error('Error refetching managers:', err);
      setError('Failed to refresh managers.');
    } finally {
      setLoading(false);
    }
  };

  return {
    managers,
    loading,
    error,
    addManager,
    updateManager,
    deleteManager,
    getActiveManagers,
    refetch,
  };
};

// Demo data for fallback when Firestore is not available
const generateDemoManagers = (): Manager[] => [
  {
    id: 'demo-manager-1',
    name: 'Andrea Giuliani',
    initials: 'AG',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-manager-2',
    name: 'Marco Rossi',
    initials: 'MR',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-manager-3',
    name: 'Laura Conti',
    initials: 'LC',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-manager-4',
    name: 'Francesco Pellegrini',
    initials: 'FP',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];