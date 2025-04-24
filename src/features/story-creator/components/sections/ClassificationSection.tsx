import React from 'react';
import { Story, InvestmentCategory, ApprovalStatus, TShirtSize } from '../../../../types/story-creator';
import { INVESTMENT_CATEGORIES, COMMITMENT_STATUSES } from '../../../../config/constants';
import { ProductReference } from '../../../../types/story-creator';

interface ClassificationSectionProps {
  story: Partial<Story>;
  onChange: (field: keyof Story, value: any) => void;
  products: ProductReference[];
}

/**
 * ClassificationSection allows users to categorize and classify stories
 * based on various organizational taxonomies.
 */
export const ClassificationSection: React.FC<ClassificationSectionProps> = ({
  story,
  onChange,
  products
}) => {
  const approvalStatusOptions: { value: ApprovalStatus, label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Story Classification</h2>
        <p className="text-gray-500 text-sm">
          Categorize this story to help with organization, prioritization, and reporting.
        </p>
      </div>
      
      {/* Investment Category */}
      <div>
        <label htmlFor="investment_category" className="block text-sm font-medium text-gray-700">
          Investment Category
        </label>
        <div className="mt-1">
          <select
            id="investment_category"
            value={story.investment_category || ''}
            onChange={(e) => onChange('investment_category', e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">Select investment category</option>
            {INVESTMENT_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          The primary business or technical category for this story.
        </p>
      </div>
      
      {/* Commitment Status */}
      <div>
        <label htmlFor="commitment_status" className="block text-sm font-medium text-gray-700">
          Commitment Status
        </label>
        <div className="mt-1">
          <select
            id="commitment_status"
            value={story.commitment_status || ''}
            onChange={(e) => onChange('commitment_status', e.target.value as any)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">Select commitment status</option>
            {COMMITMENT_STATUSES.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          The current level of commitment to implementing this story.
        </p>
      </div>
      
      {/* Products */}
      <div>
        <label htmlFor="products" className="block text-sm font-medium text-gray-700">
          Products
        </label>
        <div className="mt-1">
          <select
            id="products"
            multiple
            value={story.products || []}
            onChange={(e) => {
              const selectedProducts = Array.from(e.target.selectedOptions, option => option.value);
              onChange('products', selectedProducts);
            }}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          The products that this story relates to. Hold Ctrl/Cmd to select multiple.
        </p>
      </div>
      
      {/* Product Leader Approval */}
      <div>
        <label htmlFor="product_leader_approval" className="block text-sm font-medium text-gray-700">
          Product Leader Approval
        </label>
        <div className="mt-1">
          <select
            id="product_leader_approval"
            value={story.product_leader_approval || ''}
            onChange={(e) => onChange('product_leader_approval', e.target.value as ApprovalStatus)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">Select approval status</option>
            {approvalStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Approval status from the product leadership.
        </p>
      </div>
      
      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="tentpole"
              type="checkbox"
              checked={story.tentpole || false}
              onChange={(e) => onChange('tentpole', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="tentpole" className="font-medium text-gray-700">Tentpole Feature</label>
            <p className="text-gray-500">
              This is a major feature that serves as a cornerstone for this release.
            </p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="growth_driver"
              type="checkbox"
              checked={story.growth_driver || false}
              onChange={(e) => onChange('growth_driver', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="growth_driver" className="font-medium text-gray-700">Growth Driver</label>
            <p className="text-gray-500">
              This story is expected to drive significant user or revenue growth.
            </p>
          </div>
        </div>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="commercialization_needed"
              type="checkbox"
              checked={story.commercialization_needed || false}
              onChange={(e) => onChange('commercialization_needed', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="commercialization_needed" className="font-medium text-gray-700">Commercialization Needed</label>
            <p className="text-gray-500">
              This story requires specific commercial planning or go-to-market strategy.
            </p>
          </div>
        </div>
      </div>
      
      {/* Board Level Stack Rank */}
      <div>
        <label htmlFor="board_level_stack_rank" className="block text-sm font-medium text-gray-700">
          Board Level Stack Rank
        </label>
        <div className="mt-1">
          <input
            type="number"
            id="board_level_stack_rank"
            min={0}
            value={story.board_level_stack_rank || ''}
            onChange={(e) => onChange('board_level_stack_rank', e.target.value === '' ? undefined : parseInt(e.target.value))}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter a number"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          The priority ranking of this story at the board level (lower numbers = higher priority).
        </p>
      </div>
      
      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="tags"
            value={(story.tags || []).join(', ')}
            onChange={(e) => {
              const tagsArray = e.target.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag !== '');
              onChange('tags', tagsArray);
            }}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Enter tags, separated by commas"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Add tags to help with filtering and categorization (e.g., "mobile, performance, ux").
        </p>
      </div>
    </div>
  );
};
