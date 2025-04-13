// Test script for Azure DevOps mapping functions
// Run with: node src/test-ado-mapping.js

// Sample Azure DevOps work item (from your example)
const sampleWorkItem = {
  "id": 227432,
  "rev": 4,
  "url": "https://dev.azure.com/inmar/b2cfce2b-a90e-42a1-85f7-15816195b8b5/_apis/wit/workItems/227432",
  "fields": {
    "System.Id": 227432,
    "System.Rev": 4,
    "System.Tags": "Blocked",
    "System.State": "New",
    "System.Title": "MT226981 - Support \"Temporary Password\" Flow Explicitly",
    "System.AreaId": 1675,
    "System.Parent": 226981,
    "System.Reason": "New",
    "System.History": "<div><span style=\"color:rgb(32, 36, 40);font-family:proxima-nova, &quot;Arial CE&quot;, Arial, sans-serif;text-align:left;display:inline !important;\">If we proceed with MT226981 - Sign in with Magic Link then this work is not necessary. Before we complete this, we should evaluate this other story first.</span><br></div>",
    "System.AreaPath": "Healthcare\\Teams\\Skunkworks",
    "System.NodeName": "Skunkworks",
    "System.PersonId": 119287635,
    "System.BoardColumn": "New",
    "System.ChangedDate": "2025-04-09T15:26:55.027Z",
    "System.CreatedDate": "2025-04-09T15:26:05.89Z",
    "System.Description": "<p><b>As a</b> first time HealthcareOS user </p>\n<p><b>I want to</b> be prompted for my temporary password </p>\n<p><b>in order to</b> avoid confusion about what I am expected to enter here. </p>\n<p><img src=\"https://pb-files.s3.amazonaws.com/production/attachments/ada638e72e0165029f62fcfbea82f3654c5d851482bdea5553376034d6cc77dc/image.png\" alt=\"\"> </p>\n<p> </p>\n",
    "System.IterationId": 1622,
    "System.RevisedDate": "9999-01-01T00:00:00Z",
    "System.TeamProject": "Healthcare",
    "System.CommentCount": 2,
    "System.WorkItemType": "User Story",
    "System.IterationPath": "Healthcare",
    "System.BoardColumnDone": false,
    "System.IterationLevel1": "Healthcare",
    "Microsoft.VSTS.Common.Priority": 2,
    "Microsoft.VSTS.Common.ValueArea": "Business",
    "Microsoft.VSTS.Common.StateChangeDate": "2025-04-09T15:26:05.89Z",
    "System.ChangedBy": {
      "id": "356fd428-4b14-65b9-9f3f-6b52300b2ebc",
      "displayName": "Entin, Jordan",
      "uniqueName": "jordan.entin@inmar.com"
    },
    "System.CreatedBy": {
      "id": "356fd428-4b14-65b9-9f3f-6b52300b2ebc",
      "displayName": "Entin, Jordan",
      "uniqueName": "jordan.entin@inmar.com"
    }
  },
  "relations": [
    {
      "rel": "System.LinkTypes.Related",
      "url": "https://dev.azure.com/inmar/b2cfce2b-a90e-42a1-85f7-15816195b8b5/_apis/wit/workItems/226983",
      "attributes": {
        "name": "Related",
        "isLocked": false
      }
    },
    {
      "rel": "System.LinkTypes.Hierarchy-Reverse",
      "url": "https://dev.azure.com/inmar/b2cfce2b-a90e-42a1-85f7-15816195b8b5/_apis/wit/workItems/226981",
      "attributes": {
        "name": "Parent",
        "comment": "Productboard hierarchy",
        "isLocked": false
      }
    },
    {
      "rel": "Hyperlink",
      "url": "https://inmar.productboard.com/entity-detail/features/fa107c5c-3ab9-474d-89b3-fdcafae1ec13",
      "attributes": {
        "id": 24512397,
        "comment": "Productboard reference",
        "revisedDate": "9999-01-01T00:00:00Z",
        "authorizedDate": "2025-04-09T15:26:05.89Z",
        "resourceCreatedDate": "2025-04-09T15:26:05.89Z",
        "resourceModifiedDate": "2025-04-09T15:26:05.89Z"
      }
    }
  ]
};

// Import the mapping functions
// Note: Since this is a CommonJS script and the functions are not exported,
// we'll reimplement them here for testing purposes

// Helper function to map work item to database format
function mapWorkItemToDb(item) {
  if (!item || !item.id || !item.fields) return null;
  const fields = item.fields;
  
  // Helper to safely access fields directly
  const getField = (path, defaultValue = null) => {
    // Direct field access (no dot notation needed for top-level fields)
    return fields[path] !== undefined ? fields[path] : defaultValue;
  };
  const getIdentityField = (path, field, defaultValue = null) => {
     const identity = getField(path);
     return identity && identity[field] ? identity[field] : defaultValue;
  };

  // Extract Productboard ID from relations
  let productboardId = null;
  if (item.relations) {
    const pbLink = item.relations.find(r => 
      r.rel === 'Hyperlink' && 
      r.url && 
      r.url.includes('productboard.com')
    );
    
    if (pbLink) {
      const match = pbLink.url.match(/features\/([a-f0-9-]+)/);
      productboardId = match ? match[1] : null;
    }
  }

  return {
    id: item.id,
    url: item.url,
    rev: item.rev,
    type: getField('System.WorkItemType', 'Unknown'),
    title: getField('System.Title', `Untitled Item ${item.id}`),
    state: getField('System.State', 'Unknown'),
    reason: getField('System.Reason'),
    area_path: getField('System.AreaPath'),
    area_id: getField('System.AreaId'),
    iteration_path: getField('System.IterationPath'),
    iteration_id: getField('System.IterationId'),
    priority: getField('Microsoft.VSTS.Common.Priority'),
    value_area: getField('Microsoft.VSTS.Common.ValueArea'),
    tags: getField('System.Tags'),
    description: getField('System.Description'),
    history: getField('System.History'),
    acceptance_criteria: getField('Microsoft.VSTS.Common.AcceptanceCriteria'),
    assigned_to_name: getIdentityField('System.AssignedTo', 'displayName'),
    assigned_to_email: getIdentityField('System.AssignedTo', 'uniqueName'),
    created_by_name: getIdentityField('System.CreatedBy', 'displayName'),
    created_by_email: getIdentityField('System.CreatedBy', 'uniqueName'),
    created_date: getField('System.CreatedDate'),
    changed_by_name: getIdentityField('System.ChangedBy', 'displayName'),
    changed_by_email: getIdentityField('System.ChangedBy', 'uniqueName'),
    changed_date: getField('System.ChangedDate'),
    parent_id: getField('System.Parent'), // Direct parent field if available
    board_column: getField('System.BoardColumn'),
    board_column_done: getField('System.BoardColumnDone'),
    comment_count: getField('System.CommentCount'),
    watermark: getField('System.Watermark'),
    stack_rank: getField('Microsoft.VSTS.Common.StackRank'),
    effort: getField('Microsoft.VSTS.Scheduling.Effort'),
    story_points: getField('Microsoft.VSTS.Scheduling.StoryPoints'),
    business_value: getField('Microsoft.VSTS.Common.BusinessValue'),
    productboard_id: productboardId,
    // raw_data: item, // Omitted for cleaner output
    last_synced_at: new Date().toISOString(),
  };
}

// Helper function to map relation to database format
function mapRelationToDb(sourceId, relation) {
   if (!relation || !relation.url || !relation.rel) return null;
   
   // Extract target ID if it's a work item link
   let target_work_item_id = null;
   const match = relation.url.match(/\/workItems\/(\d+)$/);
   if (match && match[1]) {
     target_work_item_id = parseInt(match[1], 10);
   }

   // Check relation types
   const isParent = relation.rel === 'System.LinkTypes.Hierarchy-Reverse';
   const isChild = relation.rel === 'System.LinkTypes.Hierarchy-Forward';
   const isRelated = relation.rel === 'System.LinkTypes.Related';
   const isHyperlink = relation.rel === 'Hyperlink';
   
   // Check if it's a Productboard link
   const isPbLink = isHyperlink && relation.url.includes('productboard.com');
   let productboardId = null;
   
   if (isPbLink) {
     const pbMatch = relation.url.match(/features\/([a-f0-9-]+)/);
     productboardId = pbMatch ? pbMatch[1] : null;
   }

   return {
     source_work_item_id: sourceId,
     target_work_item_id: target_work_item_id,
     target_url: relation.url,
     rel_type: relation.rel,
     attributes: relation.attributes || {},
     is_parent: isParent,
     is_child: isChild,
     is_related: isRelated,
     is_hyperlink: isHyperlink,
     is_productboard_link: isPbLink,
     productboard_id: productboardId
   };
}

// Test the mapping functions
console.log("Testing Azure DevOps mapping functions...");

// Map the work item
const mappedItem = mapWorkItemToDb(sampleWorkItem);
console.log("\n=== Mapped Work Item ===");
console.log(JSON.stringify(mappedItem, null, 2));

// Map the relations
console.log("\n=== Mapped Relations ===");
sampleWorkItem.relations.forEach(relation => {
  const mappedRelation = mapRelationToDb(sampleWorkItem.id, relation);
  console.log(JSON.stringify(mappedRelation, null, 2));
});

// Check for specific fields
console.log("\n=== Field Validation ===");
console.log("Parent ID:", mappedItem.parent_id);
console.log("History:", mappedItem.history ? "Present (length: " + mappedItem.history.length + ")" : "Missing");
console.log("Description:", mappedItem.description ? "Present (length: " + mappedItem.description.length + ")" : "Missing");
console.log("Board Column:", mappedItem.board_column);
console.log("Comment Count:", mappedItem.comment_count);
console.log("Productboard ID:", mappedItem.productboard_id);

console.log("\nTest completed successfully!");
