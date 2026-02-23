# PayPlus Companies Service — Data Model Reference

## Overview

The Companies service manages the full organizational structure for a payment platform — from top-level companies down to individual payment terminals. It also handles compliance (KYC/AML), onboarding, settlement accounts, and localization. All entities live under `subservices/companies/internal/domain/models/`.

---

## Entity Hierarchy (Primary Tree)

```
Company  (self-referential tree via ParentCompanyID)
├── CompanyContact          (1:N)
├── CompanyBankAccount      (polymorphic, OwnerType = "company")
├── Location                (1:N, each has an Address)
│   └── StoreLocationLink   (M:N junction → Store)
├── OnboardingApplication   (1:N, optional links)
├── OrgEntityLocalization   (polymorphic, OwnerType = "company")
│
└── CompanyLegalEntity      (1:N)
    ├── BeneficialOwner     (1:N)
    │   └── ComplianceDocument (optional, via BeneficialOwnerID)
    ├── ComplianceDocument  (1:N, via LegalEntityID)
    ├── CompanyBankAccount  (polymorphic, OwnerType = "legal_entity")
    │
    └── Merchant            (1:N)
        └── MerchantAccount (1:N, also refs Company + LegalEntity)
            ├── Store                   (1:N)
            │   └── TerminalGroup       (1:N)
            │       └── Terminal        (1:N)
            ├── SubMerchantAccount      (1:N, also refs Merchant)
            ├── ApiCredential           (1:N)
            ├── ProviderMerchantID      (1:N)
            ├── CompanyBankAccount      (polymorphic, OwnerType = "merchant_account")
            └── OrgEntityLocalization   (polymorphic)
```

---

## Entities Detail

### 1. Company

The root organizational entity. Supports a **self-referential tree** for holding-company / subsidiary structures.

| Field | Type | Description |
|---|---|---|
| ID | int64 | Primary key |
| Uuid | string | Public identifier |
| ParentCompanyID | *int64 | FK → Company (nullable for root) |
| RootCompanyID | int64 | FK → Company (top of the tree) |
| Depth | int16 | Level in the hierarchy (0 = root) |
| Path | string | Materialized path for tree queries |
| Name | string | Display name |
| Number | string | Internal company number |
| Status | string | `NEW`, `PENDING_KYC`, `ACTIVE`, `RESTRICTED`, `SUSPENDED`, `CLOSED`, `TERMINATED` |
| CompanyType | string | `holding_company`, `operating_company`, `single_entity` |
| BusinessType | string | `individual`, `company`, `non_profit`, `government_entity` |
| PlatformAccountType | string | `standard`, `express`, `custom` |
| ContractType | string | `direct`, `aggregator`, `marketplace`, `payfac`, `mixed` |
| DefaultCurrency | string | ISO 4217 alpha-3 (e.g., `USD`) |
| DefaultCountry | string | ISO 3166-1 alpha-2 (e.g., `US`) |
| Timezone | string | IANA timezone |
| MCC | string | Default Merchant Category Code |
| HighRiskMerchant | bool | High-risk flag |
| IsBlocked | bool | Company blocked |
| RiskProfile | string | `low`, `medium`, `high`, `critical`, `custom` |
| KycStatus | string | `not_started`, `pending`, `in_review`, `verified`, `failed`, `expired` |
| AmlStatus | string | `pending`, `clear`, `review`, `blocked` |
| Website | string | |
| SupportEmail | string | |
| SupportPhone | string | |
| VolumeTier | string | `starter`, `growth`, `enterprise`, `custom` |
| MonthlyVolumeLimit | *int64 | |
| MessageForClient | string | |
| ActivatedAt | *time.Time | |
| Metadata | []byte | JSON blob |
| CreatedAt / UpdatedAt / DeletedAt | time.Time | Soft-delete timestamps |
| CreatedBy / UpdatedBy / DeletedBy | string | Audit trail |

**Relationships:**
- **Self-referential tree** → `ParentCompanyID` references another Company
- **Children:** CompanyLegalEntity, CompanyContact, Location, OnboardingApplication, CompanyBankAccount (polymorphic), OrgEntityLocalization (polymorphic)

---

### 2. CompanyLegalEntity

The legal registration of a company in a specific jurisdiction.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| CompanyID | int64 | **FK → Company** |
| LegalName | string | Official legal name |
| EntityType | string | `corporation`, `llc`, `limited`, `sole_proprietor`, `partnership`, `non_profit`, `government` |
| TaxID | string | Tax identifier |
| TaxIDType | string | `ein`, `vat`, `gst`, `abn`, `business_number`, `national_id`, `other` |
| VatNumber | string | |
| RegistrationNumber | string | |
| DateOfIncorporation | *time.Time | |
| Country | string | ISO alpha-2 |
| RegisteredAddressID | int64 | **FK → Address** (required) |
| OperatingAddressID | *int64 | **FK → Address** (optional) |
| KycStatus | string | `pending`, `in_review`, `verified`, `rejected`, `expired` |
| KycVerifiedAt / KycExpiry | *time.Time | |
| Status | string | `active`, `pending_verification`, `verified`, `suspended`, `dissolved` |

**Relationships:**
- **Parent:** Company (via CompanyID)
- **Children:** Merchant, BeneficialOwner, ComplianceDocument
- **References:** Address (RegisteredAddressID, OperatingAddressID)

---

### 3. Merchant

A business entity that accepts payments, belonging to a legal entity.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| LegalEntityID | int64 | **FK → CompanyLegalEntity** |
| MerchantIDExternal | string | External system identifier |
| Name | string | |
| MerchantCode | string | Unique merchant code |
| CategoryCode | string | Industry category |
| MCCDefault | string | Default MCC (4 digits) |
| BusinessModel | string | `retail`, `ecommerce`, `marketplace`, `saas`, `subscription`, `professional_services` |
| Status | string | Same lifecycle as Company |
| Website / ContactEmail / ContactPhone | string | |
| AddressID | *int64 | **FK → Address** (optional) |
| Notes | string | |
| Metadata | []byte | |

**Relationships:**
- **Parent:** CompanyLegalEntity (via LegalEntityID)
- **Children:** MerchantAccount, SubMerchantAccount (indirect)

---

### 4. MerchantAccount

The operational payment-processing account. Central entity tying merchant, company, and legal entity together.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| MerchantID | int64 | **FK → Merchant** |
| CompanyID | int64 | **FK → Company** |
| LegalEntityID | int64 | **FK → CompanyLegalEntity** |
| MerchantIDExternal | string | |
| Name / MerchantCode | string | |
| MCC | string | 4-digit code |
| ContractType | string | `direct`, `aggregator`, `marketplace`, `payfac`, `mixed` |
| VolumeTier | string | `starter`, `growth`, `enterprise`, `custom` |
| Status / KycStatus / AmlStatus / RiskProfile | string | Compliance statuses |
| ChargesEnabled / PayoutsEnabled | bool | Feature flags |
| Country | string | ISO alpha-2 |
| Currency | string | ISO alpha-3 |
| Timezone | string | IANA |
| SettlementAccountID | *int64 | **FK → CompanyBankAccount** |
| Descriptor | string | Statement descriptor |
| SettlementType | string | `gross`, `net` |
| SettlementDelayDays | *int32 | |
| SettlementCurrencyMode | string | `TRANSACTION`, `FIXED`, `MERCHANT_DEFAULT` |
| PayoutSchedule | string | `instant`, `daily`, `weekly`, `biweekly`, `monthly`, `manual` |
| ReserveRate / ChargebackRatio | *float64 | |
| MonthlyVolumeLimit | *int64 | |
| RiskProfileID | *int64 | External risk profile ref |
| FraudProvider | []byte | JSON config |
| DefaultAcquiringModel | string | `PLATFORM_MID`, `SELLER_MID` |
| DefaultAcquiringProviderID | *int64 | |
| PricingPlanID | string | UUID ref |
| Phone / Email / CallbackURL / WebhookURL | string | Integration endpoints |
| IntegrationMode | string | `API`, `HOSTED`, `REDIRECT`, `PLUGIN`, `SDK` |
| DefaultPaymentFlow | string | `AUTH_CAPTURE`, `SALE`, `AUTH_ONLY` |
| Notes | string | |
| Metadata | []byte | |
| ActivatedAt | *time.Time | |

**Relationships:**
- **Parents:** Merchant, Company, CompanyLegalEntity
- **Children:** Store, SubMerchantAccount, ApiCredential, ProviderMerchantID
- **References:** CompanyBankAccount (SettlementAccountID)

---

### 5. SubMerchantAccount

Sub-merchants under a platform/marketplace model (PayFac). Rich KYC, fee, and volume-limit configuration.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| MerchantAccountID | int64 | **FK → MerchantAccount** |
| MerchantID | int64 | **FK → Merchant** |
| CompanyID | *int64 | **FK → Company** (optional) |
| LegalEntityID | *int64 | **FK → CompanyLegalEntity** (optional) |
| PlatformID | *int64 | Reference to platform |
| Name / SubMerchantCode / ExternalReferenceID | string | |
| EntityType | string | `individual`, `sole_proprietor`, `company`, `non_profit` |
| FirstName / LastName / DateOfBirth / NationalID | string | For individual sellers |
| SellerModel | string | `PLATFORM_MOR`, `SELLER_MOR` |
| CategoryCode / MCCDefault | string | |
| Status | string | Extended: `NEW`, `PENDING_KYC`, `ACTIVE`, `RESTRICTED`, `UNDER_REVIEW`, `SUSPENDED`, `BLOCKED`, `CLOSED`, `TERMINATED` |
| OnboardingStatus | string | `NEW`, `DOCUMENTS_REQUIRED`, `PENDING_VERIFICATION`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `ACTIVE` |
| KycStatus / KycTier / KycVerifiedAt / KycExpiry | string / *time.Time | |
| OnboardingType | string | `instant`, `standard`, `manual_review` |
| RiskScore | *float64 | |
| IsMatchListed / SanctionsClear | bool | Compliance flags |
| ChargebackRatio | *float64 | |
| PaymentsEnabled / PayoutsEnabled | bool | |
| Country / Currency / Timezone | string | |
| AddressID | *int64 | **FK → Address** |
| SettlementAccountID | *int64 | **FK → CompanyBankAccount** |
| PayoutSchedule / PayoutDelayDays / PayoutMethod | string / *int32 | |
| UsesParentSettlement | bool | Inherits parent settlement |
| PlatformFeePercentage / PlatformFeeFixed | *float64 / *int64 | Platform fees |
| FeeMdrRate / FeeFixedAmount / FeePlatformCommission | *float64 / *int64 | Fee breakdown |
| FeeModel | string | `FLAT_RATE`, `INTERCHANGE_PLUS`, `TIERED`, `BLENDED` |
| PricingPlanID | string | |
| ShvaFeePassthrough | bool | Israel-specific (Shva network) |
| VolumeLimitDaily / VolumeLimitMonthly / VolumeLimitSingleTx | *int64 | |
| DefaultAcquiringModel | string | `PLATFORM_MID`, `SELLER_MID` |
| RiskProfileID | *int64 | |
| VelocityLimits | []byte | JSON |
| RoutingMergeStrategy | string | `INHERIT`, `OVERRIDE`, `MERGE` |
| CallbackURL / WebhookURL | string | |
| TermsAcceptedAt / ActivatedAt | *time.Time | |
| Notes | string | |
| Metadata | []byte | |

**Relationships:**
- **Parents:** MerchantAccount, Merchant
- **Optional Parents:** Company, CompanyLegalEntity
- **References:** Address, CompanyBankAccount (SettlementAccountID)

---

### 6. Store

A physical or online sales point under a merchant account.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| MerchantAccountID | int64 | **FK → MerchantAccount** |
| StoreCode | string | Unique store code |
| StoreType | string | `physical`, `online`, `mobile`, `popup` |
| Name | string | |
| Timezone | string | IANA |
| ChannelType | string | `POS`, `ECOMMERCE`, `API`, `MOBILE` |
| Status | string | `ACTIVE`, `SUSPENDED`, `CLOSED` |
| AddressID | *int64 | **FK → Address** |
| Phone / Email | string | |
| Metadata | []byte | |

**Relationships:**
- **Parent:** MerchantAccount (via MerchantAccountID)
- **Children:** TerminalGroup
- **M:N:** Location (via StoreLocationLink junction)

---

### 7. TerminalGroup

Logical grouping of terminals within a store.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| StoreID | int64 | **FK → Store** |
| Name / Description | string | |
| Status | string | `ACTIVE`, `SUSPENDED`, `CLOSED` |
| Metadata | []byte | |

**Relationships:**
- **Parent:** Store (via StoreID)
- **Children:** Terminal

---

### 8. Terminal

A specific payment terminal (physical POS, virtual, or SoftPOS).

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| TerminalGroupID | int64 | **FK → TerminalGroup** |
| TerminalCode | string | |
| TerminalType | string | `physical`, `virtual`, `softpos` |
| Status | string | `ACTIVE`, `PROVISIONING`, `SUSPENDED`, `CLOSED`, `MAINTENANCE` |
| DeviceModel / SerialNumber / FirmwareVersion | string | Hardware info |
| HardwareID / MacAddress / IPAddress | string | Network/device identity |
| EndpointURL | string | |
| IntegrationType | string | `SDK`, `API`, `REDIRECT`, `PLUGIN`, `HOSTED` |
| SdkVersion | string | |
| Platform | string | `ANDROID`, `IOS`, `LINUX`, `WINDOWS`, `PROPRIETARY` |
| CallbackURL | string | |
| IPWhitelist | []byte | JSON array |
| LocationMetadata | []byte | JSON |
| AssignedUser | string | |
| LastActiveAt / ActivatedAt | *time.Time | |
| Metadata | []byte | |

**Relationships:**
- **Parent:** TerminalGroup (via TerminalGroupID)

---

### 9. CompanyContact

Contact persons associated with a company.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| CompanyID | int64 | **FK → Company** |
| ContactType | string | `general`, `technical`, `billing`, `compliance`, `support`, `legal` |
| FirstName / LastName / FullName | string | |
| Email / Phone / Mobile | string | |
| JobTitle / Department | string | |
| LangCode | string | Preferred language |
| IsDefault / IsPrimary | bool | |

**Relationships:**
- **Parent:** Company (via CompanyID)

---

### 10. BeneficialOwner

Natural persons who own or control a legal entity (KYC requirement).

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| LegalEntityID | int64 | **FK → CompanyLegalEntity** |
| FirstName / LastName | string | |
| DateOfBirth | time.Time | |
| Nationality | string | ISO alpha-2 |
| NationalID / NationalIDType | string | `passport`, `national_id`, `drivers_license`, `other` |
| OwnershipPercentage | float64 | 0-100% |
| Role | string | `owner`, `director`, `controller`, `signatory` |
| AddressID | *int64 | **FK → Address** |
| PepStatus | bool | Politically Exposed Person |
| SanctionsClear | *bool | |
| VerificationStatus | string | `pending`, `verified`, `failed`, `expired` |
| VerifiedAt | *time.Time | |

**Relationships:**
- **Parent:** CompanyLegalEntity (via LegalEntityID)
- **Children:** ComplianceDocument (optional)
- **References:** Address

---

### 11. ComplianceDocument

KYC/KYB documents uploaded for verification.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| LegalEntityID | int64 | **FK → CompanyLegalEntity** |
| BeneficialOwnerID | *int64 | **FK → BeneficialOwner** (optional) |
| DocumentType | string | `incorporation_certificate`, `business_license`, `tax_registration`, `proof_of_address`, `bank_statement`, `government_id_front`, `government_id_back`, `selfie`, `articles_of_association`, `shareholder_register`, `financial_statement`, `power_of_attorney`, `other` |
| DocumentName / FileReference / FileType | string | |
| FileSizeBytes | *int64 | |
| IssuingCountry | string | |
| IssueDate / ExpiryDate | *time.Time | |
| VerificationStatus | string | `pending`, `accepted`, `rejected`, `expired` |
| RejectionReason | string | |
| VerifiedAt / VerifiedBy | *time.Time / string | |

**Relationships:**
- **Parent:** CompanyLegalEntity (via LegalEntityID)
- **Optional Parent:** BeneficialOwner (via BeneficialOwnerID)

---

### 12. CompanyBankAccount

Settlement/payout bank accounts. **Polymorphic** — can belong to different owner types.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| OwnerType | string | **`company`**, **`legal_entity`**, **`merchant_account`**, **`sub_merchant`** |
| OwnerID | int64 | FK to the owner entity (by OwnerType) |
| OwnerUUID | string | UUID of the owner entity |
| AccountHolderName | string | |
| AccountType | string | `checking`, `savings`, `current` |
| BankCountry | string | ISO alpha-2 |
| Currency | string | ISO alpha-3 |
| IBAN / RoutingNumber / AccountNumber / SortCode / BSB / SwiftBIC | string | Regional bank identifiers |
| BankName / BankBranch | string | |
| Verified | bool | |
| VerifiedAt | *time.Time | |
| VerificationMethod | string | `micro_deposit`, `instant`, `manual`, `bank_statement` |
| IsDefault / IsActive | bool | |

**Relationships (polymorphic):**
- **Owner:** Company OR CompanyLegalEntity OR MerchantAccount OR SubMerchantAccount
- Referenced by MerchantAccount.SettlementAccountID, SubMerchantAccount.SettlementAccountID

---

### 13. Location

Physical or logical locations belonging to a company.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| CompanyID | int64 | **FK → Company** |
| LocationType | string | `BRANCH`, `WAREHOUSE`, `HQ`, `PICKUP_POINT`, `OFFICE` |
| Name | string | |
| AddressID | int64 | **FK → Address** |
| Status | string | `ACTIVE`, `SUSPENDED`, `CLOSED` |
| Phone | string | |
| Metadata | []byte | |

**Relationships:**
- **Parent:** Company (via CompanyID)
- **References:** Address (required)
- **M:N:** Store (via StoreLocationLink)

---

### 14. StoreLocationLink

**Junction table** linking Stores and Locations in a many-to-many relationship.

| Field | Type | Description |
|---|---|---|
| StoreID | int64 | **FK → Store** |
| LocationID | int64 | **FK → Location** |
| StoreUUID / LocationUUID | string | UUID references |
| Role | string | `SALES`, `FULFILLMENT`, `RETURNS`, `PICKUP` |
| Priority | int32 | Ordering priority |

**Relationships:**
- **Parents:** Store + Location (composite key)

---

### 15. ApiCredential

API keys for merchant account integration.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| MerchantAccountID | int64 | **FK → MerchantAccount** |
| Name | string | |
| ApiKey / ApiSecretHash | string | |
| Status | string | `ACTIVE`, `SUSPENDED`, `REVOKED` |
| IPWhitelist | []byte | JSON array |
| LastUsedAt / ExpiresAt | *time.Time | |

**Relationships:**
- **Parent:** MerchantAccount (via MerchantAccountID)

---

### 16. ProviderMerchantID

Maps a merchant account to external payment provider identifiers (acquirers, PSPs).

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| MerchantAccountID | int64 | **FK → MerchantAccount** |
| ProviderCode | string | Acquirer/PSP identifier |
| ProviderMerchantID | string | MID at the provider |
| ProviderTerminalID | string | TID at the provider |
| Status | string | `ACTIVE`, `SUSPENDED`, `CLOSED` |
| IsPrimary | bool | |
| ActivatedAt | *time.Time | |
| Metadata | []byte | |

**Relationships:**
- **Parent:** MerchantAccount (via MerchantAccountID)

---

### 17. OnboardingApplication

Merchant/company onboarding requests with KYB/KYC/underwriting workflow.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| RequestedMode | string | `GATEWAY`, `PROCESSOR`, `PAYFAC` |
| ApplicantName / ApplicantEmail / ApplicantPhone | string | |
| CompanyID | *int64 | **FK → Company** (optional, set after approval) |
| LegalEntityID | *int64 | **FK → CompanyLegalEntity** (optional) |
| MerchantID | *int64 | **FK → Merchant** (optional) |
| MerchantAccountID | *int64 | **FK → MerchantAccount** (optional) |
| SubMerchantID | *int64 | **FK → SubMerchantAccount** (optional) |
| BusinessName / BusinessType / TaxID | string | |
| Country | string | ISO alpha-2 |
| MCC / Website / BusinessDescription | string | |
| ExpectedMonthlyVolume / ExpectedAvgTicket | *int64 | |
| Status | string | `SUBMITTED`, `IN_REVIEW`, `KYB_PENDING`, `KYC_PENDING`, `UNDERWRITING`, `APPROVED`, `CONDITIONAL`, `REJECTED`, `EXPIRED`, `CANCELLED` |
| KybResult / KycResult / RiskAssessment / UnderwritingDecision | []byte | JSON blobs |
| RejectionReason | string | |
| SubmittedAt / ReviewedAt / DecidedAt / ActivatedAt / ExpiresAt | *time.Time | Workflow timestamps |

**Relationships:**
- **Optional links** to Company, CompanyLegalEntity, Merchant, MerchantAccount, SubMerchantAccount (populated as onboarding progresses)

---

### 18. OrgEntityLocalization

Localized display names, branding, and contact info. **Polymorphic** — can belong to any organizational entity.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| OwnerType | string | Entity type (e.g., `company`, `merchant_account`, etc.) |
| OwnerUUID | string | UUID of the owner entity |
| LangCode | string | ISO language code |
| DisplayName / BrandName / LegalEntityName | string | Localized names |
| SettlementDescriptor | string | |
| Description | string | |
| WebsiteURL | string | |
| ContactName / ContactEmail / ContactPhone | string | |
| SupportEmail / SupportPhone | string | |
| ReceiptHeader / ReceiptFooter / InvoiceNotes | string | Receipt/invoice customization |
| IsDefault | bool | Default locale for the entity |

**Relationships (polymorphic):**
- **Owner:** Any organizational entity (Company, MerchantAccount, SubMerchantAccount, etc.)

---

### 19. Address

Standalone address entity referenced by many other entities.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| AddressType | string | `registered`, `operating`, `shipping`, `billing`, `other` |
| CountryCode | string | ISO alpha-2 |
| State / City / District / PostalCode | string | |
| Line1 / Line2 / Line3 | string | |
| CompanyName / ContactName / Phone | string | |
| Latitude / Longitude | *float64 | Geocoordinates |
| Validated | bool | |
| ValidatedAt | *time.Time | |
| ValidationSource | string | `MANUAL`, `GOOGLE_PLACES`, `GOVERNMENT_REGISTRY`, `BANK_VERIFIED` |

**Referenced by:** CompanyLegalEntity (registered/operating), Merchant, Store, BeneficialOwner, SubMerchantAccount, Location

---

## Reference / Lookup Tables

These are global lookup tables — not part of the organizational hierarchy. They provide standardized codes and configurations.

### 20. Country

| Field | Type | Description |
|---|---|---|
| ID | int64 | PK |
| Alpha2 / Alpha3 / NumericCode | string | ISO 3166 codes |
| Name / OfficialName | string | |
| Region / SubRegion | string | Geographic classification |
| PhonePrefix | string | International dialing code |
| IsActive / IsSanctioned | bool | |
| Metadata | []byte | |

### 21. Currency

| Field | Type | Description |
|---|---|---|
| ID | int64 | PK |
| Alpha3 / NumericCode | string | ISO 4217 codes |
| Name / Symbol | string | |
| Decimals | int16 | Decimal places |
| MinorUnit | int32 | Smallest unit (e.g., cents) |
| CountryAlpha2 | string | Primary country |
| IsActive / IsCrypto | bool | |
| Metadata | []byte | |

### 22. Bank

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| CountryAlpha2 | string | Country |
| BankCode / SwiftBic / RoutingNumber | string | Identifiers |
| Name / ShortName | string | |
| BranchCount | *int32 | |
| IsActive / SupportsInstant | bool | |
| Metadata | []byte | |

### 23. Language

| Field | Type | Description |
|---|---|---|
| ID | int64 | PK |
| LangCode | string | ISO 639 code |
| Name / NativeName | string | |
| Script | string | Writing system |
| Direction | string | `ltr` or `rtl` |
| CountryAlpha2 | string | Primary country |
| IsActive | bool | |

### 24. Timezone

| Field | Type | Description |
|---|---|---|
| ID | int64 | PK |
| TzName | string | IANA name (e.g., `Asia/Jerusalem`) |
| UtcOffset | string | e.g., `+02:00` |
| UtcOffsetMinutes | int32 | Numeric offset |
| Region | string | Geographic region |
| CountryAlpha2 | string | Country |
| IsActive | bool | |

### 25. MccCode

Merchant Category Codes (ISO 18245) with risk classification.

| Field | Type | Description |
|---|---|---|
| ID | int64 | PK |
| Mcc | string | 4-digit code |
| Description / Category | string | |
| RiskTier | string | Risk classification |
| IsHighRisk / IsRestricted / IsActive | bool | |
| Metadata | []byte | |

### 26. ReferenceCode

Configurable reference data with self-referential domain hierarchy.

| Field | Type | Description |
|---|---|---|
| ID / Uuid | int64 / string | Keys |
| Domain | string | Category/namespace (e.g., `status`, `fee_model`) |
| Code | string | Value within the domain |
| ParentDomain / ParentCode | string | Self-referential for nested lookups |
| SortOrder | int16 | Display ordering |
| IsActive / IsDefault / IsSystem | bool | |
| AllowedOwners | []byte | JSON — which entity types can use this code |
| Metadata | []byte | |

---

## Relationship Summary (Entity-Relationship Map)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REFERENCE DATA                                  │
│  Country  Currency  Bank  Language  Timezone  MccCode  ReferenceCode    │
└─────────────────────────────────────────────────────────────────────────┘
        ↕ (referenced by value, not FK)

┌─────────────────────────────────────────────────────────────────────────┐
│  Company (self-referential tree)                                        │
│  ├── CompanyContact (1:N)                                               │
│  ├── Location (1:N) ──→ Address                                         │
│  │     └──[StoreLocationLink]──→ Store                                  │
│  ├── OnboardingApplication (1:N, optional FKs)                          │
│  ├── CompanyBankAccount (polymorphic: owner_type="company")             │
│  ├── OrgEntityLocalization (polymorphic)                                │
│  │                                                                      │
│  └── CompanyLegalEntity (1:N) ──→ Address (registered, operating)       │
│        ├── BeneficialOwner (1:N) ──→ Address                            │
│        │     └── ComplianceDocument (optional)                          │
│        ├── ComplianceDocument (1:N)                                     │
│        ├── CompanyBankAccount (polymorphic: owner_type="legal_entity")  │
│        │                                                                │
│        └── Merchant (1:N)                                               │
│              └── MerchantAccount (1:N) ──→ Company, LegalEntity         │
│                    ├── Store (1:N) ──→ Address                           │
│                    │     └── TerminalGroup (1:N)                         │
│                    │           └── Terminal (1:N)                        │
│                    ├── SubMerchantAccount (1:N) ──→ Address, BankAcct   │
│                    ├── ApiCredential (1:N)                               │
│                    ├── ProviderMerchantID (1:N)                          │
│                    ├── CompanyBankAccount (polymorphic: "merchant_acct") │
│                    └── OrgEntityLocalization (polymorphic)               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Patterns

| Pattern | Details |
|---|---|
| **Materialized Path Tree** | Company uses `ParentCompanyID`, `RootCompanyID`, `Depth`, and `Path` for hierarchical queries |
| **Polymorphic Ownership** | CompanyBankAccount and OrgEntityLocalization use `OwnerType` + `OwnerID`/`OwnerUUID` to belong to different entity types |
| **Junction Table** | StoreLocationLink provides M:N between Store and Location with role and priority |
| **Soft Delete** | Most entities have `DeletedAt` + `DeletedBy` for soft deletion |
| **Audit Trail** | `CreatedBy`, `UpdatedBy`, `DeletedBy` on all mutable entities |
| **UUID + Internal ID** | Dual-key pattern — internal int64 ID for joins, UUID for public API exposure |
| **Status Lifecycle** | Common pattern: `NEW → PENDING_KYC → ACTIVE → SUSPENDED → CLOSED → TERMINATED` |
| **Reference by Value** | Country, Currency, Timezone, MCC referenced by code strings (not FK) in business entities |
| **Metadata Blobs** | Most entities have a `Metadata []byte` field for extensible JSON data |

---

## API Relationship Constraints (Postman Cross-Check)

Cross-checking `pay-plus-skeleton.postman_collection.json` confirms the same parent-child chain and adds explicit API dependency constraints:

- `LegalEntity` requires `company_uuid`
- `BeneficialOwner` requires `legal_entity_uuid`
- `ComplianceDocument` requires `legal_entity_uuid` and optionally `beneficial_owner_uuid`
- `Merchant` requires `legal_entity_uuid`
- `MerchantAccount` requires `merchant_uuid`, `company_uuid`, `legal_entity_uuid`
- `SubMerchantAccount` requires `merchant_account_uuid` and `merchant_uuid`
- `Store` requires `merchant_account_uuid`
- `TerminalGroup` requires `store_uuid`
- `Terminal` requires `terminal_group_uuid`
- `Location` requires `company_uuid`
- `CompanyBankAccount` requires polymorphic pair: `owner_type` + `owner_uuid`
- `ApiCredential` and `ProviderMerchantID` require `merchant_account_uuid`
- `StoreLocationLink` requires `store_uuid` + `location_uuid` + `role` (composite identity)
- `OrgEntityLocalization` requires polymorphic pair: `owner_type` + `owner_uuid`

This means the backend has both:
1. **Data-model relationships** (FK-style links in domain models), and
2. **Workflow relationships** (creation/listing order enforced by API parent UUIDs).

---

## Operation Patterns

Most entities follow the standard operation set:

- **Create**
- **Get**
- **List** (filters + pagination)
- **Update**
- **Delete** (soft-delete semantics for most business entities)

Notable exceptions and nuances:

- `StoreLocationLink` is a junction resource with **Create/List/Delete** and **composite key** (`store_uuid`, `location_uuid`, `role`) instead of UUID.
- In Postman, `OnboardingApplication` is currently documented as **Create/List/Get/Update** (no delete request present in collection), even though domain DTOs include a delete request type.
- Some lookup resources (`Country`, `Currency`, `Language`, `Timezone`, `MccCode`) are retrieved by natural keys in API examples (alpha/code/tz name), while updates/deletes often use numeric IDs.

---

## Source-of-Truth Notes

- **Entity structure and relationships source of truth:** domain models + DTOs under `subservices/companies/internal/`.
- **Endpoint payload examples and workflow constraints:** Postman collection.
- There are a few naming/value drifts in Postman examples (for example, some sample enums/field names differ from DTO validations), but the relationship graph itself is consistent with the backend model.
