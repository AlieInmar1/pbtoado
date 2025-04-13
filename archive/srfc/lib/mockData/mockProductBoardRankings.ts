// Mock data for ProductBoard rankings preview
export const mockRankings = [
  { storyId: 'PB-123', rank: 1, name: 'Implement user authentication' },
  { storyId: 'PB-456', rank: 2, name: 'Add dashboard analytics' },
  { storyId: 'PB-789', rank: 3, name: 'Create mobile responsive design' },
  { storyId: 'PB-234', rank: 4, name: 'Integrate payment gateway' },
  { storyId: 'PB-567', rank: 5, name: 'Implement search functionality' },
  { storyId: 'PB-890', rank: 6, name: 'Add user profile management' },
  { storyId: 'PB-345', rank: 7, name: 'Create notification system' },
  { storyId: 'PB-678', rank: 8, name: 'Implement file upload feature' },
  { storyId: 'PB-901', rank: 9, name: 'Add multi-language support' },
  { storyId: 'PB-432', rank: 10, name: 'Create admin dashboard' },
];

// Mock data for ADO mappings
export const mockMappings: Record<string, string> = {
  'PB-123': 'ADO-1001',
  'PB-456': 'ADO-1002',
  'PB-789': 'ADO-1003',
  'PB-234': 'ADO-1004',
  'PB-567': 'ADO-1005',
  // Some items intentionally don't have mappings to test the "Not mapped" case
};

// Function to simulate a delay like a real API call
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
