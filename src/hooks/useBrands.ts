import { useCollection } from './useCollection';
import { Brand } from '../types/brand';
import { addDoc, updateDoc, deleteDoc, doc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const useBrands = () => {
  const { data: brands, loading, error } = useCollection<Brand>('brands');

  const addBrand = async (brand: Omit<Brand, 'id'>) => {
    const brandData = { ...brand, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    await addDoc(collection(db, 'brands'), brandData);
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    const brandRef = doc(db, 'brands', id);
    await updateDoc(brandRef, { ...updates, updatedAt: Timestamp.now() });
  };

  const deleteBrand = async (id: string) => {
    const brandRef = doc(db, 'brands', id);
    await deleteDoc(brandRef);
  };
  
  const getActiveBrandsForChannel = (channel: string): Brand[] => {
    return brands.filter(brand => brand.active && brand.channels.includes(channel));
  };

  return {
    brands,
    loading,
    error,
    addBrand,
    updateBrand,
    deleteBrand,
    getActiveBrandsForChannel,
  };
};