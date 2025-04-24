# Azure DevOps Area Path Mapping Logic

This document outlines the logic used to determine the `System.AreaPath` field when syncing items from ProductBoard to Azure DevOps (ADO).

## Core Logic

The ADO Area Path is **not** directly derived from the ProductBoard item's type (e.g., Feature, Story) or its Component field alone. Instead, it relies on a configurable mapping system stored in the database.

1.  **Identify Attributes:** For a given ProductBoard item being synced, the system identifies key attributes relevant to mapping, such as:
    *   Business Unit
    *   Product Code / Product Name
    *   Team (This might be derived from the ProductBoard Component or another field, depending on configuration)

2.  **Database Lookup:** The system queries the `area_path_mappings` table (or a similar configuration source) using these identified attributes.

3.  **Find Match:** It looks for a mapping rule where the `business_unit`, `product_code`, and `team` (or other configured fields) match the attributes of the ProductBoard item.

4.  **Retrieve Area Path:** If a matching rule is found, the corresponding `area_path` value defined in that rule is retrieved.

5.  **Assign Area Path:** This retrieved `area_path` is then assigned to the `System.AreaPath` field of the ADO work item being created or updated.

**Example Mapping Rule:**

```json
// From area_path_mappings configuration
{
  "business_unit": "Healthcare",
  "product_code": "Platform", 
  "team": "Skunkworks",
  "area_path": "Healthcare\\Teams\\Skunkworks" 
}
```

If a ProductBoard item matches "Healthcare", "Platform", and "Skunkworks", its corresponding ADO work item will have its Area Path set to `"Healthcare\\Teams\\Skunkworks"`.

## Implications for Standalone Testing

Standalone test scripts (like `curl` commands, `.sh` scripts, or `.js` scripts) that directly call the ADO API cannot perform the real-time database lookup described above.

Therefore, when using these scripts for testing:

1.  **Determine Expected Path:** Manually determine the *correct* Area Path that *should* be assigned to the simulated item based on its attributes and the configured mapping rules in your database.
2.  **Hardcode in Script:** Hardcode this *expected* Area Path value directly into the `System.AreaPath` field within the test script's payload.

This ensures the test script accurately reflects the *outcome* of the mapping logic, even though it doesn't execute the lookup itself.

**Example (in `curl`):**

If the expected Area Path for the test item is `"Healthcare\\Teams\\Skunkworks"`, the relevant part of the `curl` payload would be:

```json
    {
      "op": "add",
      "path": "/fields/System.AreaPath",
      "value": "Healthcare\\Teams\\Skunkworks" 
    }
```

This approach allows for effective testing of the ADO API interaction while acknowledging the limitations of standalone scripts in replicating the full dynamic mapping logic.
