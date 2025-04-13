import { z } from 'zod';

export const storySchema = z.object({
  pb_title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  growth_driver: z.string().optional(),
  investment_category: z.string().optional(),
  tentpole: z.string().optional(),
  product_line: z.string().optional(),
  tshirt_size: z.string().optional(),
  engineering_points: z.number().optional(),
  acceptance_criteria: z.array(z.string()),
});

export type StoryFormData = z.infer<typeof storySchema>;