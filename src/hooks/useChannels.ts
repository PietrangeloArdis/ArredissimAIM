import { useCollection } from './useCollection';
import { Channel, getDefaultKPIsForChannel, getDefaultSubGroupingForChannel } from '../types/channel';
import { addDoc, updateDoc, deleteDoc, doc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const useChannels = () => {
  const { data: channels, loading, error } = useCollection<Channel>('channels');

  const addChannel = async (channel: Omit<Channel, 'id'>) => {
    const channelData = { ...channel, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    await addDoc(collection(db, 'channels'), channelData);
  };

  const updateChannel = async (id: string, updates: Partial<Channel>) => {
    const channelRef = doc(db, 'channels', id);
    await updateDoc(channelRef, { ...updates, updatedAt: Timestamp.now() });
  };

  const deleteChannel = async (id: string) => {
    const channelRef = doc(db, 'channels', id);
    await deleteDoc(channelRef);
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
  };
};