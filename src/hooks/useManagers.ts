import { useCollection } from './useCollection';
import { Manager } from '../types/manager';
import { addDoc, updateDoc, deleteDoc, doc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const useManagers = () => {
  const { data: managers, loading, error } = useCollection<Manager>('managers');

  const addManager = async (manager: Omit<Manager, 'id'>) => {
    const managerData = { ...manager, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    await addDoc(collection(db, 'managers'), managerData);
  };

  const updateManager = async (id: string, updates: Partial<Manager>) => {
    const managerRef = doc(db, 'managers', id);
    await updateDoc(managerRef, { ...updates, updatedAt: Timestamp.now() });
  };

  const deleteManager = async (id: string) => {
    const managerRef = doc(db, 'managers', id);
    await deleteDoc(managerRef);
  };
  
  const getActiveManagers = (): Manager[] => {
    return managers.filter(manager => manager.active);
  };

  return {
    managers,
    loading,
    error,
    addManager,
    updateManager,
    deleteManager,
    getActiveManagers,
  };
};