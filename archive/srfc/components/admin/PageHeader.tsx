import React from 'react';
import { Button } from '../ui/Button';
import type { ComponentType, SVGProps } from 'react';

// Define a type for Heroicon components
export type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface PageHeaderProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonIcon?: HeroIcon;
  onButtonClick?: () => void;
}

export function PageHeader({ 
  title, 
  description, 
  buttonText, 
  buttonIcon, 
  onButtonClick 
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {buttonText && (
          <Button icon={buttonIcon} onClick={onButtonClick}>
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}
