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
 * Batch transform multiple items using the provided transform function
 * @param {Array} items - Array of items to transform
 * @param {Function} transformFn - The transform function to apply
 * @param {string} workspaceId - Workspace ID
 * @returns {Array} - Array of transformed items
 */
function batchTransform(items, transformFn, workspaceId) {
  return items.map(item => transformFn(item, workspaceId));
}

module.exports = {
  transformFeatureForDb,
  transformInitiativeForDb,
  transformObjectiveForDb,
  batchTransform
};
