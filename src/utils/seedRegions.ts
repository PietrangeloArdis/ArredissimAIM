import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Original static regions that were hardcoded in CampaignForm
const ORIGINAL_REGIONS = [
  'National',
  'Lazio', 
  'Lombardia',
  'Emilia-Romagna',
  'Toscana',
  'Piemonte',
  'Veneto'
];

export const seedRegionsIfEmpty = async (): Promise<void> => {
  try {
    console.log('Checking if regions collection needs seeding...');
    
    // Check if regions collection already has data
    const regionsRef = collection(db, 'regions');
    const snapshot = await getDocs(regionsRef);
    
    if (snapshot.empty) {
      console.log('Regions collection is empty. Seeding with original regions...');
      
      // Add each original region to Firestore
      const seedPromises = ORIGINAL_REGIONS.map(async (regionName) => {
        const regionData = {
          name: regionName,
          active: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        try {
          const docRef = await addDoc(regionsRef, regionData);
          console.log(`✅ Seeded region: ${regionName} (ID: ${docRef.id})`);
          return docRef;
        } catch (error) {
          console.error(`❌ Failed to seed region: ${regionName}`, error);
          throw error;
        }
      });
      
      await Promise.all(seedPromises);
      console.log(`🎉 Successfully seeded ${ORIGINAL_REGIONS.length} regions to Firestore!`);
      
    } else {
      console.log(`✅ Regions collection already contains ${snapshot.size} regions. No seeding needed.`);
      
      // Log existing regions for verification
      const existingRegions = snapshot.docs.map(doc => doc.data().name);
      console.log('Existing regions:', existingRegions);
    }
    
  } catch (error) {
    console.error('❌ Error during region seeding:', error);
    
    // Don't throw the error to prevent app crashes
    // The app will fall back to demo data if Firestore is unavailable
    console.warn('⚠️ Region seeding failed, but app will continue with fallback data');
  }
};

// Helper function to check if a region name exists (case-insensitive)
export const checkRegionExists = async (regionName: string): Promise<boolean> => {
  try {
    const regionsRef = collection(db, 'regions');
    const snapshot = await getDocs(regionsRef);
    
    return snapshot.docs.some(doc => 
      doc.data().name.toLowerCase() === regionName.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking region existence:', error);
    return false;
  }
};

// Helper function to get region statistics
export const getRegionStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  names: string[];
}> => {
  try {
    const regionsRef = collection(db, 'regions');
    const snapshot = await getDocs(regionsRef);
    
    const regions = snapshot.docs.map(doc => doc.data());
    const active = regions.filter(r => r.active).length;
    const inactive = regions.length - active;
    const names = regions.map(r => r.name).sort();
    
    return {
      total: regions.length,
      active,
      inactive,
      names
    };
  } catch (error) {
    console.error('Error getting region stats:', error);
    return { total: 0, active: 0, inactive: 0, names: [] };
  }
};