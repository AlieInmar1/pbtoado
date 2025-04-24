# ProductBoard Field Integration

This document provides comprehensive documentation for the ProductBoard field integration in the AI Story/Feature Creator system. It covers all aspects of the integration, from database schema to UI components and API integration.

## 1. Overview

### Purpose

The ProductBoard field integration enables seamless synchronization between our AI Story/Feature Creator system and ProductBoard, ensuring that all data created or modified in either system is properly reflected in both places. This integration enhances our ability to manage and prioritize features through consistent metadata and scoring.

### Key Features

- Complete mapping of all ProductBoard fields to our system
- RICE + OS scoring system for prioritization
- Classification and categorization fields
- Team and ownership assignment
- Detailed content fields for acceptance criteria and requirements
- Bidirectional synchronization with ProductBoard

## 2. Database Schema

The following schema updates will be implemented to support all ProductBoard fields:

```sql
-- Create a comprehensive story schema with all ProductBoard fields
ALTER TABLE stories 
-- RICE scoring fields
ADD COLUMN reach_score INT DEFAULT 1,
ADD COLUMN impact_score INT DEFAULT 1,
ADD COLUMN confidence_score INT DEFAULT 5,
ADD COLUMN effort_score INT DEFAULT 5,
ADD COLUMN os_compatibility INT DEFAULT 2,
ADD COLUMN rice_score FLOAT GENERATED ALWAYS AS ((reach_score * impact_score * confidence_score * (0.8 + ((os_compatibility - 1) * 0.2))) / GREATEST(effort_score, 1)) STORED,

-- Additional scoring and metadata
ADD COLUMN customer_importance_score INT,
ADD COLUMN timeframe DATE,
ADD COLUMN health VARCHAR(50),
ADD COLUMN owner_id UUID,
ADD COLUMN owner_name VARCHAR(255),
ADD COLUMN teams JSONB, -- Array of team ids/names
ADD COLUMN dependencies JSONB, -- Array of dependent story ids
ADD COLUMN tags JSONB, -- Array of tag names

-- Checkbox and selection fields
ADD COLUMN commercialization_needed BOOLEAN DEFAULT FALSE,
ADD COLUMN commitment_status VARCHAR(50),
ADD COLUMN growth_driver BOOLEAN DEFAULT FALSE,
ADD COLUMN investment_category VARCHAR(100),
ADD COLUMN product_leader_approval VARCHAR(50),
ADD COLUMN tentpole BOOLEAN DEFAULT FALSE,
ADD COLUMN t_shirt_sizing VARCHAR(10), -- XS, S, M, L, XL, etc.

-- Multi-select fields
ADD COLUMN product_line JSONB, -- Array of product line ids/names
ADD COLUMN products JSONB, -- Array of product ids/names

-- Number fields
ADD COLUMN board_level_stack_rank INT,
ADD COLUMN engineering_assigned_story_points INT,
ADD COLUMN matching_id VARCHAR(100),

-- Text fields
ADD COLUMN acceptance_criteria TEXT,
ADD COLUMN customer_need_description TEXT,
ADD COLUMN release_notes TEXT;
```

## 3. TypeScript Type Definitions

These type definitions will be added to the story creator type system:

```typescript
// src/features/story-creator/types/index.ts

// Enum types for better type safety
export type HealthStatus = 'good' | 'needs_attention' | 'at_risk';
export type CommitmentStatus = 'committed' | 'exploring' | 'planning' | 'not_committed';
export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected';
export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type InvestmentCategory = 'new_feature' | 'improvement' | 'bug_fix' | 'technical_debt' | 'research';

// Team and user references
export interface TeamReference {
  id: string;
  name: string;
}

export interface UserReference {
  id: string;
  name: string;
}

export interface StoryReference {
  id: string;
  title: string;
}

export interface ProductReference {
  id: string;
  name: string;
}

// Main Story type with all ProductBoard fields
export interface Story {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  
  // RICE scoring fields
  reach_score: number;
  impact_score: number;
  confidence_score: number;
  effort_score: number;
  os_compatibility: number; // 1-3
  rice_score: number; // Calculated
  
  // Additional scoring and metadata
  customer_importance_score?: number;
  timeframe?: string; // ISO date string
  health?: HealthStatus;
  owner_id?: string;
  owner_name?: string;
  teams?: TeamReference[];
  dependencies?: StoryReference[];
  tags?: string[];
  
  // Checkbox and selection fields
  commercialization_needed?: boolean;
  commitment_status?: CommitmentStatus;
  growth_driver?: boolean;
  investment_category?: InvestmentCategory;
  product_leader_approval?: ApprovalStatus;
  tentpole?: boolean;
  t_shirt_sizing?: TShirtSize;
  
  // Multi-select fields
  product_line?: ProductReference[];
  products?: ProductReference[];
  
  // Number fields
  board_level_stack_rank?: number;
  engineering_assigned_story_points?: number;
  matching_id?: string;
  
  // Text fields
  acceptance_criteria?: string;
  customer_need_description?: string;
  release_notes?: string;
  
  // ProductBoard specific
  productboard_id?: string;
  last_synced_at?: string;
}
```

## 4. Component Architecture

The UI components will be organized in a modular fashion to support all ProductBoard fields:

```
┌─────────────────────────┐
│  StoryCreatorForm       │
├─────────────────────────┤
│  FieldTabs              │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │ MainInfoSection   │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ RiceScoreSection  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ ClassificationSec │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ PlanningSection   │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ DetailedContent   │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

### 4.1 Field Grouping Strategy

Fields will be organized into five logical tabs for better user experience:

#### Tab 1: Main Information
- Title
- Description
- Owner
- Teams
- Tags
- Health
- Timeframe

#### Tab 2: RICE Scoring
- Reach (1-10)
- Impact (1-10)
- Confidence (1-10)
- Effort (1-10)
- OS Compatibility (1-3)
- Customer Importance Score
- Calculated RICE Score

#### Tab 3: Classification
- Commercialization Needed
- Commitment Status
- Growth Driver
- Investment Category
- Product Leader Approval
- Tentpole
- T-Shirt Sizing
- Product Line (Epics)
- Products (Epics)

#### Tab 4: Planning & Engineering
- Dependencies
- Board Level Stack Rank
- Engineering Assigned Story Points
- Matching ID

#### Tab 5: Detailed Content
- Acceptance Criteria
- Customer Need Description - Commitments
- Release Notes

## 5. Components Implementation

Each section of fields will be implemented as a separate component for better maintainability:

### 5.1 MainInfoSection Component

This component handles basic story information such as title, description, owner, teams, and tags.

```tsx
// src/features/story-creator/components/sections/MainInfoSection.tsx

interface MainInfoSectionProps {
  story: Partial<Story>;
  onChange: (field: string, value: any) => void;
  users: UserReference[];
  teams: TeamReference[];
}

export const MainInfoSection: React.FC<MainInfoSectionProps> = ({
  story,
  onChange,
  users,
  teams
}) => {
  return (
    <div className="space-y-6">
      <FormField
        label="Title"
        required
      >
        <Input
          value={story.title || ''}
          onChange={e => onChange('title', e.target.value)}
          placeholder="Story title"
        />
      </FormField>
      
      <FormField
        label="Description"
        required
      >
        <Textarea
          value={story.description || ''}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Detailed description of the story"
          rows={4}
        />
      </FormField>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Owner"
        >
          <UserSelect
            value={story.owner_id}
            onChange={value => {
              const user = users.find(u => u.id === value);
              onChange('owner_id', value);
              onChange('owner_name', user?.name || '');
            }}
            users={users}
          />
        </FormField>
        
        <FormField
          label="Health"
        >
          <Select
            value={story.health || ''}
            onChange={value => onChange('health', value)}
            placeholder="Select health status"
            options={[
              { label: 'Good', value: 'good' },
              { label: 'Needs Attention', value: 'needs_attention' },
              { label: 'At Risk', value: 'at_risk' }
            ]}
          />
        </FormField>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Timeframe"
        >
          <DatePicker
            value={story.timeframe || null}
            onChange={value => onChange('timeframe', value)}
            placeholder="Select a target date"
          />
        </FormField>
        
        <FormField
          label="Teams"
        >
          <MultiSelect
            value={story.teams || []}
            onChange={value => onChange('teams', value)}
            placeholder="Select teams"
            options={teams.map(team => ({
              label: team.name,
              value: team.id
            }))}
          />
        </FormField>
      </div>
      
      <FormField
        label="Tags"
      >
        <TagInput
          value={story.tags || []}
          onChange={value => onChange('tags', value)}
          placeholder="Add tags"
        />
      </FormField>
    </div>
  );
};
```

### 5.2 RICEScoringSection Component

This component handles the RICE scoring fields and visualization:

```tsx
// src/features/story-creator/components/sections/RICEScoringSection.tsx

interface RICEScoringProps {
  story: Partial<Story>;
  onChange: (field: string, value: any) => void;
}

export const RICEScoringSection: React.FC<RICEScoringProps> = ({
  story,
  onChange
}) => {
  // Calculate RICE score
  const riceScore = useMemo(() => {
    if (!story.reach_score || !story.impact_score || 
        !story.confidence_score || !story.effort_score || 
        !story.os_compatibility) {
      return null;
    }
    
    // Convert OS compatibility to a modifier
    // OS Compatibility 1 = 0.8 (low priority)
    // OS Compatibility 2 = 1.0 (medium priority)
    // OS Compatibility 3 = 1.2 (high priority)
    const osModifier = 0.8 + ((story.os_compatibility - 1) * 0.2);
    
    // RICE formula with OS modifier: (Reach * Impact * Confidence * OS Modifier) / Effort
    const score = (story.reach_score * story.impact_score * 
                  story.confidence_score * osModifier) / 
                  Math.max(story.effort_score, 1);
    
    return Math.round(score * 10) / 10; // Round to 1 decimal place
  }, [story.reach_score, story.impact_score, story.confidence_score, 
      story.effort_score, story.os_compatibility]);
  
  return (
    <div className="space-y-6">
      {/* Reach Scoring */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Reach (1-10)
            <span className="ml-2 text-xs text-gray-500">How many customers will this impact?</span>
          </label>
          <span className="text-lg font-semibold text-blue-600">{story.reach_score || 1}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={story.reach_score || 1}
          onChange={(e) => onChange('reach_score', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
      </div>
      
      {/* Impact Scoring */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Impact (1-10)
            <span className="ml-2 text-xs text-gray-500">How much will this impact each customer?</span>
          </label>
          <span className="text-lg font-semibold text-blue-600">{story.impact_score || 1}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={story.impact_score || 1}
          onChange={(e) => onChange('impact_score', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
      </div>
      
      {/* Confidence Scoring */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Confidence (1-10)
            <span className="ml-2 text-xs text-gray-500">How confident are we in these estimates?</span>
          </label>
          <span className="text-lg font-semibold text-blue-600">{story.confidence_score || 5}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={story.confidence_score || 5}
          onChange={(e) => onChange('confidence_score', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
      </div>
      
      {/* Effort Scoring */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Effort (1-10)
            <span className="ml-2 text-xs text-gray-500">How much work will this require?</span>
          </label>
          <span className="text-lg font-semibold text-blue-600">{story.effort_score || 5}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={story.effort_score || 5}
          onChange={(e) => onChange('effort_score', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
      </div>
      
      {/* OS Compatibility */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            OS Compatibility
            <span className="ml-2 text-xs text-gray-500">Platform priority</span>
          </label>
          <span className="text-lg font-semibold text-blue-600">
            {story.os_compatibility || 2}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div className="grid grid-cols-3 gap-3 w-full">
            <button
              type="button"
              onClick={() => onChange('os_compatibility', 1)}
              className={`py-2 px-4 text-sm font-medium rounded-md ${
                story.os_compatibility === 1 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              Low (1)
            </button>
            <button
              type="button"
              onClick={() => onChange('os_compatibility', 2)}
              className={`py-2 px-4 text-sm font-medium rounded-md ${
                story.os_compatibility === 2 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              Medium (2)
            </button>
            <button
              type="button"
              onClick={() => onChange('os_compatibility', 3)}
              className={`py-2 px-4 text-sm font-medium rounded-md ${
                story.os_compatibility === 3 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              High (3)
            </button>
          </div>
        </div>
      </div>
      
      {/* Customer Importance Score */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">
            Customer Importance Score (1-10)
            <span className="ml-2 text-xs text-gray-500">How important is this to customers?</span>
          </label>
          <span className="text-lg font-semibold text-blue-600">{story.customer_importance_score || 5}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={story.customer_importance_score || 5}
          onChange={(e) => onChange('customer_importance_score', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
      </div>
      
      {/* RICE Score Result */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <h4 className="text-base font-medium text-gray-900">RICE Score:</h4>
          <div className="text-2xl font-bold text-blue-700">{riceScore || 'N/A'}</div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Formula: (Reach × Impact × Confidence × OS Modifier) ÷ Effort
        </div>
        
        {/* Visual representation of score components */}
        {riceScore && (
          <div className="mt-4">
            <div className="flex items-end h-32 space-x-6">
              <div className="flex flex-col items-center">
                <div className="bg-blue-500 w-12" style={{ height: `${(story.reach_score || 1) * 10}%` }}></div>
                <div className="mt-2 text-xs">Reach</div>
                <div className="text-xs font-semibold">{story.reach_score || 1}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-green-500 w-12" style={{ height: `${(story.impact_score || 1) * 10}%` }}></div>
                <div className="mt-2 text-xs">Impact</div>
                <div className="text-xs font-semibold">{story.impact_score || 1}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-purple-500 w-12" style={{ height: `${(story.confidence_score || 5) * 10}%` }}></div>
                <div className="mt-2 text-xs">Confidence</div>
                <div className="text-xs font-semibold">{story.confidence_score || 5}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-yellow-500 w-12" style={{ height: `${(story.os_compatibility || 2) * 33.3}%` }}></div>
                <div className="mt-2 text-xs">OS</div>
                <div className="text-xs font-semibold">{story.os_compatibility || 2}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-red-500 w-12" style={{ height: `${(story.effort_score || 5) * 10}%` }}></div>
                <div className="mt-2 text-xs">Effort</div>
                <div className="text-xs font-semibold">{story.effort_score || 5}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 5.3 ClassificationSection Component

This component handles classification and categorization fields:

```tsx
// src/features/story-creator/components/sections/ClassificationSection.tsx

interface ClassificationSectionProps {
  story: Partial<Story>;
  onChange: (field: string, value: any) => void;
  products: ProductReference[];
}

export const ClassificationSection: React.FC<ClassificationSectionProps> = ({
  story,
  onChange,
  products
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Commercialization Needed"
        >
          <Switch
            checked={story.commercialization_needed || false}
            onCheckedChange={value => onChange('commercialization_needed', value)}
          />
        </FormField>
        
        <FormField
          label="Growth Driver"
        >
          <Switch
            checked={story.growth_driver || false}
            onCheckedChange={value => onChange('growth_driver', value)}
          />
        </FormField>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Tentpole"
        >
          <Switch
            checked={story.tentpole || false}
            onCheckedChange={value => onChange('tentpole', value)}
          />
        </FormField>
        
        <FormField
          label="T-Shirt Sizing"
        >
          <Select
            value={story.t_shirt_sizing || ''}
            onChange={value => onChange('t_shirt_sizing', value)}
            placeholder="Select size"
            options={[
              { label: 'XS', value: 'XS' },
              { label: 'S', value: 'S' },
              { label: 'M', value: 'M' },
              { label: 'L', value: 'L' },
              { label: 'XL', value: 'XL' },
              { label: 'XXL', value: 'XXL' }
            ]}
          />
        </FormField>
      </div>
      
      <FormField
        label="Commitment Status"
      >
        <Select
          value={story.commitment_status || ''}
          onChange={value => onChange('commitment_status', value)}
          placeholder="Select commitment status"
          options={[
            { label: 'Committed', value: 'committed' },
            { label: 'Exploring', value: 'exploring' },
            { label: 'Planning', value: 'planning' },
            { label: 'Not Committed', value: 'not_committed' }
          ]}
        />
      </FormField>
      
      <FormField
        label="Investment Category"
      >
        <Select
          value={story.investment_category || ''}
          onChange={value => onChange('investment_category', value)}
          placeholder="Select category"
          options={[
            { label: 'New Feature', value: 'new_feature' },
            { label: 'Improvement', value: 'improvement' },
            { label: 'Bug Fix', value: 'bug_fix' },
            { label: 'Technical Debt', value: 'technical_debt' },
            { label: 'Research', value: 'research' }
          ]}
        />
      </FormField>
      
      <FormField
        label="Product Leader Approval"
      >
        <Select
          value={story.product_leader_approval || ''}
          onChange={value => onChange('product_leader_approval', value)}
          placeholder="Select approval status"
          options={[
            { label: 'Pending Approval for Work', value: 'pending_approval' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' }
          ]}
        />
      </FormField>
      
      <FormField
        label="Product Line (Epics)"
      >
        <MultiSelect
          value={story.product_line || []}
          onChange={value => onChange('product_line', value)}
          placeholder="Select product lines"
          options={products.map(product => ({
            label: product.name,
            value: product.id
          }))}
        />
      </FormField>
      
      <FormField
        label="Products (Epics)"
      >
        <MultiSelect
          value={story.products || []}
          onChange={value => onChange('products', value)}
          placeholder="Select products"
          options={products.map(product => ({
            label: product.name,
            value: product.id
          }))}
        />
      </FormField>
    </div>
  );
};
```

### 5.4 PlanningSection Component

This component handles planning and engineering fields:

```tsx
// src/features/story-creator/components/sections/PlanningSection.tsx

interface PlanningSectionProps {
  story: Partial<Story>;
  onChange: (field: string, value: any) => void;
  allStories: Partial<Story>[];
}

export const PlanningSection: React.FC<PlanningSectionProps> = ({
  story,
  onChange,
  allStories
}) => {
  return (
    <div className="space-y-6">
      <FormField
        label="Dependencies"
      >
        <StorySelector
          selectedStories={story.dependencies || []}
          onChange={value => onChange('dependencies', value)}
          placeholder="Select dependent stories"
          stories={allStories.filter(s => s.id !== story.id)} // Exclude current story
        />
      </FormField>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Board Level Stack Rank"
        >
          <Input
            type="number"
            value={story.board_level_stack_rank || ''}
            onChange={e => onChange('board_level_stack_rank', parseInt(e.target.value))}
            placeholder="Stack rank"
          />
        </FormField>
        
        <FormField
          label="Engineering Assigned Story Points"
        >
          <Input
            type="number"
            value={story.engineering_assigned_story_points || ''}
            onChange={e => onChange('engineering_assigned_story_points', parseInt(e.target.value))}
            placeholder="Story points"
          />
        </FormField>
      </div>
      
      <FormField
        label="Matching ID"
      >
        <Input
          value={story.matching_id || ''}
          onChange={e => onChange('matching_id', e.target.value)}
          placeholder="ID for matching"
        />
      </FormField>
    </div>
  );
};
```

### 5.5 DetailedContentSection Component

This component handles detailed content fields:

```tsx
// src/features/story-creator/components/sections/DetailedContentSection.tsx

interface DetailedContentSectionProps {
  story: Partial<Story>;
  onChange: (field: string, value: any) => void;
}

export const DetailedContentSection: React.FC<DetailedContentSectionProps> = ({
  story,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <FormField
        label="Acceptance Criteria"
      >
        <Textarea
          value={story.acceptance_criteria || ''}
          onChange={e => onChange('acceptance_criteria', e.target.value)}
          placeholder="Define acceptance criteria"
          rows={4}
        />
      </FormField>
      
      <FormField
        label="Customer Need Description - Commitments"
      >
        <Textarea
          value={story.customer_need_description || ''}
          onChange={e => onChange('customer_need_description', e.target.value)}
          placeholder="Describe customer needs and commitments"
          rows={4}
        />
      </FormField>
      
      <FormField
        label="Release Notes"
      >
        <Textarea
          value={story.release_notes || ''}
          onChange={e => onChange('release_notes', e.target.value)}
          placeholder="Notes for release"
          rows={4}
        />
      </FormField>
    </div>
  );
};
```

### 5.6 Main StoryCreatorForm Component

This component integrates all section components into a tabbed interface:

```tsx
// src/features/story-creator/components/StoryCreatorForm.tsx

interface StoryCreatorFormProps {
  initialData?: Partial<Story>;
  onSave: (story: Story) => void;
  onCancel?: () => void;
}

export const StoryCreatorForm: React.FC<StoryCreatorFormProps> = ({
  initialData,
  onSave,
  onCancel
}) => {
  const [story, setStory] = useState<Partial<Story>>(initialData || {
    reach_score: 1,
    impact_score: 1,
    confidence_score: 5,
    effort_score: 5,
    os_compatibility: 2
  });
  const [activeTab, setActiveTab] = useState('main');
  
  // Fetch required data
  const { users, isLoading: usersLoading } = useUsers();
  const { teams, isLoading: teamsLoading } = useTeams();
  const { products, isLoading: productsLoading } = useProducts();
