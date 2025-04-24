# ProductBoard -> ADO -> Apify Linker Flow

This document outlines the architecture and steps required to complete the end-to-end workflow where a ProductBoard status change triggers an Azure DevOps work item creation/update, followed by linking the ADO item back to ProductBoard using an Apify actor via a proxy server.

## Intended Workflow

1.  **ProductBoard Event:** A user changes the status of a Feature or Sub-feature in ProductBoard to "With Engineering".
2.  **Webhook Trigger:** ProductBoard sends a webhook event to the `pb-ado-sync` Supabase Edge Function.
3.  **`pb-ado-sync` Function:**
    *   Receives and verifies the webhook.
    *   Fetches details of the ProductBoard item.
    *   Checks if the status condition ("With Engineering" and changed) is met.
    *   Determines the target ADO work item type and Area Path (currently hardcoded to `"Healthcare POC 1"` for testing).
    *   Calls the Azure DevOps API to create or update the work item.
    *   Retrieves the ADO work item ID and URL from the ADO API response.
    *   **Calls the Proxy Server:** Makes an HTTP POST request to a publicly deployed proxy server endpoint (e.g., `https://<your-proxy-url>/apify/run-pb-linker`).
    *   Sends necessary data (PB Item ID/URL, ADO Item ID, ADO Item URL, ADO Project Name) in the request body to the proxy.
4.  **Proxy Server (`proxy-server/server.js` deployed publicly):**
    *   Receives the request from `pb-ado-sync` at the `/apify/run-pb-linker` endpoint.
    *   Fetches necessary ProductBoard authentication tokens (cookies, local storage) from the Supabase database (`productboard_auth_tokens` table).
    *   Uses its configured Apify API Token (`APIFY_API_TOKEN`) and Actor ID (`APIFY_ACTOR_ID`) to call the Apify API.
    *   Triggers a run of the `pb-ado-linker` Apify actor, passing the required inputs (PB URL, ADO ID, ADO Project, PB Auth Tokens).
    *   Waits for the Apify actor run to complete (optional, or can be asynchronous).
    *   Returns the result/status of the Apify actor run back to the `pb-ado-sync` function.
5.  **`pb-ado-linker` (Apify Actor):**
    *   Receives the inputs.
    *   Uses the provided ProductBoard auth tokens to perform UI automation.
    *   Navigates to the ProductBoard item.
    *   Updates the designated custom field (e.g., "ADO Link") with the ADO work item URL or ID.
    *   Reports success or failure.
6.  **`pb-ado-sync` (Continued):** Logs the final status based on the proxy server's response.
7.  **Response:** `pb-ado-sync` sends a final response back to the original ProductBoard webhook request.

## Why the Proxy Server?

*   **Environment Separation:** Supabase Edge Functions run in a cloud environment and cannot directly access `localhost`.
*   **Apify Trigger:** The proxy centralizes the logic for triggering the Apify actor, including fetching necessary PB auth tokens from Supabase.
*   **Secret Management:** The proxy server manages the `APIFY_API_TOKEN` securely in its own environment.

## Implementation Steps

1.  **Deploy Proxy Server:**
    *   Choose a hosting platform for the Node.js application located in `proxy-server/` (e.g., Vercel, Render, Fly.io, Supabase Functions if refactored, etc.).
    *   Deploy the `proxy-server/server.js` application to this platform.
    *   Configure the required environment variables on the hosting platform for the proxy server:
        *   `SUPABASE_URL`
        *   `SUPABASE_KEY` (Anon key is likely sufficient if only reading `productboard_auth_tokens`)
        *   `APIFY_API_TOKEN`
        *   Any other variables needed by `server.js` (e.g., `PORT`, potentially `SUPABASE_SERVICE_ROLE_KEY` if it needs write access).
    *   Obtain the **public base URL** of the deployed proxy server (e.g., `https://your-proxy-app.onrender.com`).

2.  **Configure `pb-ado-sync` Secrets:**
    *   In the Supabase dashboard, go to **Project Settings -> Edge Functions -> pb-ado-sync -> Secrets**.
    *   Add/Update the secret `PROXY_SERVER_URL` with the public base URL obtained in Step 1 (e.g., `https://your-proxy-app.onrender.com`). **Do not** include the `/apify/run-pb-linker` path here.

3.  **Modify `pb-ado-sync` Function:**
    *   Read the `PROXY_SERVER_URL` environment variable.
    *   Locate the section within the `if (adoSyncEnabled)` block after the successful `supabase.from('pb_ado_mappings').upsert(...)` call (around line 527).
    *   **Remove** the existing `fetch` call to `/functions/v1/pb-link-updater`.
    *   **Add** a new `fetch` call using `POST` to `${PROXY_SERVER_URL}/apify/run-pb-linker`.
    *   Set the `Content-Type` header to `application/json`.
    *   Construct the JSON body with the fields expected by the proxy:
        ```json
        {
          "pbStoryUrl": `https://inmar.productboard.com/feature/${itemId}`, // Construct PB URL
          "adoProjectName": adoProject, // Use the variable holding the ADO project name
          "adoStoryId": createdOrUpdatedAdoId // Use the variable holding the new/updated ADO ID
        }
        ```
        *(Note: Verify if `adoWorkItemUrl` is needed instead of/in addition to `adoStoryId` based on proxy/actor needs)*.
    *   Add logging and error handling for this new `fetch` call.

4.  **Redeploy `pb-ado-sync`:** Deploy the modified Supabase function:
    ```bash
    cd supabase
    supabase functions deploy pb-ado-sync --no-verify-jwt
    ```

5.  **Test:** Trigger the workflow with a real ProductBoard item status change and monitor logs (Supabase function logs, proxy server logs, Apify actor logs) to verify the entire chain.
