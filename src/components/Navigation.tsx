import React from 'react';

type TabType = 'dashboard' | 'weight' | 'glp1' | 'dosage';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'weight', label: 'Weight' },
    { id: 'glp1', label: 'GLP-1' },
    { id: 'dosage', label: 'Dosage' }
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card-bg backdrop-blur-xl border-t border-card-border px-4 py-2 z-50 shadow-[0_-4px_20px_var(--shadow-color)]">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-500 ease-out transform ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white shadow-theme scale-110 translate-y-[-2px]'
                : 'text-text-muted hover:text-text-primary hover:bg-accent-purple-light/20 hover:shadow-theme hover:scale-105 hover:translate-y-[-1px]'
            }`}
          >
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;