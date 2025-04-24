import React from 'react';
import { Badge, BadgeProps } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import { RankTrackingFields } from '../../types/pb-ado-mappings';

interface RankStatusBadgeProps {
  pbRank?: number;
  adoRank?: number;
  variant?: BadgeProps['variant'];
  showNumbers?: boolean;
  className?: string;
}

/**
 * A badge component that shows the sync status between ProductBoard and ADO ranks.
 * It visually indicates whether the ranks are in sync, and optionally shows the actual rank numbers.
 */
export function RankStatusBadge({
  pbRank,
  adoRank,
  variant = 'outline',
  showNumbers = false,
  className = ''
}: RankStatusBadgeProps) {
  // Determine sync status
  const isSynced = pbRank === adoRank;
  const missingValue = pbRank === undefined || adoRank === undefined;
  
  // Set the appropriate badge color based on status
  let badgeVariant: BadgeProps['variant'] = variant;
  let status: string;
  let statusIcon: string;
  
  if (missingValue) {
    status = 'Incomplete';
    badgeVariant = 'outline';
    statusIcon = '⚠️';
  } else if (isSynced) {
    status = 'In Sync';
    badgeVariant = 'success';
    statusIcon = '✓';
  } else {
    status = 'Out of Sync';
    badgeVariant = 'destructive';
    statusIcon = '⟳';
  }

  // Prepare badge content
  const rankInfo = showNumbers
    ? ` (PB: ${pbRank ?? '?'}, ADO: ${adoRank ?? '?'})`
    : '';
  
  const badgeContent = `${statusIcon} ${status}${rankInfo}`;
  
  // Build tooltip content
  let tooltipContent = '';
  
  if (missingValue) {
    tooltipContent = 'Rank information is missing in one or both systems';
  } else if (isSynced) {
    tooltipContent = `Ranks are synchronized (PB: ${pbRank}, ADO: ${adoRank})`;
  } else {
    tooltipContent = `Ranks are different between systems:\nProductBoard: ${pbRank}\nAzure DevOps: ${adoRank}`;
  }

  return (
    <Tooltip content={tooltipContent}>
      <Badge variant={badgeVariant} className={className}>
        {badgeContent}
      </Badge>
    </Tooltip>
  );
}

// Higher-level component that accepts the whole mapping object
interface MappingRankStatusBadgeProps {
  mapping?: { 
    pb_feature_rank?: number;
    ado_backlog_rank?: number; 
  } | null;
  showNumbers?: boolean;
  className?: string;
}

/**
 * A wrapper component that takes a mapping object and displays the rank status badge.
 */
export function MappingRankStatusBadge({ 
  mapping, 
  showNumbers = false,
  className = ''
}: MappingRankStatusBadgeProps) {
  if (!mapping) return null;
  
  return (
    <RankStatusBadge
      pbRank={mapping.pb_feature_rank}
      adoRank={mapping.ado_backlog_rank}
      showNumbers={showNumbers}
      className={className}
    />
  );
}
