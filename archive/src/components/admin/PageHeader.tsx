import React, { ReactNode } from 'react';
import { Button } from '../ui/Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onButtonClick?: () => void;
  rightContent?: ReactNode;
}

export function PageHeader({
  title,
  description,
  buttonText,
  buttonIcon: ButtonIcon,
  onButtonClick,
  rightContent
}: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      </div>
      
      <div className="flex items-center space-x-4">
        {rightContent}
        
        {buttonText && onButtonClick && (
          <Button
            onClick={onButtonClick}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {ButtonIcon && <ButtonIcon className="h-4 w-4 mr-2" />}
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
}
