import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '../../../../components/ui/shadcn/dialog';
import { Button } from '../../../../components/ui/shadcn/button';
import { Check, X } from 'lucide-react';
import { DetailDialogProps } from './types';

/**
 * DetailDialog component for displaying detailed information about a mapping item
 */
export const DetailDialog: React.FC<DetailDialogProps> = ({ 
  isDetailDialogOpen, 
  setIsDetailDialogOpen, 
  selectedItem, 
  setSelectedItem 
}) => {
  if (!selectedItem) return null;
  
  return (
    <Dialog 
      open={isDetailDialogOpen} 
      onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) setSelectedItem(null);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Item Details</DialogTitle>
          <DialogDescription>
            Complete information about the selected mapping item
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* ProductBoard Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-700 border-b pb-2">ProductBoard Information</h3>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">ID</h4>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.pbId}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Name</h4>
              <p className="text-sm font-medium">{selectedItem.pbName}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Type</h4>
              <p className="text-sm">
                {selectedItem.pbType === 'subfeature' ? 'Story' : 
                 selectedItem.pbType.charAt(0).toUpperCase() + selectedItem.pbType.slice(1)}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Parent</h4>
              <p className="text-sm">{selectedItem.pbParentName || 'None'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Parent ID</h4>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.pbParentId || 'None'}</p>
            </div>
          </div>
          
          {/* Current ADO Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Current Azure DevOps Information</h3>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">ID</h4>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.adoId}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Name</h4>
              <p className="text-sm font-medium">{selectedItem.adoName}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Type</h4>
              <p className="text-sm">{selectedItem.adoType}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Parent</h4>
              <p className="text-sm">{selectedItem.adoParentName || 'None'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Parent ID</h4>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.adoParentId || 'None'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Area Path</h4>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.adoAreaPath}</p>
            </div>
          </div>
          
          {/* Expected ADO Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-700 border-b pb-2">Expected Azure DevOps Information</h3>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Type</h4>
              <p className="text-sm">{selectedItem.expectedAdoType}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Parent</h4>
              <p className="text-sm">{selectedItem.expectedAdoParentName || 'None'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Parent ID</h4>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.expectedAdoParentId || 'None'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Area Path</h4>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded">{selectedItem.expectedAreaPath}</p>
            </div>
          </div>
          
          {/* Match Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-700 border-b pb-2">Match Status</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Type Match</h4>
                <div className="flex items-center mt-1">
                  {selectedItem.isTypeMatch ? (
                    <>
                      <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-6 w-6 mr-2">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-green-700 font-medium">Match</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 h-6 w-6 mr-2">
                        <X className="h-4 w-4" />
                      </span>
                      <span className="text-red-700 font-medium">Mismatch</span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Parent Match</h4>
                <div className="flex items-center mt-1">
                  {selectedItem.isParentMatch ? (
                    <>
                      <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-6 w-6 mr-2">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-green-700 font-medium">Match</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 h-6 w-6 mr-2">
                        <X className="h-4 w-4" />
                      </span>
                      <span className="text-red-700 font-medium">Mismatch</span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Area Path Match</h4>
                <div className="flex items-center mt-1">
                  {selectedItem.isAreaPathMatch ? (
                    <>
                      <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-6 w-6 mr-2">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-green-700 font-medium">Match</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 h-6 w-6 mr-2">
                        <X className="h-4 w-4" />
                      </span>
                      <span className="text-red-700 font-medium">Mismatch</span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Overall Status</h4>
                <div className="flex items-center mt-1">
                  {selectedItem.isFullMatch ? (
                    <>
                      <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 h-6 w-6 mr-2">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="text-green-700 font-medium">Full Match</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-800 h-6 w-6 mr-2">
                        <X className="h-4 w-4" />
                      </span>
                      <span className="text-red-700 font-medium">Partial/No Match</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DetailDialog;
