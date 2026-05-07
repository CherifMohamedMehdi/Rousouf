/**
 * TypeScript types for every Directus collection used by Roufouf.
 *
 * These types mirror docs/SCHEMA.md exactly. If the schema changes, update
 * this file in the same commit.
 *
 * The types are intentionally structural (not classes): both the mock data
 * layer and the real Directus SDK responses satisfy them.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type ID = string;
export type ISODate = string; // e.g. "2024-03-15"
export type ISODateTime = string; // e.g. "2024-03-15T10:00:00.000Z"
export type CurrencyCode = 'TND' | 'USD' | 'EUR';
export type DocumentStatus = 'pending' | 'published' | 'rejected' | 'archived';
export type OrganizationStatus = 'active' | 'archived';
export type SubmissionStatus = 'pending' | 'promoted' | 'rejected';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type TranslationSuggestionStatus = 'pending' | 'approved' | 'rejected';
export type DonationStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type ContactStatus = 'new' | 'read' | 'replied' | 'archived';
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'archived';
export type DocumentFileKind = 'main' | 'executive_summary' | 'annex' | 'dataset';
export type PdfPublicDisplayMode = 'auto' | 'original' | 'optimized';
export type DocumentFileOptimizationStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'skipped';
export type PartnerTier = 'strategic' | 'supporting' | 'media';
export type DonationFrequency = 'one_time' | 'monthly';

/**
 * A reference to a Directus file. In the mock layer this is just a URL; in
 * production it is the UUID of a row in `directus_files`.
 */
export interface DirectusFile {
  id: ID;
  url: string;
  filename?: string;
  mime_type?: string;
  width?: number;
  height?: number;
}

/** A JSON blob of optional per-locale translations. */
export interface LocalizedText {
  ar?: string;
  fr?: string;
  en?: string;
  other?: string;
}

// ---------------------------------------------------------------------------
// Taxonomies
// ---------------------------------------------------------------------------

export interface TaxonomyTerm {
  id: ID;
  slug: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  sort_order?: number;
}

export type Theme = TaxonomyTerm;
export type DocumentType = TaxonomyTerm;
export type Governorate = TaxonomyTerm;
export type Language = TaxonomyTerm;

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

export interface Organization {
  id: ID;
  slug: string;
  name: string;
  name_ar?: string;
  name_fr?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_fr?: string;
  description_en?: string;
  website?: string;
  logo?: DirectusFile | null;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  is_verified: boolean;
  status: OrganizationStatus;
  date_created: ISODateTime;
  date_updated: ISODateTime;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface DocumentFile {
  id: ID;
  document: ID;
  file: DirectusFile;
  kind: DocumentFileKind;
  optimized_file?: DirectusFile | null;
  optimization_status?: DocumentFileOptimizationStatus;
  optimization_error?: string | null;
  optimized_at?: ISODateTime | null;
  label_ar?: string;
  label_fr?: string;
  label_en?: string;
  sort_order?: number;
}

export interface Document {
  id: ID;
  title: string;
  author?: string;
  organization?: Organization | null;
  /**
   * What public visitors receive for viewer + download URLs: see `resolvePublicPdfFile`.
   * Default **`auto`** in Directus (`scripts/seed.ts`).
   */
  pdf_public_display: PdfPublicDisplayMode;
  date_published?: ISODate | null;
  abstract_original?: string;
  abstract_translations?: LocalizedText;
  language?: Language | null;
  themes: Theme[];
  document_type?: DocumentType | null;
  governorates: Governorate[];
  keywords: string[];
  /** Canonical URL of the document on the publisher's site, when known. */
  source_url?: string | null;
  supersedes?: { id: ID; title: string } | null;
  superseded_by?: { id: ID; title: string } | null;
  files: DocumentFile[];
  file_hash: string;
  content_fingerprint: string;
  status: DocumentStatus;
  date_uploaded: ISODateTime;
  date_created: ISODateTime;
  date_updated: ISODateTime;
}

// ---------------------------------------------------------------------------
// User-contribution collections
// ---------------------------------------------------------------------------

export type SuggestionTargetType = 'document' | 'organization';

export interface Suggestion {
  id: ID;
  target_type: SuggestionTargetType;
  document_id?: ID | null;
  organization_id?: ID | null;
  suggested_by_email?: string;
  field_name: string;
  field_label: string;
  current_value: string;
  suggested_value: string;
  note?: string;
  status: SuggestionStatus;
  admin_note?: string;
  date_submitted: ISODateTime;
  date_reviewed?: ISODateTime | null;
}

/**
 * User-submitted translated PDF for an existing document. Created via
 * POST /api/translation-suggestions (server uploads to `directus_files` then
 * inserts this row). Editors review like metadata suggestions.
 */
export interface TranslationSuggestion {
  id: ID;
  document: ID;
  language: ID;
  /** `directus_files.id` for the uploaded PDF. */
  pdf_file: ID;
  file_hash: string;
  content_fingerprint: string;
  suggested_by_email?: string;
  note?: string;
  status: TranslationSuggestionStatus;
  admin_note?: string;
  date_submitted: ISODateTime;
  date_reviewed?: ISODateTime | null;
}

export interface Submission {
  id: ID;
  title: string;
  author?: string;
  organization?: ID | null;
  date_published?: ISODate | null;
  abstract_original?: string;
  abstract_translations?: LocalizedText;
  language?: ID | null;
  themes: ID[];
  document_type?: ID | null;
  governorates: ID[];
  keywords: string[];
  /** Original publisher URL, if supplied by the contributor. */
  source_url?: string | null;
  file_hash: string;
  content_fingerprint: string;
  file_url?: string;
  submitted_by_name?: string;
  submitted_by_email?: string;
  submitted_by_org?: string;
  batch_id?: string;
  status: SubmissionStatus;
  admin_note?: string;
  date_submitted: ISODateTime;
}

export interface ContactMessage {
  id: ID;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: ContactStatus;
  date_created: ISODateTime;
}

// ---------------------------------------------------------------------------
// Partners, donations, leads
// ---------------------------------------------------------------------------

export interface Partner {
  id: ID;
  name: string;
  logo: DirectusFile;
  website?: string;
  tier: PartnerTier;
  sort_order: number;
  is_active: boolean;
  display_on_homepage: boolean;
}

export interface DonationTier {
  id: ID;
  amount_tnd: number;
  amount_usd: number;
  amount_eur: number;
  label_ar?: string;
  label_fr?: string;
  label_en?: string;
  impact_ar?: string;
  impact_fr?: string;
  impact_en?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Donation {
  id: ID;
  tier?: ID | null;
  amount: number;
  currency: CurrencyCode;
  frequency: DonationFrequency;
  donor_name?: string;
  donor_email?: string;
  message?: string;
  is_anonymous: boolean;
  display_on_homepage: boolean;
  public_display_name?: string;
  provider: string;
  provider_reference: string;
  status: DonationStatus;
  date_created: ISODateTime;
}

/**
 * The minimal, privacy-preserving shape exposed by /api/donors/highlights
 * and consumed by <DonorsWall>. Explicitly omits amount, email, message,
 * provider, and provider_reference.
 */
export interface PublicDonor {
  id: ID;
  display_name: string;
  month: string; // e.g. "2024-03"
}

export interface DonationLead {
  id: ID;
  name?: string;
  email?: string;
  intended_amount?: number;
  currency?: CurrencyCode;
  frequency?: DonationFrequency;
  message?: string;
  is_anonymous_intent?: boolean;
  display_on_homepage_intent?: boolean;
  public_display_name_intent?: string;
  status: LeadStatus;
  date_created: ISODateTime;
}

// ---------------------------------------------------------------------------
// Editorial
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: ID;
  name: string;
  role_ar?: string;
  role_fr?: string;
  role_en?: string;
  bio_ar?: string;
  bio_fr?: string;
  bio_en?: string;
  photo?: DirectusFile | null;
  linkedin_url?: string;
  organization?: Organization | null;
  sort_order: number;
  is_active: boolean;
}

export interface ImpactCallout {
  title: string;
  body: string;
}

export interface PagesSingleton {
  mission_ar?: string;
  mission_fr?: string;
  mission_en?: string;
  about_body_ar?: string;
  about_body_fr?: string;
  about_body_en?: string;
  impact_callouts_ar?: ImpactCallout[];
  impact_callouts_fr?: ImpactCallout[];
  impact_callouts_en?: ImpactCallout[];
  transparency_note_ar?: string;
  transparency_note_fr?: string;
  transparency_note_en?: string;
  social_twitter?: string;
  social_linkedin?: string;
  social_facebook?: string;
  social_youtube?: string;
}

export interface BrandingSnapshot {
  logo?: DirectusFile | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  border_color: string;
}

export interface BrandingSettings {
  id: number;
  logo?: DirectusFile | null;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  border_color?: string;
  published_logo?: DirectusFile | null;
  published_primary_color?: string;
  published_secondary_color?: string;
  published_background_color?: string;
  published_text_color?: string;
  published_border_color?: string;
  previous_published_snapshot?: BrandingSnapshot | null;
  last_published_at?: ISODateTime | null;
  last_published_by?: string | null;
  last_reverted_at?: ISODateTime | null;
  last_reverted_by?: string | null;
}

export interface SearchFacetDefinition {
  id: ID;
  key: string;
  query_param: string;
  source_field: string;
  label_ar?: string;
  label_fr?: string;
  label_en?: string;
  is_active: boolean;
  sort_order: number;
}

// ---------------------------------------------------------------------------
// Aggregates (used by /api/stats and the homepage)
// ---------------------------------------------------------------------------

export interface SiteStats {
  total_documents: number;
  total_organizations: number;
  earliest_year: number;
  latest_year: number;
}

// ---------------------------------------------------------------------------
// Duplicate-check API shapes
// ---------------------------------------------------------------------------

export interface DuplicateMatch {
  id: ID;
  title: string;
  organization_name?: string;
  date_published?: ISODate | null;
  similarity: number;
}

export interface DuplicateCheckResponse {
  exact?: DuplicateMatch;
  fuzzy: DuplicateMatch[];
  threshold: number;
}
