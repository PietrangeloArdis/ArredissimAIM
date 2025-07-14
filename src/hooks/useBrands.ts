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
  Timestamp,
  where 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Brand } from '../types/brand';

export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for brands
  useEffect(() => {
    const brandsRef = collection(db, 'brands');
    const q = query(brandsRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const brandData: Brand[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            brandData.push({
              id: doc.id,
              ...data,
              // Convert Firestore Timestamps to ISO strings
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            } as Brand);
          });
          setBrands(brandData);
          setError(null);
        } catch (err) {
          console.error('Error processing brands:', err);
          setError('Failed to load brands');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching brands:', err);
        setError('Failed to connect to database. Please check your internet connection.');
        setLoading(false);
        
        // Fallback to demo data if Firestore is not available
        const demoData = generateDemoBrands();
        setBrands(demoData);
      }
    );

    return () => unsubscribe();
  }, []);

  const addBrand = async (brand: Omit<Brand, 'id'>) => {
    try {
      setError(null);
      const brandData = {
        ...brand,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'brands'), brandData);
      
      // Return the brand with the new ID
      return {
        ...brand,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Error adding brand:', err);
      setError('Failed to add brand. Please try again.');
      throw err;
    }
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    try {
      setError(null);
      const brandRef = doc(db, 'brands', id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(brandRef, updateData);
    } catch (err) {
      console.error('Error updating brand:', err);
      setError('Failed to update brand. Please try again.');
      throw err;
    }
  };

  const deleteBrand = async (id: string) => {
    try {
      setError(null);
      const brandRef = doc(db, 'brands', id);
      await deleteDoc(brandRef);
    } catch (err) {
      console.error('Error deleting brand:', err);
      setError('Failed to delete brand. Please try again.');
      throw err;
    }
  };

  const getActiveBrandsForChannel = (channel: string): Brand[] => {
    return brands.filter(brand => 
      brand.active && brand.channels.includes(channel)
    );
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const brandsRef = collection(db, 'brands');
      const q = query(brandsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const brandData: Brand[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        brandData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Brand);
      });
      
      setBrands(brandData);
    } catch (err) {
      console.error('Error refetching brands:', err);
      setError('Failed to refresh brands.');
    } finally {
      setLoading(false);
    }
  };

  return {
    brands,
    loading,
    error,
    addBrand,
    updateBrand,
    deleteBrand,
    getActiveBrandsForChannel,
    refetch,
  };
};

// Demo data for fallback when Firestore is not available
const generateDemoBrands = (): Brand[] => [
  {
    id: 'demo-brand-1',
    name: 'FC',
    channels: ['Meta', 'Google'],
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-brand-2',
    name: 'ILMI',
    channels: ['Meta', 'Google'],
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-brand-3',
    name: 'ARD',
    channels: ['Meta', 'Google'],
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-brand-4',
    name: 'FM',
    channels: ['Meta', 'Google'],
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-brand-5',
    name: 'ArredissimA',
    channels: ['TikTok', 'Pinterest', 'TV', 'Radio'],
    active: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];