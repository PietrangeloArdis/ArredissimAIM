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
import { Region } from '../types/region';
import { seedRegionsIfEmpty } from '../utils/seedRegions';

export const useRegions = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Real-time listener for regions with automatic seeding
  useEffect(() => {
    const initializeRegions = async () => {
      try {
        // First, try to seed regions if collection is empty
        if (!seeded) {
          await seedRegionsIfEmpty();
          setSeeded(true);
        }
      } catch (err) {
        console.warn('Region seeding failed, continuing with real-time listener:', err);
      }

      // Set up real-time listener
      const regionsRef = collection(db, 'regions');
      const q = query(regionsRef, orderBy('name', 'asc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const regionData: Region[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              regionData.push({
                id: doc.id,
                ...data,
                // Convert Firestore Timestamps to ISO strings
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
              } as Region);
            });
            
            setRegions(regionData);
            setError(null);
            
            // Log successful load
            console.log(`📍 Loaded ${regionData.length} regions from Firestore`);
            
          } catch (err) {
            console.error('Error processing regions:', err);
            setError('Failed to load regions');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error('Error fetching regions:', err);
          setError('Failed to connect to database. Please check your internet connection.');
          setLoading(false);
          
          // Fallback to demo data if Firestore is not available
          const demoData = generateDemoRegions();
          setRegions(demoData);
          console.log('📍 Using demo regions as fallback');
        }
      );

      return unsubscribe;
    };

    const unsubscribePromise = initializeRegions();
    
    // Cleanup function
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [seeded]);

  const addRegion = async (region: Omit<Region, 'id'>) => {
    try {
      setError(null);
      
      // Check for duplicate names
      const existingRegion = regions.find(
        r => r.name.toLowerCase() === region.name.toLowerCase()
      );
      
      if (existingRegion) {
        throw new Error(`Region "${region.name}" already exists`);
      }

      const regionData = {
        ...region,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'regions'), regionData);
      console.log(`✅ Added region: ${region.name} (ID: ${docRef.id})`);
      
      // Return the region with the new ID
      return {
        ...region,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Error adding region:', err);
      const errorMessage = err.message || 'Failed to add region. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateRegion = async (id: string, updates: Partial<Region>) => {
    try {
      setError(null);
      
      // Check for duplicate names if name is being updated
      if (updates.name) {
        const existingRegion = regions.find(
          r => r.name.toLowerCase() === updates.name!.toLowerCase() && r.id !== id
        );
        
        if (existingRegion) {
          throw new Error(`Region "${updates.name}" already exists`);
        }
      }

      const regionRef = doc(db, 'regions', id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(regionRef, updateData);
      console.log(`✅ Updated region: ${id}`);
    } catch (err: any) {
      console.error('Error updating region:', err);
      const errorMessage = err.message || 'Failed to update region. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteRegion = async (id: string) => {
    try {
      setError(null);
      const regionRef = doc(db, 'regions', id);
      await deleteDoc(regionRef);
      console.log(`✅ Deleted region: ${id}`);
    } catch (err) {
      console.error('Error deleting region:', err);
      setError('Failed to delete region. Please try again.');
      throw err;
    }
  };

  const getActiveRegions = (): Region[] => {
    return regions.filter(region => region.active);
  };

  const getRegionByName = (name: string): Region | undefined => {
    return regions.find(region => region.name === name);
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try seeding again if needed
      if (!seeded) {
        await seedRegionsIfEmpty();
        setSeeded(true);
      }
      
      const regionsRef = collection(db, 'regions');
      const q = query(regionsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const regionData: Region[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        regionData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Region);
      });
      
      setRegions(regionData);
      console.log(`📍 Refetched ${regionData.length} regions`);
    } catch (err) {
      console.error('Error refetching regions:', err);
      setError('Failed to refresh regions.');
    } finally {
      setLoading(false);
    }
  };

  return {
    regions,
    loading,
    error,
    addRegion,
    updateRegion,
    deleteRegion,
    getActiveRegions,
    getRegionByName,
    refetch,
  };
};

// Demo data for fallback when Firestore is not available
const generateDemoRegions = (): Region[] => [
  {
    id: 'demo-region-1',
    name: 'National',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-region-2',
    name: 'Lazio',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-region-3',
    name: 'Lombardia',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-region-4',
    name: 'Emilia-Romagna',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-region-5',
    name: 'Toscana',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-region-6',
    name: 'Piemonte',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-region-7',
    name: 'Veneto',
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];