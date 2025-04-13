import React from 'react';
import { Link } from 'react-router-dom';
import type { HeroIcon } from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';

interface AdminCardProps {
  to: string;
  icon: HeroIcon;
  title: string;
  description: string;
}

export function AdminCard({ to, icon: Icon, title, description }: AdminCardProps) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center mb-4">
        <Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
        <h3 className="ml-3 text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-500">{description}</p>
    </Link>
  );
}