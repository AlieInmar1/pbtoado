import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/shadcn/card';
import { Button } from '../../components/ui/shadcn/button';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  trend?: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, trend }) => {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-3xl font-bold">{value}</div>
          {trend && (
            <div className={`text-sm ${trend.startsWith('+') ? 'text-success-600' : trend.startsWith('-') ? 'text-error-600' : 'text-gray-500'}`}>
              {trend}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Welcome back, Demo User</h1>
        <div className="flex space-x-3">
          <Button variant="outline">Workspace Settings</Button>
          <Button variant="primary">Sync Now</Button>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-4">Current workspace: Main Workspace</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Features" 
            value={243} 
            description="Total features in ProductBoard" 
            trend="+12% from last month" 
          />
          
          <StatCard 
            title="Synced Items" 
            value={189} 
            description="Items synced with Azure DevOps" 
            trend="+8% from last month" 
          />
          
          <StatCard 
            title="Pending Sync" 
            value={37} 
            description="Items waiting to be synced" 
            trend="-5% from last week" 
          />
          
          <StatCard 
            title="Sync Errors" 
            value={3} 
            description="Errors during last sync" 
          />
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest synchronization activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium">Feature sync completed</p>
                  <p className="text-xs text-gray-500">35 features synced • 10 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-warning-100 flex items-center justify-center text-warning-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium">Sync warning</p>
                  <p className="text-xs text-gray-500">3 features with mapping conflicts • 2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-info-100 flex items-center justify-center text-info-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium">Hierarchy imported</p>
                  <p className="text-xs text-gray-500">Updated product hierarchy • Yesterday</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center">
                <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                New Board Sync
              </Button>
              
              <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center">
                <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Ranking
              </Button>
              
              <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center">
                <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Configure Mapping
              </Button>
              
              <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center">
                <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
