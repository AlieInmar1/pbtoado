import { useState, useEffect } from 'react';
import { MetricData, ChartDataPoint, TeamMetric } from '../types';

type TimeRange = '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

/**
 * Custom hook to fetch and process analytics data
 * @param timeRange The time range to fetch data for
 * @returns Object containing various analytics metrics and charts data
 */
export function useAnalyticsData(timeRange: TimeRange = '3m') {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState<MetricData[]>([]);
  
  // Team performance data
  const [teamMetrics, setTeamMetrics] = useState<TeamMetric[]>([]);
  
  // Story metrics
  const [storyCompletionData, setStoryCompletionData] = useState<ChartDataPoint[]>([]);
  const [complexityDistribution, setComplexityDistribution] = useState<ChartDataPoint[]>([]);
  const [storyPointsDistribution, setStoryPointsDistribution] = useState<ChartDataPoint[]>([]);
  
  // Trend data
  const [velocityTrend, setVelocityTrend] = useState<ChartDataPoint[]>([]);
  const [discussionTimeTrend, setDiscussionTimeTrend] = useState<ChartDataPoint[]>([]);
  const [storySplitTrend, setStorySplitTrend] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // In a real implementation, we would fetch data from the API
        // For now, we'll use mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set mock data based on the time range
        setSummaryMetrics(getMockSummaryMetrics(timeRange));
        setTeamMetrics(getMockTeamMetrics(timeRange));
        setStoryCompletionData(getMockStoryCompletionData(timeRange));
        setComplexityDistribution(getMockComplexityDistribution());
        setStoryPointsDistribution(getMockStoryPointsDistribution());
        setVelocityTrend(getMockVelocityTrend(timeRange));
        setDiscussionTimeTrend(getMockDiscussionTimeTrend(timeRange));
        setStorySplitTrend(getMockStorySplitTrend(timeRange));
        
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange]);

  return {
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
  };
}

// Mock data functions
function getMockSummaryMetrics(timeRange: TimeRange): MetricData[] {
  // Adjust values based on time range to simulate different periods
  const multiplier = timeRange === '1w' ? 1 : 
                    timeRange === '1m' ? 4 : 
                    timeRange === '3m' ? 12 : 
                    timeRange === '6m' ? 24 : 
                    timeRange === '1y' ? 52 : 60;
  
  return [
    {
      label: 'Stories Groomed',
      value: 24 * multiplier,
      change: 8,
      changeDirection: 'up'
    },
    {
      label: 'Avg. Discussion Time',
      value: 18, // minutes
      change: 2,
      changeDirection: 'down'
    },
    {
      label: 'Story Points Delivered',
      value: 87 * multiplier,
      change: 12,
      changeDirection: 'up'
    },
    {
      label: 'Stories Split',
      value: 7 * multiplier,
      change: 1,
      changeDirection: 'up'
    },
    {
      label: 'Avg. Complexity',
      value: 3.2,
      change: 0.1,
      changeDirection: 'down'
    }
  ];
}

function getMockTeamMetrics(timeRange: TimeRange): TeamMetric[] {
  return [
    {
      teamName: 'Frontend',
      completionRate: 0.92,
      averageDiscussionTime: 15,
      velocity: 32
    },
    {
      teamName: 'Backend',
      completionRate: 0.88,
      averageDiscussionTime: 22,
      velocity: 28
    },
    {
      teamName: 'Mobile',
      completionRate: 0.85,
      averageDiscussionTime: 18,
      velocity: 24
    },
    {
      teamName: 'DevOps',
      completionRate: 0.95,
      averageDiscussionTime: 12,
      velocity: 18
    }
  ];
}

function getMockStoryCompletionData(timeRange: TimeRange): ChartDataPoint[] {
  return [
    { name: 'Completed', value: 68 },
    { name: 'In Progress', value: 24 },
    { name: 'Not Started', value: 12 },
    { name: 'Blocked', value: 8 }
  ];
}

function getMockComplexityDistribution(): ChartDataPoint[] {
  return [
    { name: '1 (Simple)', value: 15 },
    { name: '2', value: 22 },
    { name: '3', value: 30 },
    { name: '4', value: 18 },
    { name: '5 (Complex)', value: 10 }
  ];
}

function getMockStoryPointsDistribution(): ChartDataPoint[] {
  return [
    { name: '1', value: 12 },
    { name: '2', value: 18 },
    { name: '3', value: 25 },
    { name: '5', value: 20 },
    { name: '8', value: 15 },
    { name: '13', value: 8 },
    { name: '21', value: 2 }
  ];
}

function getMockVelocityTrend(timeRange: TimeRange): ChartDataPoint[] {
  // Generate different number of data points based on time range
  const dataPoints = timeRange === '1w' ? 7 : 
                    timeRange === '1m' ? 4 : 
                    timeRange === '3m' ? 12 : 
                    timeRange === '6m' ? 24 : 
                    timeRange === '1y' ? 12 : 24;
  
  const result: ChartDataPoint[] = [];
  let baseValue = 25;
  
  for (let i = 0; i < dataPoints; i++) {
    // Add some randomness to the data
    const randomFactor = 0.8 + Math.random() * 0.4; // Between 0.8 and 1.2
    const value = Math.round(baseValue * randomFactor);
    
    // Gradually increase the base value to simulate improvement
    baseValue += 0.5;
    
    const periodName = timeRange === '1w' ? `Day ${i + 1}` : 
                      (timeRange === '1m' || timeRange === '3m') ? `Week ${i + 1}` : 
                      `Month ${i + 1}`;
    
    result.push({ name: periodName, value });
  }
  
  return result;
}

function getMockDiscussionTimeTrend(timeRange: TimeRange): ChartDataPoint[] {
  // Generate different number of data points based on time range
  const dataPoints = timeRange === '1w' ? 7 : 
                    timeRange === '1m' ? 4 : 
                    timeRange === '3m' ? 12 : 
                    timeRange === '6m' ? 24 : 
                    timeRange === '1y' ? 12 : 24;
  
  const result: ChartDataPoint[] = [];
  let baseValue = 22; // Start with higher value and decrease
  
  for (let i = 0; i < dataPoints; i++) {
    // Add some randomness to the data
    const randomFactor = 0.9 + Math.random() * 0.2; // Between 0.9 and 1.1
    const value = Math.round(baseValue * randomFactor);
    
    // Gradually decrease the base value to simulate improvement
    baseValue = Math.max(15, baseValue - 0.3);
    
    const periodName = timeRange === '1w' ? `Day ${i + 1}` : 
                      (timeRange === '1m' || timeRange === '3m') ? `Week ${i + 1}` : 
                      `Month ${i + 1}`;
    
    result.push({ name: periodName, value });
  }
  
  return result;
}

function getMockStorySplitTrend(timeRange: TimeRange): ChartDataPoint[] {
  // Generate different number of data points based on time range
  const dataPoints = timeRange === '1w' ? 7 : 
                    timeRange === '1m' ? 4 : 
                    timeRange === '3m' ? 12 : 
                    timeRange === '6m' ? 24 : 
                    timeRange === '1y' ? 12 : 24;
  
  const result: ChartDataPoint[] = [];
  
  for (let i = 0; i < dataPoints; i++) {
    // More random since story splitting is less predictable
    const value = Math.floor(Math.random() * 5) + 1; // Between 1 and 5
    
    const periodName = timeRange === '1w' ? `Day ${i + 1}` : 
                      (timeRange === '1m' || timeRange === '3m') ? `Week ${i + 1}` : 
                      `Month ${i + 1}`;
    
    result.push({ name: periodName, value });
  }
  
  return result;
}
