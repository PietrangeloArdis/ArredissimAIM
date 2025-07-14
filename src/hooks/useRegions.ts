import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Region } from '../types/region';
import { seedRegionsIfEmpty } from '../utils/seedRegions';
import { useCollection } from './useCollection'; // <-- Importa il nuovo hook

export const useRegions = () => {
  const { data: regions, loading, error } = useCollection<Region>('regions');
  const [isSeeding, setIsSeeding] = useState(true);

  // La logica di "seeding" (popolamento iniziale) rimane separata
  useEffect(() => {
    const initialize = async () => {
      await seedRegionsIfEmpty();
      setIsSeeding(false);
    };
    initialize();
  }, []);

  const addRegion = async (region: Omit<Region, 'id'>) => {
    const regionData = { ...region, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    await addDoc(collection(db, 'regions'), regionData);
    // Non è più necessario aggiornare lo stato manualmente, onSnapshot lo farà per noi!
  };

  const updateRegion = async (id: string, updates: Partial<Region>) => {
    const regionRef = doc(db, 'regions', id);
    await updateDoc(regionRef, { ...updates, updatedAt: Timestamp.now() });
  };

  const deleteRegion = async (id: string) => {
    const regionRef = doc(db, 'regions', id);
    await deleteDoc(regionRef);
  };

  const getActiveRegions = (): Region[] => {
    return regions.filter(region => region.active);
  };
  
  const getRegionByName = (name: string): Region | undefined => {
    return regions.find(region => region.name === name);
  };

  return {
    regions,
    loading: loading || isSeeding, // Mostra caricamento mentre popola i dati
    error,
    addRegion,
    updateRegion,
    deleteRegion,
    getActiveRegions,
    getRegionByName,
  };
};