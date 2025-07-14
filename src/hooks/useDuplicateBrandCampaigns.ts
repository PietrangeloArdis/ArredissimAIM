import { useState } from 'react';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Campaign, Status } from '../types/campaign';

interface DuplicationOverrides {
  startDate: string;
  endDate: string;
  manager?: string;
  notes?: string;
  setAllToPlanned?: boolean;
  customStatus?: Status; // New field for custom status override
}

export const useDuplicateBrandCampaigns = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateStatusFromDates = (startDate: string, endDate: string): Status => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time to start of day for accurate comparison
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (now < start) {
      return 'PLANNED';
    } else if (now >= start && now <= end) {
      return 'ACTIVE';
    } else if (now > end) {
      return 'COMPLETED';
    }
    
    return 'PLANNED'; // fallback
  };

  const duplicateCampaignsByBrand = async (
    brand: string, 
    channel: string, 
    overrides: DuplicationOverrides
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Query campaigns for the specific brand AND channel
      const campaignsRef = collection(db, 'campaigns');
      const q = query(
        campaignsRef, 
        where('brand', '==', brand),
        where('channel', '==', channel)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error(`No campaigns found for brand "${brand}" in the ${channel} channel`);
      }

      const campaigns: Campaign[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        campaigns.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to ISO strings
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Campaign);
      });

      console.log(`Found ${campaigns.length} ${channel} campaigns for brand "${brand}"`);

      // Create duplicated campaigns
      const duplicatedCampaigns = campaigns.map((campaign) => {
        // ✅ NEW: Priority-based status assignment
        let newStatus: Status;
        
        // Priority 1: Custom status override (highest priority)
        if (overrides.customStatus) {
          newStatus = overrides.customStatus;
          console.log(`🎯 Using custom status override: ${overrides.customStatus}`);
        }
        // Priority 2: Set all to planned checkbox
        else if (overrides.setAllToPlanned) {
          newStatus = 'PLANNED';
          console.log(`📝 Using setAllToPlanned override: PLANNED`);
        }
        // Priority 3: Automatic date-based logic (fallback)
        else {
          newStatus = calculateStatusFromDates(overrides.startDate, overrides.endDate);
          console.log(`📅 Using date-based status: ${newStatus}`);
        }

        // Handle notes - add (Copy) only if not overridden
        let newNotes = campaign.notes || '';
        if (overrides.notes) {
          newNotes = overrides.notes;
        } else if (newNotes) {
          newNotes = `${newNotes} (Copy)`;
        } else {
          newNotes = '(Copy)';
        }

        // ✅ CRITICAL FIX: Remove id and other undefined fields before creating new campaign
        const { id, createdAt, updatedAt, ...campaignDataWithoutId } = campaign;

        return {
          ...campaignDataWithoutId,
          // Apply overrides
          startDate: overrides.startDate,
          endDate: overrides.endDate,
          manager: overrides.manager || campaign.manager,
          notes: newNotes,
          status: newStatus, // Use the priority-based status
        };
      });

      // Batch insert all duplicated campaigns
      const insertPromises = duplicatedCampaigns.map(async (campaignData, index) => {
        // ✅ Log campaigns that had undefined ids before insert (for debugging)
        const originalCampaign = campaigns[index];
        if (originalCampaign.id === undefined) {
          console.warn(`⚠️ Original campaign had undefined id:`, originalCampaign);
        }

        // ✅ Ensure no undefined values in the final data
        const cleanCampaignData = {
          ...campaignData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // ✅ Double-check: Remove any remaining undefined values
        Object.keys(cleanCampaignData).forEach(key => {
          if (cleanCampaignData[key as keyof typeof cleanCampaignData] === undefined) {
            delete cleanCampaignData[key as keyof typeof cleanCampaignData];
          }
        });

        const docRef = await addDoc(collection(db, 'campaigns'), cleanCampaignData);
        console.log(`✅ Duplicated ${channel} campaign: ${campaignData.brand} - ${campaignData.channel} (ID: ${docRef.id}) with status: ${campaignData.status}`);
        return docRef;
      });

      await Promise.all(insertPromises);

      console.log(`🎉 Successfully duplicated ${campaigns.length} ${channel} campaigns for brand "${brand}"`);
      
      return {
        success: true,
        duplicatedCount: campaigns.length,
        originalCampaigns: campaigns,
        channel,
      };

    } catch (err: any) {
      console.error('Error duplicating brand campaigns:', err);
      const errorMessage = err.message || 'Failed to duplicate campaigns. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    duplicateCampaignsByBrand,
    loading,
    error,
  };
};