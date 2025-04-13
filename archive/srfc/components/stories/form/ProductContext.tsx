import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import type { StoryFormData } from '../../../types/forms';

interface ProductContextProps {
  register: UseFormRegister<StoryFormData>;
}

export function ProductContext({ register }: ProductContextProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Select
        label="Growth Driver"
        {...register('growth_driver')}
        options={[
          { value: 'acquisition', label: 'Acquisition' },
          { value: 'retention', label: 'Retention' },
          { value: 'monetization', label: 'Monetization' },
        ]}
      />

      <Select
        label="Investment Category"
        {...register('investment_category')}
        options={[
          { value: 'innovation', label: 'Innovation' },
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'growth', label: 'Growth' },
        ]}
      />

      <Input
        label="T-shirt Size"
        {...register('tshirt_size')}
      />

      <Input
        type="number"
        label="Engineering Points"
        {...register('engineering_points', { valueAsNumber: true })}
      />
    </div>
  );
}