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
import { Channel, getDefaultKPIsForChannel, getDefaultSubGroupingForChannel, getDefaultTypeForChannel } from '../types/channel';

export const useChannels = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time listener for channels
  useEffect(() => {
    const channelsRef = collection(db, 'channels');
    const q = query(channelsRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const channelData: Channel[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            channelData.push({
              id: doc.id,
              ...data,
              // Ensure type, visibleKpis and subGroupingKey are properly handled
              type: data.type || getDefaultTypeForChannel(data.name),
              visibleKpis: data.visibleKpis || getDefaultKPIsForChannel(data.name),
              subGroupingKey: data.subGroupingKey !== undefined ? data.subGroupingKey : getDefaultSubGroupingForChannel(data.name),
              // Convert Firestore Timestamps to ISO strings
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            } as Channel);
          });
          setChannels(channelData);
          setError(null);
        } catch (err) {
          console.error('Error processing channels:', err);
          setError('Failed to load channels');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching channels:', err);
        setError('Failed to connect to database. Please check your internet connection.');
        setLoading(false);
        
        // Fallback to demo data if Firestore is not available
        const demoData = generateDemoChannels();
        setChannels(demoData);
      }
    );

    return () => unsubscribe();
  }, []);

  const addChannel = async (channel: Omit<Channel, 'id'>) => {
    try {
      setError(null);
      
      // Check for duplicate names
      const existingChannel = channels.find(
        c => c.name.toLowerCase() === channel.name.toLowerCase()
      );
      
      if (existingChannel) {
        throw new Error(`Channel "${channel.name}" already exists`);
      }

      // Ensure type, visibleKpis and subGroupingKey are set
      const channelData = {
        ...channel,
        type: channel.type || getDefaultTypeForChannel(channel.name),
        visibleKpis: channel.visibleKpis || getDefaultKPIsForChannel(channel.name),
        subGroupingKey: channel.subGroupingKey !== undefined ? channel.subGroupingKey : getDefaultSubGroupingForChannel(channel.name),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'channels'), channelData);
      
      // Return the channel with the new ID
      return {
        ...channel,
        id: docRef.id,
        type: channelData.type,
        visibleKpis: channelData.visibleKpis,
        subGroupingKey: channelData.subGroupingKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('Error adding channel:', err);
      const errorMessage = err.message || 'Failed to add channel. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateChannel = async (id: string, updates: Partial<Channel>) => {
    try {
      setError(null);
      
      // Check for duplicate names if name is being updated
      if (updates.name) {
        const existingChannel = channels.find(
          c => c.name.toLowerCase() === updates.name!.toLowerCase() && c.id !== id
        );
        
        if (existingChannel) {
          throw new Error(`Channel "${updates.name}" already exists`);
        }
      }

      const channelRef = doc(db, 'channels', id);
      const updateData = {
        ...updates,
        // Ensure type, visibleKpis and subGroupingKey are properly handled
        type: updates.type || (updates.name ? getDefaultTypeForChannel(updates.name) : undefined),
        visibleKpis: updates.visibleKpis || (updates.name ? getDefaultKPIsForChannel(updates.name) : undefined),
        subGroupingKey: updates.subGroupingKey !== undefined ? updates.subGroupingKey : (updates.name ? getDefaultSubGroupingForChannel(updates.name) : undefined),
        updatedAt: Timestamp.now(),
      };

      await updateDoc(channelRef, updateData);
    } catch (err: any) {
      console.error('Error updating channel:', err);
      const errorMessage = err.message || 'Failed to update channel. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteChannel = async (id: string) => {
    try {
      setError(null);
      const channelRef = doc(db, 'channels', id);
      await deleteDoc(channelRef);
    } catch (err) {
      console.error('Error deleting channel:', err);
      setError('Failed to delete channel. Please try again.');
      throw err;
    }
  };

  const getActiveChannels = (): Channel[] => {
    return channels.filter(channel => channel.active);
  };

  const getChannelByName = (name: string): Channel | undefined => {
    return channels.find(channel => channel.name === name);
  };

  const getVisibleKPIsForChannel = (channelName: string): string[] => {
    const channel = getChannelByName(channelName);
    return channel?.visibleKpis || getDefaultKPIsForChannel(channelName);
  };

  const getSubGroupingForChannel = (channelName: string): string | null => {
    const channel = getChannelByName(channelName);
    return channel?.subGroupingKey !== undefined ? channel.subGroupingKey : getDefaultSubGroupingForChannel(channelName);
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const channelsRef = collection(db, 'channels');
      const q = query(channelsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      const channelData: Channel[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        channelData.push({
          id: doc.id,
          ...data,
          type: data.type || getDefaultTypeForChannel(data.name),
          visibleKpis: data.visibleKpis || getDefaultKPIsForChannel(data.name),
          subGroupingKey: data.subGroupingKey !== undefined ? data.subGroupingKey : getDefaultSubGroupingForChannel(data.name),
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Channel);
      });
      
      setChannels(channelData);
    } catch (err) {
      console.error('Error refetching channels:', err);
      setError('Failed to refresh channels.');
    } finally {
      setLoading(false);
    }
  };

  return {
    channels,
    loading,
    error,
    addChannel,
    updateChannel,
    deleteChannel,
    getActiveChannels,
    getChannelByName,
    getVisibleKPIsForChannel,
    getSubGroupingForChannel,
    refetch,
  };
};

// Demo data for fallback when Firestore is not available
const generateDemoChannels = (): Channel[] => [
  {
    id: 'demo-channel-1',
    name: 'Meta',
    active: true,
    type: 'digital',
    color: '#1877f2',
    icon: 'Facebook',
    visibleKpis: ['leads', 'cpl', 'roi', 'clicks', 'ctr'],
    subGroupingKey: 'campaign',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-channel-2',
    name: 'Google',
    active: true,
    type: 'digital',
    color: '#ea4335',
    icon: 'Search',
    visibleKpis: ['leads', 'cpl', 'roi', 'clicks', 'ctr'],
    subGroupingKey: 'campaign',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-channel-3',
    name: 'TikTok',
    active: true,
    type: 'digital',
    color: '#ff0050',
    icon: 'Music',
    visibleKpis: ['leads', 'cpl', 'roi', 'clicks', 'ctr'],
    subGroupingKey: 'campaign',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-channel-4',
    name: 'Pinterest',
    active: true,
    type: 'digital',
    color: '#bd081c',
    icon: 'Image',
    visibleKpis: ['leads', 'cpl', 'roi', 'clicks', 'ctr'],
    subGroupingKey: 'campaign',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-channel-5',
    name: 'TV',
    active: true,
    type: 'traditional',
    color: '#8b5cf6',
    icon: 'Tv',
    visibleKpis: ['expectedGrps', 'achievedGrps', 'spotsPurchased'],
    subGroupingKey: 'broadcaster',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'demo-channel-6',
    name: 'Radio',
    active: true,
    type: 'traditional',
    color: '#10b981',
    icon: 'Radio',
    visibleKpis: ['spotsPurchased', 'impressions'],
    subGroupingKey: 'broadcaster',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];