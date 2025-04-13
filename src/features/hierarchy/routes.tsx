import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/shadcn/card';
import { Button } from '../../components/ui/shadcn/button';

// Mock data for hierarchy
const MOCK_HIERARCHY = [
  { id: 'p1', name: 'Platform', type: 'product', children: ['f1', 'f2'] },
  { id: 'p2', name: 'Mobile App', type: 'product', children: ['f3'] },
  { id: 'f1', name: 'User Authentication', type: 'feature', parent: 'p1' },
  { id: 'f2', name: 'Feature Sync Engine', type: 'feature', parent: 'p1' },
  { id: 'f3', name: 'Interactive Dashboard', type: 'feature', parent: 'p2' },
  { id: 'c1', name: 'Login Component', type: 'component', parent: 'f1' },
];

// Simple recursive renderer for hierarchy items
const renderHierarchyItem = (itemId: string, level = 0) => {
  const item = MOCK_HIERARCHY.find(i => i.id === itemId);
  if (!item) return null;

  const children = MOCK_HIERARCHY.filter(i => i.parent === itemId);

  return (
    <div key={item.id} style={{ marginLeft: `${level * 20}px` }} className="mb-2 p-2 border-l-2 border-gray-200">
      <span className={`font-medium ${item.type === 'product' ? 'text-blue-600' : 'text-gray-800'}`}>
        {item.name} ({item.type})
      </span>
      {children.length > 0 && (
        <div className="mt-1">
          {children.map(child => renderHierarchyItem(child.id, level + 1))}
        </div>
      )}
    </div>
  );
};

/**
 * HierarchyView component displays the ProductBoard product hierarchy.
 */
const HierarchyView: React.FC = () => {
  const topLevelItems = MOCK_HIERARCHY.filter(item => !item.parent);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Product Hierarchy</h1>
        <Button variant="primary">Sync Hierarchy</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hierarchy Structure</CardTitle>
          <CardDescription>Visual representation of Products, Features, and Components.</CardDescription>
        </CardHeader>
        <CardContent>
          {topLevelItems.length > 0 ? (
            topLevelItems.map(item => renderHierarchyItem(item.id))
          ) : (
            <p className="text-gray-500">No hierarchy data found. Try syncing.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Define routes for the hierarchy feature
export const hierarchyRoutes = [
  {
    path: '/hierarchy',
    element: <HierarchyView />,
  }
];
