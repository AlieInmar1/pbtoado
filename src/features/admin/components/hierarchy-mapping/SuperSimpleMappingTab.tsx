import React from 'react';

/**
 * A super simple component that just displays "Hello World"
 * This is used to test if the tab system is working correctly
 */
export const SuperSimpleMappingTab: React.FC = () => {
  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Super Simple Mapping Tab</h2>
      <p className="text-gray-700">Hello World! This is a super simple component to test if the tab system is working.</p>
    </div>
  );
};

export default SuperSimpleMappingTab;
