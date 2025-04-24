import React from 'react';
import { TabsList, TabsTrigger } from '../../../../components/ui/shadcn/tabs';
import { TabNavigationProps } from './types';

/**
 * TabNavigation component for navigating between tabs
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  setActiveTab 
}) => {
  return (
    <TabsList className="grid grid-cols-5 mb-4">
      <TabsTrigger 
        value="pb-to-ado" 
        onClick={() => setActiveTab('pb-to-ado')}
        className={activeTab === 'pb-to-ado' ? 'bg-primary text-white' : ''}
      >
        PB to ADO Types
      </TabsTrigger>
      <TabsTrigger 
        value="initiative-epic" 
        onClick={() => setActiveTab('initiative-epic')}
        className={activeTab === 'initiative-epic' ? 'bg-primary text-white' : ''}
      >
        Initiative/Epic Mapping
      </TabsTrigger>
      <TabsTrigger 
        value="component-product" 
        onClick={() => setActiveTab('component-product')}
        className={activeTab === 'component-product' ? 'bg-primary text-white' : ''}
      >
        Component/Product Mapping
      </TabsTrigger>
      <TabsTrigger 
        value="user-team" 
        onClick={() => setActiveTab('user-team')}
        className={activeTab === 'user-team' ? 'bg-primary text-white' : ''}
      >
        User Team Mappings
      </TabsTrigger>
      <TabsTrigger 
        value="area-paths" 
        onClick={() => setActiveTab('area-paths')}
        className={activeTab === 'area-paths' ? 'bg-primary text-white' : ''}
      >
        Area Path Mappings
      </TabsTrigger>
      {/* Removed mapping results tab since it's now a separate page */}
    </TabsList>
  );
};

export default TabNavigation;
