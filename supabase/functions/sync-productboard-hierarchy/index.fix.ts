// Fixed version of ProductBoard hierarchy sync function
// Corrects the nested data structure handling issue

/**
 * Function to fetch products from ProductBoard
 * FIX: Access data array at the correct nesting level (three levels deep)
 */
async function fetchAllProducts(api_key: string, product_id?: string): Promise<any[]> {
  try {
    if (product_id) {
      // If specific product ID provided, just get that one
      const response = await callInternalApi("get-productboard-products", {
        api_key,
        product_id,
      });

      if (!response.success) {
        throw new Error(`Failed to fetch product: ${response.error}`);
      }

      return [response.data];
    } else {
      // Get all products
      const response = await callInternalApi("get-productboard-products", {
        api_key,
      });

      if (!response.success) {
        throw new Error(`Failed to fetch products: ${response.error}`);
      }

      // FIX: Access three levels deep instead of two
      return response.data.data.data || [];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

/**
 * Function to fetch all components (without filtering by product)
 * FIX: Access data array at the correct nesting level (three levels deep)
 */
async function fetchAllComponents(api_key: string): Promise<any[]> {
  try {
    const response = await callInternalApi("get-productboard-components", {
      api_key,
    }, false); // Don't log errors here as 404 is expected in some configurations

    if (!response.success) {
      // If we get a 404, return empty array rather than failing
      if (response.error && response.error.includes('404')) {
        console.log('No components found in ProductBoard, continuing...');
        return [];
      }
      throw new Error(`Failed to fetch components: ${response.error}`);
    }

    // FIX: Access three levels deep instead of two
    return response.data.data.data || [];
  } catch (error) {
    // Check if this is a 404 error, which is expected in some ProductBoard configurations
    if (error.message && error.message.includes('404')) {
      console.log('No components found in ProductBoard, continuing...');
      return [];
    }
    console.error("Error fetching components:", error);
    return []; // Return empty array to continue the sync
  }
}

/**
 * Function to fetch all initiatives (no filtering)
 * FIX: Access data array at the correct nesting level (three levels deep)
 */
async function fetchAllInitiatives(api_key: string, initiative_id?: string): Promise<any[]> {
  try {
    if (initiative_id) {
      // If specific initiative ID provided, just get that one
      const response = await callInternalApi("get-productboard-initiatives", {
        api_key,
        initiative_id,
      });

      if (!response.success) {
        throw new Error(`Failed to fetch initiative: ${response.error}`);
      }

      return [response.data];
    } else {
      // Get all initiatives
      const response = await callInternalApi("get-productboard-initiatives", {
        api_key,
      });

      if (!response.success) {
        throw new Error(`Failed to fetch initiatives: ${response.error}`);
      }

      // FIX: Access three levels deep instead of two
      return response.data.data.data || [];
    }
  } catch (error) {
    console.error("Error fetching initiatives:", error);
    throw error;
  }
}

/**
 * Function to fetch features for specific component
 * FIX: Access data array at the correct nesting level (three levels deep)
 */
async function fetchComponentFeatures(api_key: string, component_id: string): Promise<any[]> {
  try {
    const response = await callInternalApi("get-productboard-features", {
      api_key,
      component_id,
    }, false); // Don't log errors here as we expect some 404s

    if (!response.success) {
      // If we get a 404, return empty array rather than failing
      if (response.error && response.error.includes('404')) {
        console.log(`No features found for component ${component_id}, continuing...`);
        return [];
      }
      throw new Error(`Failed to fetch component features: ${response.error}`);
    }

    // FIX: Access three levels deep instead of two
    return response.data.data.data || [];
  } catch (error) {
    if (error.message && error.message.includes('404')) {
      console.log(`No features found for component ${component_id}, continuing...`);
      return [];
    }
    console.error(`Error fetching features for component ${component_id}:`, error);
    return []; // Return empty array to continue the sync
  }
}

/**
 * Function to fetch features linked to an initiative
 * FIX: Access data array at the correct nesting level (three levels deep)
 */
async function fetchInitiativeFeatures(api_key: string, initiative_id: string): Promise<any[]> {
  try {
    const response = await callInternalApi("get-productboard-initiative-features", {
      api_key,
      initiative_id,
    }, false); // Don't log errors here as we expect some 404s

    if (!response.success) {
      // If we get a 404, return empty array rather than failing
      if (response.error && response.error.includes('404')) {
        console.log(`No features found for initiative ${initiative_id}, continuing...`);
        return [];
      }
      throw new Error(`Failed to fetch initiative features: ${response.error}`);
    }

    // FIX: Access features at the correct nesting level
    return response.data.data.data?.features || [];
  } catch (error) {
    if (error.message && error.message.includes('404')) {
      console.log(`No features found for initiative ${initiative_id}, continuing...`);
      return [];
    }
    console.error(`Error fetching features for initiative ${initiative_id}:`, error);
    return []; // Return empty array to continue the sync
  }
}

/**
 * Function to fetch sub-features for a parent feature
 * FIX: Access data array at the correct nesting level (three levels deep)
 */
async function fetchSubFeatures(api_key: string, parent_id: string): Promise<any[]> {
  try {
    const response = await callInternalApi("get-productboard-features", {
      api_key,
      parent_id,
    }, false); // Don't log errors for not found

    if (!response.success) {
      // If we get a 404, return empty array rather than failing
      if (response.error && response.error.includes('404')) {
        console.log(`No sub-features found for parent ${parent_id}, continuing...`);
        return [];
      }
      throw new Error(`Failed to fetch sub-features: ${response.error}`);
    }

    // FIX: Access three levels deep instead of two
    return response.data.data.data || [];
  } catch (error) {
    if (error.message && error.message.includes('404')) {
      console.log(`No sub-features found for parent ${parent_id}, continuing...`);
      return [];
    }
    console.error(`Error fetching sub-features for parent ${parent_id}:`, error);
    return []; // Return empty array to continue the sync
  }
}
