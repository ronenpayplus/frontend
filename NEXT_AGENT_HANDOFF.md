# Next Agent Handoff - PayPlus Companies Frontend

This document summarizes the current implementation state, backend contract discoveries, known issues, and recommended next steps.

## 1) Project Context

- Frontend stack: React + Vite + TypeScript + pure CSS.
- UI language/layout: Hebrew RTL by default, with LTR handling for technical fields.
- Backend integration: live backend via `/v2/companies/*`.
- Response envelope pattern (important): most endpoints return:
  - `{"results": {...}, "data": {...}}`
  - frontend API clients unwrap `data`.

## 2) Core Hierarchy Already Implemented

Implemented pages and CRUD flows:

- `companies`
- `legal-entities`
- `merchants`
- `merchant-accounts`
- `stores`
- `terminal-groups`
- `terminals`
- `beneficial-owners`
- `company contacts`
- `compliance-documents`
- `sub-merchants` (sub merchant accounts)

Navigation and drill-down buttons exist across most hierarchy transitions.

## 3) Reference Tables Implemented

Added "Reference Tables" section in sidebar:

- `countries`
- `currencies`
- `timezones`

All with list/create/edit/delete screens.

## 4) Important Backend Behavior/Quirks Discovered

### 4.1 Soft delete behavior

- Countries delete is soft delete (`is_active = false`), not hard delete.
- UX adjusted to reflect this and reduce confusion.

### 4.2 Re-create country after delete

- Recreating same country (e.g., `FR`) can hit duplicate due to soft delete.
- Countries page handles fallback:
  1. try create
  2. if duplicate, fetch by `alpha2`
  3. update existing with `is_active: true`

### 4.3 Update endpoints requiring body ID/UUID

Several endpoints require ID/UUID in **request body**, not only URL path.

Applied fixes:

- Countries update sends `id` in body.
- Currencies update sends `id` in body.
- Timezones update sends `id` in body.
- Beneficial Owners update sends `uuid` in body.
- Company Contacts update sends `uuid` in body.
- Compliance Documents update sends `uuid` in body.
- Sub Merchant update sends `uuid` in body.

### 4.4 Merchant account data quality issue from backend

Observed from live API:

- `merchant-accounts/list` and `merchant-accounts/get/:uuid` return empty:
  - `merchant_uuid`
  - `company_uuid`
  - `legal_entity_uuid`

This directly impacts any UI flow that tries to infer parent merchant from merchant account response.

## 5) Newly Added Sub Merchant Accounts

Implemented:

- Types: `src/types/subMerchantAccount.ts`
- API: `src/api/subMerchantAccounts.ts`
- Page: `src/pages/SubMerchantAccountsPage.tsx`
- Routes:
  - `/sub-merchants`
  - `/merchant-accounts/:uuid/sub-merchants`
- Sidebar item: "תתי-סוחרים"
- Drilldown from merchant accounts table.

## 6) Stores Parenting Clarification

User requested: sub-merchant can be parent of stores.

Current backend contract (`storesdto` + SQL) still keys stores by:

- `merchant_account_uuid` (not `sub_merchant_uuid`)

What was done in UI:

- Added route `/sub-merchants/:uuid/stores`.
- Stores page detects sub-merchant route, fetches sub-merchant, resolves underlying merchant account, and loads stores by merchant account.
- Breadcrumb/subtitle show sub-merchant context.

Limitation:

- True DB/API-level store ownership by sub-merchant is **not** currently exposed by backend contracts.

## 7) Known Open Issue (Current)

### Sub Merchants page - Merchant dropdown still appears empty in one flow

User report:

- "if i press merchant account in the search i see merchant but the drop down is empty"

Work already attempted:

1. Merchant became explicit required selector for create payload.
2. Added fallback to fetch selected merchant by `getMerchant(selectedMerchantUUID)` if not in list.

Still reported as empty.

Likely cause hypotheses:

- Merchant select value (`selectedMerchantUUID`) points to UUID not present in options due to stale query-param transitions.
- Merchant list loaded but merchant objects may not have expected shape/name.
- Route/query synchronization order may clear/override `merchant_uuid`.

## 8) Recommended Next Debug Steps (Concrete)

1. On `SubMerchantAccountsPage`, log/query-check:
   - `selectedMerchantUUID`
   - `merchants.length`
   - first 3 merchant option UUIDs/names
   - URL query params after each dropdown change.

2. Ensure merchant select has fallback option for unknown selected UUID:
   - if selected UUID exists but not in options, render temporary option:
     - label: `UUID: <selectedMerchantUUID>`
   - this prevents "empty display" even with missing merchant metadata.

3. Tie merchant account selection to merchant selection:
   - when `merchant_account_uuid` is chosen and `merchant_uuid` is empty:
     - infer merchant via:
       - direct backend endpoint if available, else
       - previously loaded merchants map by account relationships.
   - if no reliable inference, show visible inline warning.

4. Verify exact payload sent on create from DevTools:
   - `merchant_account_uuid` non-empty
   - `merchant_uuid` non-empty valid UUID
   - required fields present (`name`, `seller_model`, `category_code`, `country`, `currency`, `timezone`).

5. If backend keeps returning empty parent UUIDs for merchant accounts:
   - consider adding backend fix or dedicated endpoint relation query.

## 9) Main Files Added/Changed Recently

### Reference tables

- `src/pages/CountriesPage.tsx`
- `src/pages/CurrenciesPage.tsx`
- `src/pages/TimezonesPage.tsx`
- `src/api/countries.ts`
- `src/api/currencies.ts`
- `src/api/timezonesRef.ts`
- `src/types/country.ts`
- `src/types/currency.ts`
- `src/types/timezoneRef.ts`

### Beneficial owners

- `src/pages/BeneficialOwnersPage.tsx`
- `src/api/beneficialOwners.ts`
- `src/types/beneficialOwner.ts`

### Company contacts

- `src/pages/CompanyContactsPage.tsx`
- `src/api/companyContacts.ts`
- `src/types/companyContact.ts`

### Compliance docs

- `src/pages/ComplianceDocumentsPage.tsx`
- `src/api/complianceDocuments.ts`
- `src/types/complianceDocument.ts`

### Sub merchants

- `src/pages/SubMerchantAccountsPage.tsx`
- `src/api/subMerchantAccounts.ts`
- `src/types/subMerchantAccount.ts`
- `src/pages/StoresPage.tsx` (sub-merchant route context handling)

### Shared routing/navigation

- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/components/Layout.css`
- `src/pages/CompanyLegalEntities.tsx` (added drilldowns)
- `src/pages/CompanyDetail.tsx` (contacts shortcut)
- `src/pages/MerchantAccountsPage.tsx` (sub-merchants shortcut)

## 10) Build/Lint Status

At the end of recent edits:

- `npm run build` passes.
- Lints on touched files pass.

## 11) Quick Note to Next Agent

Focus first on resolving the Sub Merchant merchant-dropdown synchronization bug (section 7/8), because it blocks create flow usability even though API payload handling was improved.
