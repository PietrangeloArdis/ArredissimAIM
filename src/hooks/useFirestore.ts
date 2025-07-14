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
import { Campaign, migrateStatus } from '../types/campaign';
import { getAuth } from 'firebase/auth';
const auth = getAuth();

export const useFirestore = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for campaigns
  useEffect(() => {
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const campaignData: Campaign[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            campaignData.push({
             ...data,
             id: doc.id,
              // Migrate legacy status values
              status: migrateStatus(data.status),
              // Convert Firestore Timestamps to ISO strings
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
              // Ensure channel-specific metrics are properly typed
              expectedGrps: data.expectedGrps || null,
              achievedGrps: data.achievedGrps || null,
              spotsPurchased: data.spotsPurchased || null,
              impressions: data.impressions || null,
              expectedViewers: data.expectedViewers || null,
              expectedViews: data.expectedViews || null,
            } as Campaign);
          });
          setCampaigns(campaignData);
          setError(null);
        } catch (err) {
          console.error('Error processing campaigns:', err);
          setError('Failed to load campaigns');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching campaigns:', err);
        setError('Failed to connect to database. Please check your internet connection.');
        setLoading(false);
        
        // Fallback to demo data if Firestore is not available
        const demoData = generateDemoData();
        setCampaigns(demoData);
      }
    );

    return () => unsubscribe();
  }, []);

  const addCampaign = async (campaign: Omit<Campaign, 'id'>) => {
    try {
      setError(null);
      
      // Clean up the campaign data before saving
      const cleanedCampaign = {
        ...campaign,
        // Convert null values to Firestore-compatible format
        expectedGrps: campaign.expectedGrps || null,
        achievedGrps: campaign.achievedGrps || null,
        spotsPurchased: campaign.spotsPurchased || null,
        impressions: campaign.impressions || null,
        expectedViewers: campaign.expectedViewers || null,
        expectedViews: campaign.expectedViews || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'campaigns'), cleanedCampaign);
      
      // Return the campaign with the new ID
      return {
        ...campaign,
        id: docRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Error adding campaign:', err);
      setError('Failed to add campaign. Please try again.');
      throw err;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      setError(null);
      const campaignRef = doc(db, 'campaigns', id);
      
      // Clean up the updates data
      const cleanedUpdates = {
        ...updates,
        // Ensure channel-specific metrics are properly handled
        expectedGrps: updates.expectedGrps || null,
        achievedGrps: updates.achievedGrps || null,
        spotsPurchased: updates.spotsPurchased || null,
        impressions: updates.impressions || null,
        expectedViewers: updates.expectedViewers || null,
        expectedViews: updates.expectedViews || null,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(campaignRef, cleanedUpdates);
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError('Failed to update campaign. Please try again.');
      throw err;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      setError(null);
      // 🔍 DEBUG: chi è l'utente corrente?
      console.log('[DEBUG] Firebase user before delete:', auth.currentUser);
      const campaignRef = doc(db, 'campaigns', id);
      await deleteDoc(campaignRef);
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Failed to delete campaign. Please try again.');
      throw err;
    }
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const campaignsRef = collection(db, 'campaigns');
      const q = query(campaignsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const campaignData: Campaign[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        campaignData.push({
          id: doc.id,
          ...data,
          // Migrate legacy status values
          status: migrateStatus(data.status),
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          // Ensure channel-specific metrics are properly typed
          expectedGrps: data.expectedGrps || null,
          achievedGrps: data.achievedGrps || null,
          spotsPurchased: data.spotsPurchased || null,
          impressions: data.impressions || null,
          expectedViewers: data.expectedViewers || null,
          expectedViews: data.expectedViews || null,
        } as Campaign);
      });
      
      setCampaigns(campaignData);
    } catch (err) {
      console.error('Error refetching campaigns:', err);
      setError('Failed to refresh campaigns.');
    } finally {
      setLoading(false);
    }
  };

  return {
    campaigns,
    loading,
    error,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    refetch,
  };
};

// Demo data for fallback when Firestore is not available
const generateDemoData = (): Campaign[] => [
  {
    id: 'demo-1',
    channel: 'Meta',
    brand: 'FC',
    region: 'Lazio',
    periodType: 'monthly',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    budget: 12000,
    roi: '1198%',
    costPerLead: 6.81,
    leads: 1762,
    manager: 'AG',
    status: 'ACTIVE', // Updated to new status
    notes: 'Special campaign in Rome',
    extraSocialBudget: 2500,
    extraSocialNotes: 'Boosted reel on launch day, IG Story Ads during promotion week',
    // Channel-specific metrics (null for non-applicable channels)
    expectedGrps: null,
    achievedGrps: null,
    spotsPurchased: null,
    impressions: null,
    expectedViewers: null,
    expectedViews: null,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-2',
    channel: 'Google',
    brand: 'ILMI',
    region: 'Emilia-Romagna',
    periodType: 'weekly',
    startDate: '2025-01-07',
    endDate: '2025-01-14',
    budget: 8500,
    roi: '892%',
    costPerLead: 8.45,
    leads: 1005,
    manager: 'MR',
    status: 'SCHEDULED', // Updated to new status
    notes: 'Bologna targeting',
    // Channel-specific metrics (null for non-applicable channels)
    expectedGrps: null,
    achievedGrps: null,
    spotsPurchased: null,
    impressions: null,
    expectedViewers: null,
    expectedViews: null,
    createdAt: '2025-01-07T00:00:00Z',
  },
  {
    id: 'demo-3',
    channel: 'TikTok',
    brand: 'ArredissimA',
    region: 'National',
    periodType: 'monthly',
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    budget: 15000,
    roi: '756%',
    costPerLead: 12.30,
    leads: 1220,
    manager: 'LC',
    status: 'ACTIVE', // Updated to new status
    notes: 'Gen Z targeting campaign',
    extraSocialBudget: 3000,
    extraSocialNotes: 'Spark Ads for viral content, TopView campaign for brand awareness',
    // Channel-specific metrics (null for non-applicable channels)
    expectedGrps: null,
    achievedGrps: null,
    spotsPurchased: null,
    impressions: null,
    expectedViewers: null,
    expectedViews: null,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-4',
    channel: 'TV',
    brand: 'ArredissimA',
    region: 'National',
    periodType: 'monthly',
    startDate: '2025-01-15',
    endDate: '2025-02-15',
    budget: 45000,
    roi: '320%',
    costPerLead: 0,
    leads: 0,
    manager: 'FP',
    status: 'ACTIVE', // Updated to new status
    notes: 'Prime time TV campaign',
    publisher: 'Sky – ATP Finals 2025',
    // TV-specific metrics
    expectedGrps: 150.5,
    achievedGrps: 142.3,
    spotsPurchased: 24,
    impressions: null,
    expectedViewers: null,
    expectedViews: null,
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'demo-5',
    channel: 'Radio',
    brand: 'FC',
    region: 'Lombardia',
    periodType: 'weekly',
    startDate: '2025-01-20',
    endDate: '2025-01-27',
    budget: 8500,
    roi: '180%',
    costPerLead: 0,
    leads: 0,
    manager: 'AG',
    status: 'SCHEDULED', // Updated to new status
    notes: 'Morning drive time slots',
    publisher: 'RAI – National Coverage',
    // Radio-specific metrics
    expectedGrps: null,
    achievedGrps: null,
    spotsPurchased: 48,
    impressions: 250000,
    expectedViewers: null,
    expectedViews: null,
    createdAt: '2025-01-20T00:00:00Z',
  },
];