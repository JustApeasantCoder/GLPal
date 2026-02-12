import React, { useState } from 'react';
import { TabContent } from './TabContent';

export type TabType = 'dashboard' | 'glp1' | 'dosage';

interface TabManagerProps {
  onTabChange: (tab: TabType) => void;
  activeTab: TabType;
  children: Array<{
    id: TabType;
    component: React.ReactNode;
  }>;
}

export const TabManager: React.FC<TabManagerProps> = ({ 
  activeTab, 
  onTabChange, 
  children 
}) => {
  return (
    <div className="relative min-h-[400px]">
      {children.map((tab) => (
        <TabContent 
          key={tab.id}
          isActive={activeTab === tab.id}
        >
          {tab.component}
        </TabContent>
      ))}
    </div>
  );
};