import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseStoryRepository } from '../StoryRepository';
import type { Story } from '../../../../types/database';

describe('SupabaseStoryRepository', () => {
  let repository: SupabaseStoryRepository;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    repository = new SupabaseStoryRepository(mockClient);
  });

  describe('getAll', () => {
    it('should return all stories for a workspace', async () => {
      const mockStories: Story[] = [
        {
          id: '1',
          workspace_id: 'workspace-1',
          pb_id: 'PB-1',
          pb_title: 'Story 1',
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          workspace_id: 'workspace-1',
          pb_id: 'PB-2',
          pb_title: 'Story 2',
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockClient.single.mockResolvedValue({ data: mockStories });

      const result = await repository.getAll('workspace-1');

      expect(mockClient.from).toHaveBeenCalledWith('stories');
      expect(mockClient.select).toHaveBeenCalledWith('*');
      expect(mockClient.eq).toHaveBeenCalledWith('workspace_id', 'workspace-1');
      expect(result).toEqual(mockStories);
    });

    it('should handle errors', async () => {
      mockClient.single.mockRejectedValue(new Error('Database error'));

      await expect(repository.getAll('workspace-1')).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('should create a new story', async () => {
      const mockStory: Partial<Story> = {
        workspace_id: 'workspace-1',
        pb_id: 'PB-1',
        pb_title: 'New Story',
        status: 'open',
      };

      mockClient.single.mockResolvedValue({ data: { id: '1', ...mockStory } });

      const result = await repository.create(mockStory);

      expect(mockClient.from).toHaveBeenCalledWith('stories');
      expect(mockClient.insert).toHaveBeenCalledWith(mockStory);
      expect(result).toEqual({ id: '1', ...mockStory });
    });
  });

  describe('update', () => {
    it('should update a story', async () => {
      const mockUpdate: Partial<Story> = {
        pb_title: 'Updated Story',
      };

      mockClient.single.mockResolvedValue({ 
        data: { id: '1', ...mockUpdate }
      });

      const result = await repository.update('1', mockUpdate);

      expect(mockClient.from).toHaveBeenCalledWith('stories');
      expect(mockClient.update).toHaveBeenCalledWith(mockUpdate);
      expect(mockClient.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual({ id: '1', ...mockUpdate });
    });
  });

  describe('delete', () => {
    it('should soft delete a story', async () => {
      mockClient.single.mockResolvedValue({ data: null });

      const result = await repository.delete('1');

      expect(mockClient.from).toHaveBeenCalledWith('stories');
      expect(mockClient.update).toHaveBeenCalledWith({ 
        deleted_at: expect.any(String) 
      });
      expect(mockClient.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toBe(true);
    });
  });

  describe('split', () => {
    it('should split a story into multiple stories', async () => {
      const originalStory: Story = {
        id: '1',
        workspace_id: 'workspace-1',
        pb_id: 'PB-1',
        pb_title: 'Original Story',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newStories: Partial<Story>[] = [
        {
          pb_id: 'PB-2',
          pb_title: 'Split Story 1',
          status: 'open',
        },
        {
          pb_id: 'PB-3',
          pb_title: 'Split Story 2',
          status: 'open',
        },
      ];

      mockClient.single
        .mockResolvedValueOnce({ data: originalStory })
        .mockResolvedValueOnce({ data: newStories.map(s => ({ id: crypto.randomUUID(), ...s })) });

      const result = await repository.split('1', newStories);

      expect(mockClient.from).toHaveBeenCalledWith('stories');
      expect(mockClient.insert).toHaveBeenCalledWith(
        expect.arrayContaining(
          newStories.map(s => ({
            ...s,
            workspace_id: originalStory.workspace_id,
          }))
        )
      );
      expect(result).toHaveLength(2);
    });
  });
});