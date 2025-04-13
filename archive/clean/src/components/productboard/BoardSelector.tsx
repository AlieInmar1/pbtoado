import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ProductBoardClient } from '../../lib/api/productboard';
import { Select } from '../ui/Select';

interface BoardSelectorProps {
  apiKey: string;
  value: string;
  onChange: (boardId: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

export function BoardSelector({
  apiKey,
  value,
  onChange,
  error,
  label = 'ProductBoard Board',
  required = false
}: BoardSelectorProps) {
  const [boards, setBoards] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    
    const loadBoards = async () => {
      setLoading(true);
      try {
        const client = new ProductBoardClient(apiKey);
        const boardsData = await client.getBoardsWithNames();
        
        // Transform to format expected by Select component
        const options = boardsData.map(board => ({
          value: board.id,
          label: board.name
        }));
        
        setBoards(options);
      } catch (error) {
        console.error('Error loading ProductBoard boards:', error);
        toast.error('Failed to load ProductBoard boards');
      } finally {
        setLoading(false);
      }
    };
    
    loadBoards();
  }, [apiKey]);

  return (
    <Select
      label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      error={error}
      required={required}
      disabled={loading || boards.length === 0}
      options={boards.length > 0 ? boards : [{ value: '', label: loading ? 'Loading boards...' : 'No boards available' }]}
    />
  );
}
