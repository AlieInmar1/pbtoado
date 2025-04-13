# Component Design Principles

This document outlines the core principles and patterns we're following to create a maintainable, extensible React application for the ProductBoard-ADO Integration.

## Table of Contents

1. [Single Responsibility Principle](#1-single-responsibility-principle)
2. [Composability Over Complexity](#2-composability-over-complexity)
3. [Prop Interface Design](#3-prop-interface-design)
4. [Component Documentation](#4-component-documentation)
5. [Performance Considerations](#5-performance-considerations)
6. [Accessibility Standards](#6-accessibility-standards)
7. [Testing Approach](#7-testing-approach)

## 1. Single Responsibility Principle

Each component should have a single, well-defined responsibility:

### 1.1 Component Types by Responsibility

| Type | Responsibility | Example |
|------|----------------|---------|
| **Presentation Components** | Render UI based on props | `Button`, `Card`, `FeatureItem` |
| **Container Components** | Manage data and business logic | `FeatureListContainer`, `SyncHistoryProvider` |
| **Layout Components** | Handle spacing and positioning | `PageLayout`, `SplitPane`, `Grid` |
| **Utility Components** | Provide technical functionality | `ErrorBoundary`, `Suspense`, `Portal` |

### 1.2 Implementation Guide

```tsx
// ✅ Good - Single responsibility (presentation)
function FeatureCard({ title, description, status, onEdit }) {
  return (
    <Card>
      <CardHeader>
        <h3>{title}</h3>
        <StatusBadge status={status} />
      </CardHeader>
      <CardBody>{description}</CardBody>
      <CardFooter>
        <Button onClick={onEdit}>Edit</Button>
      </CardFooter>
    </Card>
  );
}

// ✅ Good - Single responsibility (container)
function FeatureCardContainer({ featureId }) {
  const { data, isLoading, error } = useFeature(featureId);
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <FeatureCard {...data} onEdit={() => openEditModal(featureId)} />;
}

// ❌ Bad - Mixed responsibilities
function FeatureCard({ featureId }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchFeature(featureId)
      .then(data => {
        setData(data);
        setIsLoading(false);
      });
  }, [featureId]);
  
  if (isLoading) return <p>Loading...</p>;
  
  return (
    <div className="card">
      <div className="card-header">
        <h3>{data.title}</h3>
        <span className={`badge ${data.status}`}>{data.status}</span>
      </div>
      <div className="card-body">{data.description}</div>
      <div className="card-footer">
        <button onClick={() => openEditModal(data.id)}>Edit</button>
      </div>
    </div>
  );
}
```

## 2. Composability Over Complexity

We build complex UIs through composition of simple components rather than creating large, monolithic components.

### 2.1 Composition Patterns

#### Component Composition

```tsx
// Base components
function Button({ children, ...props }) {
  return <button {...props}>{children}</button>;
}

function Icon({ name }) {
  return <i className={`icon icon-${name}`} />;
}

// Composed component
function IconButton({ icon, children, ...props }) {
  return (
    <Button {...props}>
      <Icon name={icon} />
      {children}
    </Button>
  );
}
```

#### Render Props

```tsx
function Collapsible({ renderHeader, children }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="collapsible">
      <div className="collapsible-header" onClick={() => setIsOpen(!isOpen)}>
        {renderHeader({ isOpen })}
      </div>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  );
}

// Usage
<Collapsible 
  renderHeader={({ isOpen }) => (
    <>
      <h3>Section Title</h3>
      <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />
    </>
  )}
>
  <p>Content goes here...</p>
</Collapsible>
```

#### Higher-Order Components (sparingly)

Use higher-order components only when necessary, preferring hooks and composition for most cases:

```tsx
// Higher-order component for error boundaries
function withErrorBoundary(Component) {
  return function WithErrorBoundary(props) {
    return (
      <ErrorBoundary fallback={<ErrorMessage />}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Usage
const SafeFeatureList = withErrorBoundary(FeatureList);
```

### 2.2 Composition Examples

#### Feature Card System

```tsx
// Atomic components
const FeatureCard = ({ children, ...props }) => <Card {...props}>{children}</Card>;
const FeatureCardTitle = ({ children }) => <h3 className="text-lg font-medium">{children}</h3>;
const FeatureCardStatus = ({ status }) => <StatusBadge status={status} />;
const FeatureCardDescription = ({ children }) => <p className="text-gray-600">{children}</p>;
const FeatureCardActions = ({ children }) => <div className="flex space-x-2">{children}</div>;

// Usage - composable and flexible
<FeatureCard className="hover:shadow-lg">
  <CardHeader>
    <div className="flex justify-between">
      <FeatureCardTitle>Feature A</FeatureCardTitle>
      <FeatureCardStatus status="in-progress" />
    </div>
  </CardHeader>
  <CardBody>
    <FeatureCardDescription>
      This feature provides XYZ functionality...
    </FeatureCardDescription>
  </CardBody>
  <CardFooter>
    <FeatureCardActions>
      <Button variant="secondary" size="sm">View</Button>
      <Button variant="primary" size="sm">Edit</Button>
    </FeatureCardActions>
  </CardFooter>
</FeatureCard>
```

## 3. Prop Interface Design

Well-designed prop interfaces make components more predictable and self-documenting.

### 3.1 Guidelines

- Use clear, descriptive prop names
- Provide sensible defaults for optional props
- Use TypeScript for strong type-checking
- Keep required props to a minimum
- Group related props into objects where appropriate

### 3.2 Examples

```tsx
// Props interface with TypeScript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Size of the button */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether the button shows a loading spinner */
  isLoading?: boolean;
  /** Optional icon to display at the start of the button */
  startIcon?: React.ReactNode;
  /** Optional icon to display at the end of the button */
  endIcon?: React.ReactNode;
}

// Component with defaults
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  startIcon,
  endIcon,
  children,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  // Component implementation...
}
```

### 3.3 Component API Consistency

Maintain consistent prop patterns across related components:

```tsx
// Consistent naming and patterns across form components
<Input 
  label="Name" 
  error="Name is required" 
  isRequired 
  onChange={handleChange} 
/>

<Select 
  label="Category" 
  error="Please select a category" 
  isRequired 
  onChange={handleChange} 
  options={categoryOptions} 
/>

<Checkbox 
  label="Agree to terms" 
  error="You must agree to the terms" 
  isRequired 
  onChange={handleChange} 
/>
```

## 4. Component Documentation

Components should be self-documenting through TypeScript types and JSDoc comments.

### 4.1 Documentation Pattern

```tsx
/**
 * DataTable displays tabular data with sorting, filtering, and pagination.
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={[
 *     { field: 'name', header: 'Name' },
 *     { field: 'status', header: 'Status' }
 *   ]}
 *   data={featuresData}
 *   pagination={{ pageSize: 10 }}
 * />
 * ```
 */
interface DataTableProps<T extends Record<string, any>> {
  /** Array of column definitions */
  columns: Array<{
    /** Field name in the data object */
    field: keyof T;
    /** Display name for the column header */
    header: string;
    /** Optional renderer for custom cell display */
    renderer?: (value: T[keyof T], row: T) => React.ReactNode;
    /** Whether this column is sortable */
    sortable?: boolean;
    /** Whether this column should have a filter */
    filterable?: boolean;
  }>;
  /** Data array to display in the table */
  data: T[];
  /** Pagination configuration */
  pagination?: {
    /** Number of rows per page */
    pageSize: number;
    /** Initial page index (0-based) */
    initialPage?: number;
  };
  /** Called when sort changes */
  onSort?: (field: keyof T, direction: 'asc' | 'desc') => void;
  /** Called when filters change */
  onFilter?: (filters: Record<keyof T, any>) => void;
  /** Additional CSS classes */
  className?: string;
}

export function DataTable<T extends Record<string, any>>(props: DataTableProps<T>) {
  // Implementation...
}
```

### 4.2 Storybook Integration

When we add Storybook later, each component will include:

- Default story showing basic usage
- Stories for each main variant
- Interactive controls for props
- Documentation from JSDoc comments

## 5. Performance Considerations

### 5.1 Component Optimization Techniques

#### Memoization

```tsx
// Memoize components that render frequently or have expensive renders
const MemoizedFeatureCard = React.memo(FeatureCard);

// Memoize callback functions to prevent unnecessary rerenders
const handleFeatureSelect = useCallback((id: string) => {
  setSelectedFeature(id);
}, []);

// Memoize derived data
const filteredFeatures = useMemo(() => {
  return features.filter(feature => feature.status === selectedStatus);
}, [features, selectedStatus]);
```

#### Virtualization for Long Lists

```tsx
import { FixedSizeList } from 'react-window';

function FeatureList({ features }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <FeatureCard feature={features[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={features.length}
      itemSize={100}
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 5.2 Loading States

Every data-fetching component should handle loading states gracefully:

```tsx
function FeatureList() {
  const { data, isLoading, error } = useFeatures();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <FeatureCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className="space-y-4">
      {data.map(feature => (
        <FeatureCard key={feature.id} feature={feature} />
      ))}
    </div>
  );
}
```

## 6. Accessibility Standards

All components will follow WAI-ARIA standards for accessibility.

### 6.1 Key Patterns

- Semantic HTML whenever possible
- Keyboard navigation support
- ARIA attributes for non-standard controls
- Sufficient color contrast
- Focus management for modals and alerts

### 6.2 Examples

```tsx
// Accessible dropdown
function Dropdown({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Enter':
      case 'Space':
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      // Additional key handlers...
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="dropdown"
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-labelledby="dropdown-label"
    >
      <label id="dropdown-label">{label}</label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
      >
        {value || 'Select...'}
      </button>
      
      {isOpen && (
        <ul role="listbox">
          {options.map(option => (
            <li 
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 7. Testing Approach

### 7.1 Component Testing Patterns

#### Unit Tests for Presentation Components

```tsx
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
    expect(screen.getByRole('button')).toHaveClass('btn-primary'); // Default variant
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays loading state correctly', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

#### Integration Tests for Feature Components

```tsx
// FeatureList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { FeatureList } from './FeatureList';
import { useFeatures } from '../../hooks/useFeatures';

// Mock the hook
jest.mock('../../hooks/useFeatures');

describe('FeatureList', () => {
  it('shows loading state', () => {
    (useFeatures as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    
    render(<FeatureList />);
    expect(screen.getAllByTestId('feature-skeleton')).toHaveLength(5);
  });

  it('shows error state', () => {
    (useFeatures as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
    });
    
    render(<FeatureList />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders list of features', async () => {
    const mockFeatures = [
      { id: '1', title: 'Feature 1', status: 'active' },
      { id: '2', title: 'Feature 2', status: 'planned' },
    ];
    
    (useFeatures as jest.Mock).mockReturnValue({
      data: mockFeatures,
      isLoading: false,
      error: null,
    });
    
    render(<FeatureList />);
    
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
  });
});
```

---

By adhering to these component design principles, we'll create a highly maintainable, testable, and extensible application. These principles should be followed by all team members to ensure consistency across the codebase.
