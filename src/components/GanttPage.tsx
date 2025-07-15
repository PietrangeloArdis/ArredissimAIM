import React from 'react';
import { Campaign } from '../types/campaign';
import { GanttChart } from './charts/GanttChart';
import { LayoutGrid } from 'lucide-react';

interface GanttPageProps {
  campaigns: Campaign[];
}

export const GanttPage: React.FC<GanttPageProps> = ({ campaigns }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gantt Generale Campagne</h2>
          <p className="text-gray-600 mt-1">
            Visione d'insieme temporale di tutte le campagne attive e pianificate.
          </p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
            <LayoutGrid className="w-5 h-5 text-blue-600"/>
            Timeline Panoramica
        </div>
        <GanttChart campaigns={campaigns} />
      </div>
    </div>
  );
};