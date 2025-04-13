import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/shadcn/card';
import { Button } from '../../components/ui/shadcn/button';
import { Input } from '../../components/ui/shadcn/input'; // Corrected path
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/shadcn/select'; // Corrected path

// Mock data types
interface RankingResult {
  id: string;
  featureName: string;
  score: number;
  rank: number;
  segment: string;
}

// Mock data
const MOCK_RANKINGS: RankingResult[] = [
  { id: 'r1', featureName: 'Feature Sync Engine', score: 95, rank: 1, segment: 'Enterprise Customers' },
  { id: 'r2', featureName: 'User Authentication', score: 88, rank: 2, segment: 'Enterprise Customers' },
  { id: 'r3', featureName: 'Interactive Dashboard', score: 82, rank: 3, segment: 'Enterprise Customers' },
  { id: 'r4', featureName: 'Feature Sync Engine', score: 92, rank: 1, segment: 'SMB Customers' },
  { id: 'r5', featureName: 'Interactive Dashboard', score: 85, rank: 2, segment: 'SMB Customers' },
  { id: 'r6', featureName: 'Custom Fields Mapping', score: 78, rank: 3, segment: 'SMB Customers' },
];

/**
 * RankingsView component displays ProductBoard feature rankings.
 */
const RankingsView: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('Enterprise Customers');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const segments = Array.from(new Set(MOCK_RANKINGS.map(r => r.segment)));

  const filteredRankings = MOCK_RANKINGS.filter(ranking =>
    ranking.segment === selectedSegment &&
    ranking.featureName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">ProductBoard Rankings</h1>
        <Button variant="outline">Ranking Settings</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Rankings</CardTitle>
          <CardDescription>View prioritized features based on selected segment.</CardDescription>
          <div className="flex space-x-4 pt-4">
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Segment" />
              </SelectTrigger>
              <SelectContent>
                {segments.map(segment => (
                  <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="search"
              placeholder="Search features..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredRankings.length > 0 ? (
            <div className="space-y-4">
              {filteredRankings.map((ranking) => (
                <div key={ranking.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-gray-400 w-8 text-center">{ranking.rank}</span>
                    <span className="font-medium">{ranking.featureName}</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">Score: {ranking.score}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No rankings found for this segment or search term.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Define routes for the rankings feature
export const rankingsRoutes = [
  {
    path: '/rankings',
    element: <RankingsView />,
  }
];
