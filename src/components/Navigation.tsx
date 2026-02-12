import React from 'react';

type TabType = 'dashboard' | 'doses' | 'dosage';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'doses', label: 'Doses' },
    { id: 'dosage', label: 'Dosage Calculator' }
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card-bg backdrop-blur-xl border-t border-card-border px-4 py-2 z-50 shadow-[0_-4px_20px_var(--shadow-color)]">
      <div className="flex justify-between items-center max-w-md mx-auto gap-1">
        {tabs.map((tab) => (
<button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className={`flex-1 flex flex-col items-center px-2 py-1.5 rounded-lg transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-accent-purple-light to-accent-purple-medium text-white shadow-theme'
                : 'text-text-muted hover:text-text-primary hover:bg-accent-purple-light/20'
            }`}
          >
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;