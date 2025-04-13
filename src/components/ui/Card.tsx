import React from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Props for the Card component
 * @interface CardProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Card contents */
  children: React.ReactNode;
  
  /** Whether to remove padding */
  noPadding?: boolean;
  
  /** Whether to use a more subtle shadow */
  subtle?: boolean;
  
  /** Whether to add a hover effect to the card */
  hoverable?: boolean;
  
  /** Optional border color class */
  borderColor?: string;
}

/**
 * Card component used as a container for content with a white background,
 * subtle shadow, and rounded corners.
 * 
 * @example
 * ```tsx
 * <Card className="max-w-md">
 *   <h2 className="text-xl font-semibold">Card Title</h2>
 *   <p>Card content goes here.</p>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  className,
  children,
  noPadding = false,
  subtle = false,
  hoverable = false,
  borderColor,
  ...props
}) => {
  const classes = twMerge(
    'bg-white rounded-lg',
    subtle ? 'shadow-sm' : 'shadow',
    !noPadding && 'p-6',
    hoverable && 'transition-shadow duration-200 hover:shadow-md',
    borderColor ? borderColor : 'border border-gray-100',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

/**
 * Props for the CardHeader component
 * @interface CardHeaderProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Header contents */
  children: React.ReactNode;
}

/**
 * CardHeader component for displaying header content in a Card.
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <h2 className="text-xl font-semibold">Card Title</h2>
 *   </CardHeader>
 *   <CardBody>Card content goes here.</CardBody>
 * </Card>
 * ```
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  children,
  ...props
}) => {
  const classes = twMerge(
    'px-6 py-4 border-b border-gray-100',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

/**
 * Props for the CardBody component
 * @interface CardBodyProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Body contents */
  children: React.ReactNode;
}

/**
 * CardBody component for the main content area in a Card.
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>Card Title</CardHeader>
 *   <CardBody>
 *     <p>Card content goes here.</p>
 *   </CardBody>
 * </Card>
 * ```
 */
export const CardBody: React.FC<CardBodyProps> = ({
  className,
  children,
  ...props
}) => {
  const classes = twMerge(
    'p-6',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

/**
 * Props for the CardFooter component
 * @interface CardFooterProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  
  /** Footer contents */
  children: React.ReactNode;
}

/**
 * CardFooter component for displaying footer content in a Card.
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>Card Title</CardHeader>
 *   <CardBody>Card content goes here.</CardBody>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children,
  ...props
}) => {
  const classes = twMerge(
    'px-6 py-4 border-t border-gray-100 flex justify-end space-x-2',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};
