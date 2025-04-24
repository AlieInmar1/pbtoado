import React, { useState } from 'react';
import { MetricsOverview } from './MetricsOverview';
import { TeamPerformance } from './TeamPerformance';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';

type TimeRange = '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('3m');
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const {
    summaryMetrics,
    teamMetrics,
    storyCompletionData,
    complexityDistribution,
    storyPointsDistribution,
    velocityTrend,
    discussionTimeTrend,
    storySplitTrend,
    isLoading,
    error
  } = useAnalyticsData(timeRange);
  
  // Format time range for display
  const getTimeRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case '1w': return 'Last Week';
      case '1m': return 'Last Month';
      case '3m': return 'Last 3 Months';
      case '6m': return 'Last 6 Months';
      case '1y': return 'Last Year';
      case 'all': return 'All Time';
      default: return 'Last 3 Months';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error.message}</span>
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="time-range" className="text-sm font-medium text-gray-700">
            Time Range:
          </label>
          <select 
            id="time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1w">Last Week</option>
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              className={`${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`${
                activeTab === 'teams'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('teams')}
            >
              Team Performance
            </button>
            <button
              className={`${
                activeTab === 'stories'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('stories')}
            >
              Story Metrics
            </button>
            <button
              className={`${
                activeTab === 'trends'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('trends')}
            >
              Trend Analysis
            </button>
          </nav>
        </div>
      </div>
      
      <div>
        {activeTab === 'overview' && (
          <MetricsOverview 
            metrics={summaryMetrics} 
            timeRange={getTimeRangeLabel(timeRange)} 
          />
        )}
        
        {activeTab === 'teams' && (
          <TeamPerformance 
            teamMetrics={teamMetrics} 
            timeRange={getTimeRangeLabel(timeRange)} 
          />
        )}
        
        {activeTab === 'stories' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Story Metrics</h2>
            <p className="text-gray-500">
              Story metrics visualization would be implemented here, showing completion rates,
              complexity distribution, and story points distribution.
            </p>
          </div>
        )}
        
        {activeTab === 'trends' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trend Analysis</h2>
            <p className="text-gray-500">
              Trend analysis visualization would be implemented here, showing velocity trends,
              discussion time trends, and story splitting trends over time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
