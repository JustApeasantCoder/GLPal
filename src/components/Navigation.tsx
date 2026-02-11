import React from 'react';

type TabType = 'dashboard' | 'weight' | 'glp1';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'weight', label: 'Weight' },
    { id: 'glp1', label: 'GLP-1' }
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-[#B19CD9]/20 px-4 py-2 z-50 shadow-[0_-4px_20px_rgba(177,156,217,0.15)]">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as TabType)}
            className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-500 ease-out transform ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_20px_rgba(177,156,217,0.4)] scale-110 translate-y-[-2px]'
                : 'text-gray-400 hover:text-[#B19CD9] hover:bg-[#B19CD9]/20 hover:shadow-[0_0_20px_rgba(177,156,217,0.3)] hover:scale-105 hover:translate-y-[-1px]'
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