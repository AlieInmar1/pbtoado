import React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Variants for the Heading component
 */
type HeadingVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/**
 * Props for the Heading component
 */
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** The heading level/variant */
  variant: HeadingVariant;
  /** Whether to use a lighter color */
  muted?: boolean;
  /** Optional additional classes */
  className?: string;
  /** Heading content */
  children: React.ReactNode;
}

/**
 * Heading component for displaying titles and headings with consistent styling.
 * 
 * @example
 * ```tsx
 * <Heading variant="h1">Page Title</Heading>
 * <Heading variant="h2" muted>Section Title</Heading>
 * ```
 */
export const Heading: React.FC<HeadingProps> = ({
  variant,
  muted = false,
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    h1: 'text-3xl sm:text-4xl font-extrabold',
    h2: 'text-2xl sm:text-3xl font-bold',
    h3: 'text-xl sm:text-2xl font-semibold',
    h4: 'text-lg sm:text-xl font-semibold',
    h5: 'text-base sm:text-lg font-medium',
    h6: 'text-sm sm:text-base font-medium',
  };

  const colorStyles = muted ? 'text-gray-600' : 'text-gray-900';
  
  const classes = twMerge(variantStyles[variant], colorStyles, className);
  
  // Use appropriate React element based on variant
  switch (variant) {
    case 'h1':
      return <h1 className={classes} {...props}>{children}</h1>;
    case 'h2':
      return <h2 className={classes} {...props}>{children}</h2>;
    case 'h3':
      return <h3 className={classes} {...props}>{children}</h3>;
    case 'h4':
      return <h4 className={classes} {...props}>{children}</h4>;
    case 'h5':
      return <h5 className={classes} {...props}>{children}</h5>;
    case 'h6':
      return <h6 className={classes} {...props}>{children}</h6>;
    default:
      return <h2 className={classes} {...props}>{children}</h2>;
  }
};

/**
 * Props for the Text component
 */
interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** The size of the text */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to use a lighter color */
  muted?: boolean;
  /** Whether to make the text italic */
  italic?: boolean;
  /** Whether to make the text bold */
  bold?: boolean;
  /** Whether to make the text semibold */
  semibold?: boolean;
  /** Optional additional classes */
  className?: string;
  /** Text content */
  children: React.ReactNode;
}

/**
 * Text component for displaying paragraph text with consistent styling.
 * 
 * @example
 * ```tsx
 * <Text>Regular paragraph text.</Text>
 * <Text muted size="sm">Smaller, muted text.</Text>
 * <Text bold>Bold text for emphasis.</Text>
 * ```
 */
export const Text: React.FC<TextProps> = ({
  size = 'md',
  muted = false,
  italic = false,
  bold = false,
  semibold = false,
  className,
  children,
  ...props
}) => {
  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const colorStyles = muted ? 'text-gray-600' : 'text-gray-900';
  const fontStyles = [
    italic && 'italic',
    bold && 'font-bold',
    semibold && 'font-semibold',
  ].filter(Boolean).join(' ');
  
  const classes = twMerge(sizeStyles[size], colorStyles, fontStyles, className);
  
  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
};
