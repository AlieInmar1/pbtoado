import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useDatabase } from '../contexts/DatabaseContext';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { 
  HomeIcon, 
  RectangleGroupIcon,
  AdjustmentsHorizontalIcon,
  LinkIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export function Dashboard() {
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
  const { syncRecords, productboardFeatures, loading: dbLoading } = useDatabase();
  const [recentSyncs, setRecentSyncs] = useState<any[]>([]);
  const [syncsLoading, setSyncsLoading] = useState(true);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [featureStats, setFeatureStats] = useState({
    total: 0,
    synced: 0,
    notSynced: 0,
    conflict: 0
  });

  useEffect(() => {
    if (currentWorkspace) {
      loadData();
    }
  }, [currentWorkspace]);

  const loadData = async () => {
    if (!currentWorkspace) return;

    // Load recent syncs
    setSyncsLoading(true);
    try {
      const syncs = await syncRecords.getRecent(currentWorkspace.id, 5);
      setRecentSyncs(syncs);
    } catch (error) {
      console.error('Failed to load sync history:', error);
    } finally {
      setSyncsLoading(false);
    }

    // Load feature stats
    setFeaturesLoading(true);
    try {
      const features = await productboardFeatures.getAll(currentWorkspace.id);
      
      const stats = {
        total: features.length,
        synced: features.filter(f => f.sync_status === 'synced').length,
        notSynced: features.filter(f => !f.sync_status || f.sync_status === 'not_synced').length,
        conflict: features.filter(f => f.sync_status === 'conflict').length
      };
      
      setFeatureStats(stats);
    } catch (error) {
      console.error('Failed to load features:', error);
    } finally {
      setFeaturesLoading(false);
    }
  };

  if (workspaceLoading || dbLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mb-4"></div>
        <p className="text-gray-500">Loading data...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <Card className="p-8 border shadow-lg text-center" elevation="medium">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <HomeIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Workspace Selected</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Please select a workspace from the dropdown in the navigation bar to get started.
        </p>
        <Button variant="primary" rounded="full">
          Select Workspace
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome to {currentWorkspace.name}</h1>
          <p className="text-gray-500">
            View and manage synchronization between ProductBoard and Azure DevOps
          </p>
        </div>
        <Button 
          variant="gradient"
          rounded="full"
          className="group"
          startIcon={<ArrowPathIcon className="h-4 w-4" />}
        >
          Sync Now
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden" gradient hoverEffect>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 p-3 rounded-xl">
              <RectangleGroupIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                {featuresLoading ? (
                  <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  featureStats.total
                )}
              </h2>
              <p className="text-sm font-medium text-gray-500">Total Features</p>
            </div>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden" gradient hoverEffect>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 p-3 rounded-xl">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                {featuresLoading ? (
                  <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  featureStats.synced
                )}
              </h2>
              <p className="text-sm font-medium text-gray-500">Synced Items</p>
            </div>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden" gradient hoverEffect>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-xl">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                {featuresLoading ? (
                  <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  featureStats.notSynced
                )}
              </h2>
              <p className="text-sm font-medium text-gray-500">Unsynced Items</p>
            </div>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden" gradient hoverEffect>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 p-3 rounded-xl">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                {featuresLoading ? (
                  <div className="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  featureStats.conflict
                )}
              </h2>
              <p className="text-sm font-medium text-gray-500">Conflicts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Syncs */}
      <Card className="overflow-hidden" elevation="medium">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Synchronizations</h2>
          <Button 
            variant="secondary" 
            size="sm"
            startIcon={<ArrowPathIcon className="h-4 w-4" />}
            onClick={loadData}
            isLoading={syncsLoading}
          >
            Refresh
          </Button>
        </div>
        
        <div className="px-6 py-4">
          {syncsLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : recentSyncs.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ClockIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No Sync History</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                No synchronization records found for this workspace.
                Start syncing your ProductBoard and Azure DevOps data.
              </p>
              <Button className="mt-4" variant="primary" size="sm">
                Start Synchronization
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSyncs.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.sync_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.status === 'success' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Success
                          </span>
                        ) : record.status === 'failed' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{record.items_processed} total</span>
                          <span className="text-xs text-gray-500">
                            {record.items_created} created, {record.items_updated} updated, {record.items_failed} failed
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(record.duration_ms / 1000).toFixed(2)}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-right">
          <Link to="/sync-history">
            <Button 
              variant="secondary" 
              size="sm" 
              className="text-primary-600"
              endIcon={<ChevronRightIcon className="h-4 w-4" />}
            >
              View All History
            </Button>
          </Link>
        </div>
      </Card>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/hierarchy" className="block">
          <Card className="h-full p-6" interactive hoverEffect>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 rounded-xl bg-primary-100">
                <RectangleGroupIcon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="ml-4 text-lg font-medium text-gray-900">Hierarchy Explorer</h3>
            </div>
            <p className="text-gray-500 mb-4">
              View and manage the complete hierarchy of ProductBoard and Azure DevOps items.
            </p>
            <div className="flex items-center text-primary-600 font-medium text-sm mt-auto">
              <span>Explore hierarchy</span>
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </div>
          </Card>
        </Link>
        
        <Link to="/features" className="block">
          <Card className="h-full p-6" interactive hoverEffect>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 rounded-xl bg-blue-100">
                <AdjustmentsHorizontalIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="ml-4 text-lg font-medium text-gray-900">Feature Management</h3>
            </div>
            <p className="text-gray-500 mb-4">
              Manage ProductBoard features and their mappings to Azure DevOps items.
            </p>
            <div className="flex items-center text-blue-600 font-medium text-sm mt-auto">
              <span>Manage features</span>
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </div>
          </Card>
        </Link>
        
        <Link to="/grooming" className="block">
          <Card className="h-full p-6" interactive hoverEffect>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 p-3 rounded-xl bg-green-100">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="ml-4 text-lg font-medium text-gray-900">Grooming Sessions</h3>
            </div>
            <p className="text-gray-500 mb-4">
              Run AI-enhanced grooming sessions to refine, split, and estimate stories.
            </p>
            <div className="flex items-center text-green-600 font-medium text-sm mt-auto">
              <span>Start grooming</span>
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
