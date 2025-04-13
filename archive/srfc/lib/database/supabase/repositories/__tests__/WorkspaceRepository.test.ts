import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseWorkspaceRepository } from '../WorkspaceRepository';
import type { Workspace } from '../../../../types/database';

describe('SupabaseWorkspaceRepository', () => {
  let repository: SupabaseWorkspaceRepository;
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

    repository = new SupabaseWorkspaceRepository(mockClient);
  });

  describe('getAll', () => {
    it('should return all workspaces', async () => {
      const mockWorkspaces: Workspace[] = [
        {
          id: '1',
          name: 'Workspace 1',
          pb_board_id: 'PB-1',
          ado_project_id: 'ADO-1',
          sync_frequency: '01:00:00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Workspace 2',
          pb_board_id: 'PB-2',
          ado_project_id: 'ADO-2',
          sync_frequency: '01:00:00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockClient.single.mockResolvedValue({ data: mockWorkspaces });

      const result = await repository.getAll();

      expect(mockClient.from).toHaveBeenCalledWith('workspaces');
      expect(mockClient.select).toHaveBeenCalledWith('*');
      expect(mockClient.order).toHaveBeenCalledWith('name');
      expect(result).toEqual(mockWorkspaces);
    });

    it('should handle errors', async () => {
      mockClient.single.mockRejectedValue(new Error('Database error'));

      await expect(repository.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('should create a new workspace', async () => {
      const mockWorkspace: Partial<Workspace> = {
        name: 'New Workspace',
        pb_board_id: 'PB-1',
        ado_project_id: 'ADO-1',
        sync_frequency: '01:00:00',
      };

      mockClient.single.mockResolvedValue({ data: { id: '1', ...mockWorkspace } });

      const result = await repository.create(mockWorkspace);

      expect(mockClient.from).toHaveBeenCalledWith('workspaces');
      expect(mockClient.insert).toHaveBeenCalledWith(mockWorkspace);
      expect(result).toEqual({ id: '1', ...mockWorkspace });
    });
  });

  describe('update', () => {
    it('should update a workspace', async () => {
      const mockUpdate: Partial<Workspace> = {
        name: 'Updated Workspace',
      };

      mockClient.single.mockResolvedValue({ 
        data: { id: '1', ...mockUpdate }
      });

      const result = await repository.update('1', mockUpdate);

      expect(mockClient.from).toHaveBeenCalledWith('workspaces');
      expect(mockClient.update).toHaveBeenCalledWith(mockUpdate);
      expect(mockClient.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual({ id: '1', ...mockUpdate });
    });
  });

  describe('delete', () => {
    it('should soft delete a workspace', async () => {
      mockClient.single.mockResolvedValue({ data: null });

      const result = await repository.delete('1');

      expect(mockClient.from).toHaveBeenCalledWith('workspaces');
      expect(mockClient.update).toHaveBeenCalledWith({ 
        deleted_at: expect.any(String) 
      });
      expect(mockClient.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toBe(true);
    });
  });

  describe('getCurrentWorkspace', () => {
    it('should return the current workspace', async () => {
      const mockWorkspace: Workspace = {
        id: '1',
        name: 'Current Workspace',
        pb_board_id: 'PB-1',
        ado_project_id: 'ADO-1',
        sync_frequency: '01:00:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      repository.setCurrentWorkspace(mockWorkspace);
      const result = await repository.getCurrentWorkspace();

      expect(result).toEqual(mockWorkspace);
    });

    it('should return null when no workspace is set', async () => {
      const result = await repository.getCurrentWorkspace();
      expect(result).toBeNull();
    });
  });
});