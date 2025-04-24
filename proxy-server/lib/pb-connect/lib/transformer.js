/**
 * Data transformer module for ProductBoard data
 * Transforms raw API responses into database-friendly formats
 */

/**
 * Transform a ProductBoard feature for database insertion
 * @param {Object} feature - Raw feature from API
 * @param {string} workspaceId - Workspace ID
 * @returns {Object} - Transformed feature data
 */
function transformFeatureForDb(feature, workspaceId) {
  return {
    productboard_id: feature.id,
    name: feature.name || 'Unnamed Feature',
    description: feature.description || null,
    status: feature.status?.name || null,
    workspace_id: workspaceId || null,
    metadata: JSON.stringify(feature)
  };
}

/**
 * Transform a ProductBoard initiative for database insertion
 * @param {Object} initiative - Raw initiative from API
 * @param {string} workspaceId - Workspace ID
 * @returns {Object} - Transformed initiative data
 */
function transformInitiativeForDb(initiative, workspaceId) {
  return {
    productboard_id: initiative.id,
    name: initiative.name || 'Unnamed Initiative',
    description: initiative.description || null,
    status: initiative.status?.name || null,
    workspace_id: workspaceId || null,
    metadata: JSON.stringify(initiative)
  };
}

/**
 * Transform a ProductBoard objective for database insertion
 * @param {Object} objective - Raw objective from API
 * @param {string} workspaceId - Workspace ID
 * @returns {Object} - Transformed objective data
 */
function transformObjectiveForDb(objective, workspaceId) {
  return {
    productboard_id: objective.id,
    name: objective.name || 'Unnamed Objective',
    description: objective.description || null,
    status: objective.status?.name || null,
    workspace_id: workspaceId || null,
    metadata: JSON.stringify(objective)
  };
}

/**
 * Transform a ProductBoard component for database insertion
 * @param {Object} component - Raw component from API
 * @param {string} workspaceId - Workspace ID
 * @returns {Object} - Transformed component data
 */
function transformComponentForDb(component, workspaceId) {
  // Extract business unit and product code from component data if available
  // This is a placeholder - in a real implementation, you would need to
  // determine how to extract these values from the component data
  const businessUnit = component.business_unit || 
                      component.metadata?.business_unit || 
                      null;
  
  const productCode = component.product_code || 
                     component.metadata?.product_code || 
                     null;
  
  return {
    productboard_id: component.id,
    name: component.name || 'Unnamed Component',
    description: component.description || null,
    parent_id: component.parent_id || null,
    business_unit: businessUnit,
    product_code: productCode,
    workspace_id: workspaceId || null,
    metadata: JSON.stringify(component)
  };
}

/**
 * Batch transform multiple items using the provided transform function
 * @param {Array} items - Array of items to transform
 * @param {Function} transformFn - The transform function to apply
 * @param {string} workspaceId - Workspace ID
 * @returns {Array} - Array of transformed items
 */
function batchTransform(items, transformFn, workspaceId) {
  return items.map(item => transformFn(item, workspaceId));
}

/**
 * Transform a ProductBoard product for database insertion
 * @param {Object} product - Raw product from API
 * @param {string} workspaceId - Workspace ID
 * @returns {Object} - Transformed product data
 */
function transformProductForDb(product, workspaceId) {
  return {
    productboard_id: product.id,
    name: product.name || 'Unnamed Product',
    description: product.description || null,
    workspace_id: workspaceId || null,
    metadata: JSON.stringify(product)
  };
}

/**
 * Transform a ProductBoard user for database insertion
 * @param {Object} user - Raw user data
 * @param {string} workspaceId - Workspace ID
 * @returns {Object} - Transformed user data
 */
function transformUserForDb(user, workspaceId) {
  return {
    productboard_id: user.id || null,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    role: user.role || 'User',
    workspace_id: workspaceId || null,
    metadata: JSON.stringify(user)
  };
}

module.exports = {
  transformFeatureForDb,
  transformInitiativeForDb,
  transformObjectiveForDb,
  transformComponentForDb,
  transformProductForDb,
  transformUserForDb,
  batchTransform
};
