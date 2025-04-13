import React from 'react';
import { ProductBoardCredentialsForm } from '../components/productboard/ProductBoardCredentialsForm';
import { ProductBoardTrackingManager } from '../components/productboard/ProductBoardTrackingManager';
import { ProductBoardSyncHistory } from '../components/productboard/ProductBoardSyncHistory';
import { UserTokenManager } from '../components/productboard/UserTokenManager';
import { PageHeader } from '../components/admin/PageHeader';

export default function ProductBoardRankingSettings() {
  
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="ProductBoard Ranking Settings" 
        description="Configure automatic synchronization of story rankings from ProductBoard to Azure DevOps."
      />
      
      <div className="space-y-8">
        <ProductBoardCredentialsForm />
        
        <UserTokenManager />
        
        <ProductBoardTrackingManager />
        
        <ProductBoardSyncHistory />
      </div>
    </div>
  );
}
