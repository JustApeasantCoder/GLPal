import React from 'react';

interface CollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
}

const Collapse: React.FC<CollapseProps> = ({ isOpen, children }) => {
  return (
    <div className={`collapse-content ${isOpen ? 'expanded' : 'collapsed'}`}>
      <div className="collapse-inner">
        {children}
      </div>
    </div>
  );
};

export default Collapse;
