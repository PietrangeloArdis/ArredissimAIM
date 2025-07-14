import { useCollection } from './useCollection';
import { Broadcaster } from '../types/broadcaster';
import { addDoc, updateDoc, deleteDoc, doc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const useBroadcasters = () => {
  const { data: broadcasters, loading, error } = useCollection<Broadcaster>('broadcasters');

  const addBroadcaster = async (broadcaster: Omit<Broadcaster, 'id'>) => {
    const broadcasterData = { ...broadcaster, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    await addDoc(collection(db, 'broadcasters'), broadcasterData);
  };

  const updateBroadcaster = async (id: string, updates: Partial<Broadcaster>) => {
    const broadcasterRef = doc(db, 'broadcasters', id);
    await updateDoc(broadcasterRef, { ...updates, updatedAt: Timestamp.now() });
  };

  const deleteBroadcaster = async (id: string) => {
    const broadcasterRef = doc(db, 'broadcasters', id);
    await deleteDoc(broadcasterRef);
  };

  const getActiveBroadcasters = (): Broadcaster[] => {
    return broadcasters.filter(broadcaster => broadcaster.active);
  };

  return {
    broadcasters,
    loading,
    error,
    addBroadcaster,
    updateBroadcaster,
    deleteBroadcaster,
    getActiveBroadcasters,
  };
};