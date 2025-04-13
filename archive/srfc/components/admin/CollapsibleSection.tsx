import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../ui/Card';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  id?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  className = '',
  icon: Icon,
  id,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div id={id}>
      <Card className={className}>
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center">
            {Icon && <Icon className="h-5 w-5 mr-2 text-indigo-600" />}
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          </div>
          {isOpen ? (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          )}
        </div>
        {isOpen && <CardContent>{children}</CardContent>}
      </Card>
    </div>
  );
}
