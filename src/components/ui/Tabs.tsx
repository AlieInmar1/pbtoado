import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Props for the Tab component
 */
export interface TabProps {
  /** Tab label */
  label: React.ReactNode;
  /** Tab content */
  children: React.ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Additional CSS classes for the tab */
  className?: string;
}

/**
 * Tab component to be used as a child of Tabs
 */
export const Tab: React.FC<TabProps> = ({ 
  children, 
  // These props are used by the parent Tabs component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  label, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  disabled,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className 
}) => {
  return <>{children}</>;
};

/**
 * Props for the Tabs component
 */
export interface TabsProps {
  /** Initial active tab index */
  defaultIndex?: number;
  /** Controlled active tab index */
  activeIndex?: number;
  /** Callback for tab change */
  onChange?: (index: number) => void;
  /** Children should be Tab components */
  children: React.ReactNode;
  /** Variant of the tabs */
  variant?: 'underline' | 'pills' | 'enclosed';
  /** Alignment of the tabs */
  align?: 'start' | 'center' | 'end';
  /** Whether to take full width */
  fullWidth?: boolean;
  /** Additional CSS classes for the tabs container */
  className?: string;
}

/**
 * Tabs component for organizing content into separate views that users can navigate between.
 * 
 * @example
 * ```tsx
 * <Tabs defaultIndex={0} onChange={(i) => console.log(`Tab ${i} clicked`)}>
 *   <Tab label="First Tab">
 *     <p>Content for the first tab</p>
 *   </Tab>
 *   <Tab label="Second Tab">
 *     <p>Content for the second tab</p>
 *   </Tab>
 *   <Tab label="Disabled" disabled>
 *     <p>This tab is disabled</p>
 *   </Tab>
 * </Tabs>
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  defaultIndex = 0,
  activeIndex: controlledIndex,
  onChange,
  children,
  variant = 'underline',
  align = 'start',
  fullWidth = false,
  className,
}) => {
  // State for the active tab
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  
  // Use controlled value if provided, otherwise use internal state
  const activeIndex = controlledIndex !== undefined ? controlledIndex : selectedIndex;
  
  // Extract Tab components from children
  const validChildren = React.Children.toArray(children)
    .filter((child) => React.isValidElement(child) && child.type === Tab);
  
  // Collect tab data from valid children
  const tabs = validChildren.map((child, index) => {
    const element = child as React.ReactElement<TabProps>;
    
    // Extract props from the Tab component
    const { label, disabled, className: tabClassName } = element.props;
    
    // Determine if this tab is active
    const isActive = index === activeIndex;
    
    return { label, disabled, tabClassName, isActive, index };
  });
  
  // Handle tab click
  const handleTabClick = (index: number, disabled?: boolean) => {
    if (disabled) return;
    
    if (controlledIndex === undefined) {
      setSelectedIndex(index);
    }
    
    if (onChange) {
      onChange(index);
    }
  };
  
  // Get the active tab content
  const activeTab = validChildren[activeIndex] as React.ReactElement | undefined;
  
  // Build tab list styles based on variant
  const getTabListStyles = () => {
    const baseStyles = 'flex';
    
    // Alignment styles
    const alignStyles = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    };
    
    // Variant-specific styles
    const variantStyles = {
      underline: 'border-b border-gray-200',
      pills: 'bg-gray-100 p-1 rounded-lg',
      enclosed: 'border-b border-gray-200',
    };
    
    return twMerge(
      baseStyles,
      alignStyles[align],
      variantStyles[variant],
      className
    );
  };
  
  // Build tab styles based on state and variant
  const getTabStyles = (isActive: boolean, disabled?: boolean) => {
    const fullWidthStyles = fullWidth ? 'flex-1 text-center' : '';
    
    // Base styles for all tabs
    const baseStyles = twMerge(
      'px-4 py-2 text-sm font-medium focus:outline-none transition-all duration-200',
      fullWidthStyles,
      disabled && 'opacity-50 cursor-not-allowed'
    );
    
    // Variant-specific active/inactive styles
    const styles = {
      underline: {
        active: 'text-primary-600 border-b-2 border-primary-500',
        inactive: 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300 border-b-2 border-transparent',
      },
      pills: {
        active: 'bg-white text-primary-600 shadow rounded-lg',
        inactive: 'text-gray-600 hover:text-gray-900',
      },
      enclosed: {
        active: 'bg-white text-primary-600 border-l border-t border-r border-gray-200 rounded-t-lg -mb-px',
        inactive: 'text-gray-500 hover:text-gray-700 bg-gray-50',
      },
    };
    
    return twMerge(
      baseStyles,
      isActive ? styles[variant].active : styles[variant].inactive
    );
  };
  
  return (
    <div className="w-full">
      {/* Tab buttons */}
      <div className={getTabListStyles()} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.index}
            role="tab"
            aria-selected={tab.isActive}
            aria-disabled={tab.disabled}
            className={twMerge(
              getTabStyles(tab.isActive, tab.disabled),
              tab.tabClassName
            )}
            onClick={() => handleTabClick(tab.index, tab.disabled)}
            tabIndex={tab.isActive ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="mt-4" role="tabpanel">
        {activeTab}
      </div>
    </div>
  );
};
