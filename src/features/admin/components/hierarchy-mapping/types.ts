import React from 'react';
import { 
  HierarchyMappingConfig, 
  PbToAdoMapping, 
  AreaPathMapping, 
  InitiativeEpicMapping,
  UserTeamMapping,
  ComponentProductMapping
} from '../../../../lib/api/hierarchyMapping';

/**
 * Common props for all tab components
 */
export interface TabComponentProps {
  editedMapping: HierarchyMappingConfig | null;
  setEditedMapping: React.Dispatch<React.SetStateAction<HierarchyMappingConfig | null>>;
  activeTab: string;
}

/**
 * Props for the PbToAdoMappingTab component
 */
export interface PbToAdoMappingTabProps extends TabComponentProps {
  handleAddPbToAdoMapping: () => void;
  handleRemovePbToAdoMapping: (index: number) => void;
  handleUpdatePbToAdoMapping: (index: number, field: keyof PbToAdoMapping, value: string) => void;
}

/**
 * Props for the AreaPathMappingTab component
 */
export interface AreaPathMappingTabProps extends TabComponentProps {
  handleAddAreaPathMapping: () => void;
  handleRemoveAreaPathMapping: (index: number) => void;
  handleUpdateAreaPathMapping: (index: number, field: keyof AreaPathMapping, value: string) => void;
}

/**
 * Props for the InitiativeEpicMappingTab component
 */
export interface InitiativeEpicMappingTabProps extends TabComponentProps {
  pbInitiatives: any[];
  adoEpics: any[];
  isLoadingInitiatives: boolean;
  initiativesError: Error | null;
  suggestedInitiativeMappings: InitiativeEpicMapping[];
  fetchInitiativesAndEpics: () => Promise<void>;
  handleAddInitiativeEpicMapping: () => void;
  handleRemoveInitiativeEpicMapping: (index: number) => void;
  handleUpdateInitiativeEpicMapping: (
    index: number, 
    field: keyof InitiativeEpicMapping, 
    value: string | number | boolean
  ) => void;
}

/**
 * Props for the UserTeamMappingTab component
 */
export interface UserTeamMappingTabProps extends TabComponentProps {
  pbUsers: any[];
  adoTeams: any[];
  isLoadingUsers: boolean;
  isLoadingAdoTeams: boolean;
  usersError: Error | null;
  adoTeamsError: Error | null;
  suggestedUserMappings: UserTeamMapping[];
  fetchPbUsersAndTeams: () => Promise<void>;
  handleAddUserTeamMapping: () => void;
  handleRemoveUserTeamMapping: (index: number) => void;
  handleUpdateUserTeamMapping: (
    index: number, 
    field: keyof UserTeamMapping, 
    value: string
  ) => void;
}

/**
 * Props for the ComponentProductMappingTab component
 */
export interface ComponentProductMappingTabProps extends TabComponentProps {
  handleAddComponentProductMapping: () => void;
  handleRemoveComponentProductMapping: (index: number) => void;
  handleUpdateComponentProductMapping: (
    index: number, 
    field: keyof ComponentProductMapping, 
    value: string
  ) => void;
}

/**
 * Props for the MappingResultsTab component
 */
export interface MappingResultsTabProps extends TabComponentProps {
  mappingResults: any[];
  isLoadingResults: boolean;
  resultsError: Error | null;
  fetchMappingResults: () => Promise<void>;
  handleRowClick: (item: any) => void;
  columnWidths: Record<string, number>;
  setColumnWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handleResizeStart: (columnId: string, e: React.MouseEvent) => void;
  pbTypeFilter: string;
  setPbTypeFilter: React.Dispatch<React.SetStateAction<string>>;
  adoTypeFilter: string;
  setAdoTypeFilter: React.Dispatch<React.SetStateAction<string>>;
  showMismatchesOnly: boolean;
  setShowMismatchesOnly: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Props for the MappingHeader component
 */
export interface MappingHeaderProps {
  editedMapping: HierarchyMappingConfig | null;
  handleUpdateMappingInfo: (field: 'name' | 'description', value: string) => void;
}

/**
 * Props for the SaveFooter component
 */
export interface SaveFooterProps {
  handleSave: () => void;
  isSaving: boolean;
}

/**
 * Props for the TabNavigation component
 */
export interface TabNavigationProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Props for the StateComponents component
 */
export interface StateComponentsProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Props for the DetailDialog component
 */
export interface DetailDialogProps {
  isDetailDialogOpen: boolean;
  setIsDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedItem: any | null;
  setSelectedItem: React.Dispatch<React.SetStateAction<any | null>>;
}
