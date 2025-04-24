# Productboard to Azure DevOps Webhook Integration Plan

This document outlines the step-by-step plan to implement a webhook integration that syncs Productboard (PB) feature changes to Azure DevOps (ADO) and links the resulting ADO work item back into the Productboard feature using UI automation.

**Overall Goal:** When a feature/story is created or updated in Productboard, trigger a process that:
1. Creates or updates a corresponding work item in Azure DevOps.
2. Retrieves the ADO Work Item ID.
3. Updates the original Productboard feature by adding the ADO Work Item ID to its integration links via UI automation.

**Guiding Principles:**
*   **Modularity:** Break down the process into distinct, reusable functions.
*   **Minimal Impact:** Leverage existing code where possible and avoid unnecessary changes to unrelated parts of the application.
*   **Robustness:** Implement error handling and logging, acknowledging the potential fragility of UI automation.
*   **Security:** Handle secrets and tokens securely.

---

## Phase 1: Prerequisites & Configuration

### Step 1.1: Secret Generation & Storage
*   **Action:** Generate a strong, random secret string to be used as the Productboard Webhook Secret.
*   **Action:** Identify the method/location for securely storing and retrieving the following secrets/tokens within the Supabase environment:
    *   `ADO_PAT`: Azure DevOps Personal Access Token (Must have permissions to create/update work items).
    *   `PB_WEBHOOK_SECRET`: The secret generated above.
    *   `PB_SESSION_TOKEN`: The Productboard session token (obtained via the automated 12-hour refresh process). Ensure the functions can access the *current* valid token.
*   **Tool:** Use Supabase Dashboard Secrets management.

### Step 1.2: Identify Productboard Events
*   **Action:** Determine the specific Productboard events that should trigger the webhook.
*   **Recommendation:** Start with `["feature.created", "feature.updated"]`.
*   **Location:** This configuration happens in Productboard (See Phase 4).

---

## Phase 2: Productboard -> ADO Synchronization (Webhook Receiver)

### Step 2.1: Create Supabase Edge Function: `pb-ado-sync`
*   **Purpose:** Receives webhook calls from Productboard, processes the data, interacts with ADO, and triggers the linking function.
*   **File:** `supabase/functions/pb-ado-sync/index.ts`
*   **Runtime:** Deno (Edge Function)
*   **Implementation Details:**
    1.  **Setup:** Initialize Supabase client, define interfaces for PB webhook payload (`data.feature`, `data.links`, etc.).
    2.  **Request Handling:**
        *   Accept POST requests.
        *   Implement CORS headers (using `supabase/functions/_shared/cors.ts`).
    3.  **Webhook Validation:**
        *   Retrieve `PB_WEBHOOK_SECRET` from environment variables/secrets.
        *   Verify the signature provided by Productboard in the request headers (e.g., `X-Productboard-Signature`) against the payload and the secret. Reject requests with invalid signatures.
    4.  **Payload Parsing:**
        *   Extract necessary data: PB Feature ID (`data.id`), PB Feature URL (`data.links.html`), feature details (name, description, status, relevant custom fields for mapping).
    5.  **ADO Interaction Module:**
        *   **Goal:** Isolate ADO logic.
        *   **Action:** Adapt/reuse existing ADO API interaction logic. Consider refining `src/lib/api/azureDevOpsWithCacheProxy.ts` or creating a dedicated helper module within the function or in `_shared`.
        *   **Input:** Parsed PB feature data.
        *   **Process:**
            *   Retrieve `ADO_PAT` from environment variables/secrets.
            *   Apply mapping logic (potentially reusing `src/hooks/useHierarchyMappings.ts` concepts if applicable server-side) to determine ADO project, work item type, area path, iteration path, state, etc.
            *   Call ADO API (`fetch`) to create/update the work item.
            *   Handle ADO API errors gracefully.
        *   **Output:** ADO Work Item ID and ADO Work Item URL.
    6.  **Trigger Linker Function:**
        *   Retrieve `PB_SESSION_TOKEN` from environment variables/secrets.
        *   Construct payload for `pb-link-updater`: `{ productBoardFeatureUrl, adoWorkItemId, pbSessionToken }`.
        *   Invoke the `pb-link-updater` function asynchronously using `SupabaseClient.functions.invoke('pb-link-updater', { body: payload })`. **Important:** Use `invoke` options to prevent waiting for the response (`noWait: true` or similar, check Supabase docs).
    7.  **Response:** Immediately return a `200 OK` or `202 Accepted` response to Productboard to acknowledge receipt, regardless of the outcome of the ADO interaction or linker triggering.
    8.  **Logging:** Add detailed logging for received events, validation results, ADO API calls/responses, and linker triggering.

---

## Phase 3: ADO -> Productboard Linking (UI Automation)

### Step 3.1: Create Supabase Node.js Function: `pb-link-updater`
*   **Purpose:** Uses Puppeteer to automate adding the ADO link in the Productboard UI.
*   **File:** `supabase/functions/pb-link-updater/index.ts`
*   **Runtime:** Node.js (Required for Puppeteer)
*   **Dependencies:** `puppeteer-core` (suitable for serverless), potentially helper functions adapted from `core/pb-connect`.
*   **Implementation Details:**
    1.  **Setup:** Initialize Supabase client (if needed for logging/status updates), import `puppeteer-core`.
    2.  **Request Handling:** Handle invocation payload: `{ productBoardFeatureUrl, adoWorkItemId, pbSessionToken }`.
    3.  **Puppeteer Launch:**
        *   Configure Puppeteer to connect to a suitable browser instance. (May require specifying an executable path or using a browserless service endpoint depending on Supabase's Node.js function environment).
        *   `const browser = await puppeteer.launch(...)` or `puppeteer.connect(...)`.
        *   `const page = await browser.newPage()`.
    4.  **Authentication:**
        *   Set the Productboard session cookie: `await page.setCookie({ name: 'SESSION_TOKEN_COOKIE_NAME', value: pbSessionToken, domain: '.productboard.com', ... });` (Adjust cookie name/details as needed).
    5.  **UI Automation Sequence:**
        *   `await page.goto(productBoardFeatureUrl, { waitUntil: 'networkidle0' });`
        *   **Wait & Locate Integrations:** `await page.waitForSelector('SELECTOR_FOR_INTEGRATIONS_BUTTON');` then `await page.click('SELECTOR_FOR_INTEGRATIONS_BUTTON');`
        *   **Wait & Locate ADO Input:** `await page.waitForSelector('SELECTOR_FOR_ADO_LINK_INPUT');`
        *   **Enter ADO ID:** `await page.type('SELECTOR_FOR_ADO_LINK_INPUT', adoWorkItemId);`
        *   **Locate & Click Save/Link:** `await page.waitForSelector('SELECTOR_FOR_SAVE_LINK_BUTTON');` then `await page.click('SELECTOR_FOR_SAVE_LINK_BUTTON');`
        *   **(Optional) Wait/Verify:** Add a brief `page.waitForTimeout(1000)` or wait for a success indicator if one exists.
    6.  **Error Handling:** Wrap Puppeteer steps in `try...catch`. Log specific errors (e.g., selector not found, navigation timeout).
    7.  **Cleanup:** Ensure browser closure in a `finally` block: `await browser.close();`.
    8.  **Logging:** Log start, key steps (navigation, clicks), success, and detailed errors.

### Step 3.2: Identify UI Selectors
*   **Action:** Manually inspect the Productboard feature page UI to determine the exact CSS selectors for:
    *   The "Integrations" button/link.
    *   The Azure DevOps link input field within the integrations panel.
    *   The "Save" or "Link" button for the ADO integration.
*   **Note:** These selectors are critical and prone to breaking if the PB UI changes. Document them clearly within the function code comments.

---

## Phase 4: Deployment & Configuration

### Step 4.1: Deploy Supabase Functions
*   **Action:** Use the Supabase CLI to deploy both functions:
    *   `supabase functions deploy pb-ado-sync`
    *   `supabase functions deploy pb-link-updater --no-verify-jwt` (if invoked internally without user context) or configure appropriate JWT verification if needed.
*   **Note:** Ensure the Node.js runtime environment for `pb-link-updater` is correctly configured with Puppeteer dependencies.

### Step 4.2: Obtain Function URL
*   **Action:** After deploying `pb-ado-sync`, retrieve its invocation URL from the Supabase dashboard or CLI output.

### Step 4.3: Configure Productboard Webhook
*   **Action:** In Productboard (UI or API):
    *   Create a new webhook.
    *   **Name:** e.g., "ADO Sync Webhook"
    *   **URL:** Paste the `pb-ado-sync` function invocation URL.
    *   **Events:** Select `feature.created`, `feature.updated` (or chosen events).
    *   **Secret:** Paste the `PB_WEBHOOK_SECRET` generated in Step 1.1.
    *   **Enabled:** Set to `true`.

---

## Phase 5: Testing & Monitoring

### Step 5.1: Unit & Integration Testing
*   **Action:** Test `pb-ado-sync` by sending mock webhook payloads (e.g., using `curl` or Postman) and verifying:
    *   Signature validation works.
    *   ADO API is called correctly (check ADO).
    *   `pb-link-updater` function is invoked (check Supabase logs).
*   **Action:** Test `pb-link-updater` by invoking it directly (via Supabase client or CLI) with sample data and verifying:
    *   Puppeteer runs without crashing.
    *   The link appears in the target PB feature (requires manual check or further automation).
*   **Action:** Perform end-to-end testing by making a change in Productboard and verifying the entire flow completes successfully.

### Step 5.2: Monitoring & Maintenance
*   **Action:** Set up monitoring on Supabase function logs. Pay close attention to errors from `pb-link-updater`, especially related to timeouts or missing selectors.
*   **Action:** Plan for regular checks (manual or automated) to ensure the UI selectors used in `pb-link-updater` are still valid after Productboard UI updates.
