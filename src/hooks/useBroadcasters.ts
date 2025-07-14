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
import { Broadcaster } from '../types/broadcaster';

export const useBroadcasters = () => {
  const [broadcasters, setBroadcasters] = useState<Broadcaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for broadcasters
  useEffect(() => {
    const broadcastersRef = collection(db, 'broadcasters');
    const q = query(broadcastersRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const broadcasterData: Broadcaster[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            broadcasterData.push({
              id: doc.id,
              ...data,
              // Convert Firestore Timestamps to ISO strings
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            } as Broadcaster);
          });
          setBroadcasters(broadcasterData);
          setError(null);
        } catch (err) {
          console.error('Error processing broadcasters:', err);
          setError('Failed to load broadcasters');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching broadcasters:', err);
        setError('Failed to connect to database. Please check your internet connection.');
        setLoading(false);
        
        // Fallback to demo data if Firestore is not available
        const demoData = generateDemoBroadcasters();
        setBroadcasters(demoData);
      }
    );

    return () => unsubscribe();
  }, []);

  const addBroadcaster = async (broadcaster: Omit<Broadcaster, 'id'>) => {
    try {
      setError(null);
      
      // Check for duplicate names
      const existingBroadcaster = broadcasters.find(
        b => b.name.toLowerCase() === broadcaster.name.toLowerCase()
      );
      
      if (existingBroadcaster) {
        throw new Error(`Broadcaster "${broadcaster.name}" already exists`);
      }

      const broadcasterData = {
        ...broadcaster,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'broadcasters'), broadcasterData);
      
      // Return the broadcaster with the new ID
      return {
        ...broadcaster,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Error adding broadcaster:', err);
      const errorMessage = err.message || 'Failed to add broadcaster. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateBroadcaster = async (id: string, updates: Partial<Broadcaster>) => {
    try {
      setError(null);
      
      // Check for duplicate names if name is being updated
      if (updates.name) {
        const existingBroadcaster = broadcasters.find(
          b => b.name.toLowerCase() === updates.name!.toLowerCase() && b.id !== id
        );
        
        if (existingBroadcaster) {
          throw new Error(`Broadcaster "${updates.name}" already exists`);
        }
      }

      const broadcasterRef = doc(db, 'broadcasters', id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(broadcasterRef, updateData);
    } catch (err: any) {
      console.error('Error updating broadcaster:', err);
      const errorMessage = err.message || 'Failed to update broadcaster. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteBroadcaster = async (id: string) => {
    try {
      setError(null);
      const broadcasterRef = doc(db, 'broadcasters', id);
      await deleteDoc(broadcasterRef);
    } catch (err) {
      console.error('Error deleting broadcaster:', err);
      setError('Failed to delete broadcaster. Please try again.');
      throw err;
    }
  };

  const getActiveBroadcasters = (): Broadcaster[] => {
    return broadcasters.filter(broadcaster => broadcaster.active);
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const broadcastersRef = collection(db, 'broadcasters');
      const q = query(broadcastersRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const broadcasterData: Broadcaster[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        broadcasterData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Broadcaster);
      });
      
      setBroadcasters(broadcasterData);
    } catch (err) {
      console.error('Error refetching broadcasters:', err);
      setError('Failed to refresh broadcasters.');
    } finally {
      setLoading(false);
    }
  };

  return {
    broadcasters,
    loading,
    error,
    addBroadcaster,
    updateBroadcaster,
    deleteBroadcaster,
    getActiveBroadcasters,
    refetch,
  };
};

// Demo data for fallback when Firestore is not available
const generateDemoBroadcasters = (): Broadcaster[] => [
  {
    id: 'demo-broadcaster-1',
    name: 'Cairo LA7 – News Sponsorship',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-broadcaster-2',
    name: 'Mediaset – Prime Time',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-broadcaster-3',
    name: 'RAI – National Coverage',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-broadcaster-4',
    name: 'Sky Sport – Football Championship',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-broadcaster-5',
    name: 'Discovery Channel – Documentary Series',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-broadcaster-6',
    name: 'La7 – Talk Show Sponsorship',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-broadcaster-7',
    name: 'Sky – ATP Finals 2025',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];