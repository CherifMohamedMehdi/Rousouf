import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mockDonationTiers } from '../mocks/donationTiers';
import { mockDocuments } from '../mocks/documents';
import { mockOrganizations } from '../mocks/organizations';
import { mockPages } from '../mocks/pages';
import { mockPartners } from '../mocks/partners';
import { mockTeamMembers } from '../mocks/teamMembers';
import { mockDocumentTypes, mockGovernorates, mockLanguages, mockThemes } from '../mocks/taxonomies';
import { meilisearchIndexSettings } from '../lib/search/meiliConfig';

type DirectusItem = { id?: string | number } & Record<string, unknown>;

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const MEILI_URL = process.env.MEILISEARCH_HOST ?? 'http://localhost:7700';
const MEILI_KEY = process.env.MEILISEARCH_KEY ?? 'roufouf-dev-master-key';
const ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD ?? 'roufouf-dev';

const COLLECTIONS: Array<{ name: string; icon?: string; singleton?: boolean }> = [
  { name: 'themes', icon: 'category' },
  { name: 'document_types', icon: 'description' },
  { name: 'governorates', icon: 'map' },
  { name: 'languages', icon: 'translate' },
  { name: 'search_facets', icon: 'tune' },
  { name: 'organizations', icon: 'domain' },
  { name: 'documents', icon: 'article' },
  { name: 'document_themes', icon: 'hub' },
  { name: 'document_governorates', icon: 'hub' },
  { name: 'partners', icon: 'handshake' },
  { name: 'donation_tiers', icon: 'volunteer_activism' },
  { name: 'donations', icon: 'payments' },
  { name: 'donation_leads', icon: 'contact_mail' },
  { name: 'team_members', icon: 'groups' },
  { name: 'pages', icon: 'web', singleton: true },
  { name: 'contact_messages', icon: 'mail' },
  { name: 'suggestions', icon: 'edit_note' },
  { name: 'translation_suggestions', icon: 'translate' },
  { name: 'submissions', icon: 'upload_file' },
  { name: 'ops_settings', icon: 'settings', singleton: true },
  { name: 'backup_jobs', icon: 'history' },
  { name: 'backup_requests', icon: 'play_circle' },
];

const FIELD_DEFS: Record<string, Array<{ field: string; type: string }>> = {
  themes: basicTaxonomyFields(),
  document_types: basicTaxonomyFields(),
  governorates: basicTaxonomyFields(),
  languages: basicTaxonomyFields(),
  search_facets: [
    { field: 'id', type: 'string' },
    { field: 'key', type: 'string' },
    { field: 'query_param', type: 'string' },
    { field: 'source_field', type: 'string' },
    { field: 'label_ar', type: 'string' },
    { field: 'label_fr', type: 'string' },
    { field: 'label_en', type: 'string' },
    { field: 'is_active', type: 'boolean' },
    { field: 'sort_order', type: 'integer' },
  ],
  organizations: [
    { field: 'id', type: 'string' },
    { field: 'slug', type: 'string' },
    { field: 'name', type: 'string' },
    { field: 'name_ar', type: 'string' },
    { field: 'name_fr', type: 'string' },
    { field: 'name_en', type: 'string' },
    { field: 'description', type: 'text' },
    { field: 'description_ar', type: 'text' },
    { field: 'description_fr', type: 'text' },
    { field: 'description_en', type: 'text' },
    { field: 'website', type: 'string' },
    { field: 'logo', type: 'json' },
    { field: 'contact_email', type: 'string' },
    { field: 'contact_phone', type: 'string' },
    { field: 'contact_address', type: 'string' },
    { field: 'is_verified', type: 'boolean' },
    { field: 'status', type: 'string' },
    { field: 'date_created', type: 'timestamp' },
    { field: 'date_updated', type: 'timestamp' },
  ],
  documents: [
    { field: 'id', type: 'string' },
    { field: 'title', type: 'string' },
    { field: 'author', type: 'string' },
    { field: 'organization', type: 'string' },
    { field: 'date_published', type: 'date' },
    { field: 'abstract_original', type: 'text' },
    { field: 'abstract_translations', type: 'json' },
    { field: 'language', type: 'string' },
    { field: 'themes', type: 'json' },
    { field: 'document_type', type: 'string' },
    { field: 'governorates', type: 'json' },
    { field: 'keywords', type: 'json' },
    { field: 'supersedes', type: 'json' },
    { field: 'superseded_by', type: 'json' },
    { field: 'files', type: 'json' },
    { field: 'file_hash', type: 'text' },
    { field: 'content_fingerprint', type: 'text' },
    { field: 'status', type: 'string' },
    { field: 'date_uploaded', type: 'timestamp' },
    { field: 'date_created', type: 'timestamp' },
    { field: 'date_updated', type: 'timestamp' },
  ],
  document_themes: [
    { field: 'id', type: 'integer' },
    { field: 'document', type: 'string' },
    { field: 'theme', type: 'string' },
  ],
  document_governorates: [
    { field: 'id', type: 'integer' },
    { field: 'document', type: 'string' },
    { field: 'governorate', type: 'string' },
  ],
  partners: [
    { field: 'id', type: 'string' },
    { field: 'name', type: 'string' },
    { field: 'logo', type: 'json' },
    { field: 'website', type: 'string' },
    { field: 'tier', type: 'string' },
    { field: 'sort_order', type: 'integer' },
    { field: 'is_active', type: 'boolean' },
    { field: 'display_on_homepage', type: 'boolean' },
  ],
  donation_tiers: [
    { field: 'id', type: 'string' },
    { field: 'amount_tnd', type: 'integer' },
    { field: 'amount_usd', type: 'integer' },
    { field: 'amount_eur', type: 'integer' },
    { field: 'label_ar', type: 'string' },
    { field: 'label_fr', type: 'string' },
    { field: 'label_en', type: 'string' },
    { field: 'impact_ar', type: 'text' },
    { field: 'impact_fr', type: 'text' },
    { field: 'impact_en', type: 'text' },
    { field: 'sort_order', type: 'integer' },
    { field: 'is_active', type: 'boolean' },
  ],
  donations: [
    { field: 'id', type: 'string' },
    { field: 'tier', type: 'string' },
    { field: 'amount', type: 'integer' },
    { field: 'currency', type: 'string' },
    { field: 'frequency', type: 'string' },
    { field: 'donor_name', type: 'string' },
    { field: 'donor_email', type: 'string' },
    { field: 'message', type: 'text' },
    { field: 'is_anonymous', type: 'boolean' },
    { field: 'display_on_homepage', type: 'boolean' },
    { field: 'public_display_name', type: 'string' },
    { field: 'provider', type: 'string' },
    { field: 'provider_reference', type: 'string' },
    { field: 'status', type: 'string' },
    { field: 'date_created', type: 'timestamp' },
  ],
  donation_leads: [
    { field: 'id', type: 'string' },
    { field: 'name', type: 'string' },
    { field: 'email', type: 'string' },
    { field: 'intended_amount', type: 'integer' },
    { field: 'currency', type: 'string' },
    { field: 'frequency', type: 'string' },
    { field: 'message', type: 'text' },
    { field: 'is_anonymous_intent', type: 'boolean' },
    { field: 'display_on_homepage_intent', type: 'boolean' },
    { field: 'public_display_name_intent', type: 'string' },
    { field: 'status', type: 'string' },
    { field: 'date_created', type: 'timestamp' },
  ],
  team_members: [
    { field: 'id', type: 'string' },
    { field: 'name', type: 'string' },
    { field: 'role_ar', type: 'string' },
    { field: 'role_fr', type: 'string' },
    { field: 'role_en', type: 'string' },
    { field: 'bio_ar', type: 'text' },
    { field: 'bio_fr', type: 'text' },
    { field: 'bio_en', type: 'text' },
    { field: 'photo', type: 'json' },
    { field: 'linkedin_url', type: 'string' },
    { field: 'organization', type: 'string' },
    { field: 'sort_order', type: 'integer' },
    { field: 'is_active', type: 'boolean' },
  ],
  pages: [
    { field: 'id', type: 'integer' },
    { field: 'mission_ar', type: 'text' },
    { field: 'mission_fr', type: 'text' },
    { field: 'mission_en', type: 'text' },
    { field: 'about_body_ar', type: 'text' },
    { field: 'about_body_fr', type: 'text' },
    { field: 'about_body_en', type: 'text' },
    { field: 'impact_callouts_ar', type: 'json' },
    { field: 'impact_callouts_fr', type: 'json' },
    { field: 'impact_callouts_en', type: 'json' },
    { field: 'transparency_note_ar', type: 'text' },
    { field: 'transparency_note_fr', type: 'text' },
    { field: 'transparency_note_en', type: 'text' },
    { field: 'social_twitter', type: 'string' },
    { field: 'social_linkedin', type: 'string' },
    { field: 'social_facebook', type: 'string' },
    { field: 'social_youtube', type: 'string' },
  ],
  contact_messages: [
    { field: 'id', type: 'string' },
    { field: 'name', type: 'string' },
    { field: 'email', type: 'string' },
    { field: 'subject', type: 'string' },
    { field: 'message', type: 'text' },
    { field: 'status', type: 'string' },
    { field: 'date_created', type: 'timestamp' },
  ],
  suggestions: [
    { field: 'id', type: 'string' },
    { field: 'target_type', type: 'string' },
    { field: 'document_id', type: 'string' },
    { field: 'organization_id', type: 'string' },
    { field: 'suggested_by_email', type: 'string' },
    { field: 'field_name', type: 'string' },
    { field: 'field_label', type: 'string' },
    { field: 'current_value', type: 'text' },
    { field: 'suggested_value', type: 'text' },
    { field: 'note', type: 'text' },
    { field: 'status', type: 'string' },
    { field: 'admin_note', type: 'text' },
    { field: 'date_submitted', type: 'timestamp' },
    { field: 'date_reviewed', type: 'timestamp' },
  ],
  translation_suggestions: [
    { field: 'id', type: 'string' },
    { field: 'document', type: 'string' },
    { field: 'language', type: 'string' },
    { field: 'pdf_file', type: 'string' },
    { field: 'file_hash', type: 'text' },
    { field: 'content_fingerprint', type: 'text' },
    { field: 'suggested_by_email', type: 'string' },
    { field: 'note', type: 'text' },
    { field: 'status', type: 'string' },
    { field: 'admin_note', type: 'text' },
    { field: 'date_submitted', type: 'timestamp' },
    { field: 'date_reviewed', type: 'timestamp' },
  ],
  submissions: [
    { field: 'id', type: 'string' },
    { field: 'title', type: 'string' },
    { field: 'author', type: 'string' },
    { field: 'organization', type: 'string' },
    { field: 'date_published', type: 'date' },
    { field: 'abstract_original', type: 'text' },
    { field: 'abstract_translations', type: 'json' },
    { field: 'language', type: 'string' },
    { field: 'themes', type: 'json' },
    { field: 'document_type', type: 'string' },
    { field: 'governorates', type: 'json' },
    { field: 'keywords', type: 'json' },
    { field: 'file_hash', type: 'text' },
    { field: 'content_fingerprint', type: 'text' },
    { field: 'file_url', type: 'string' },
    { field: 'submitted_by_name', type: 'string' },
    { field: 'submitted_by_email', type: 'string' },
    { field: 'submitted_by_org', type: 'string' },
    { field: 'batch_id', type: 'string' },
    { field: 'status', type: 'string' },
    { field: 'admin_note', type: 'text' },
    { field: 'date_submitted', type: 'timestamp' },
  ],
  ops_settings: [
    { field: 'id', type: 'integer' },
    { field: 'notifications_enabled', type: 'boolean' },
    { field: 'notify_contact_enabled', type: 'boolean' },
    { field: 'notify_suggestions_enabled', type: 'boolean' },
    { field: 'notify_submissions_enabled', type: 'boolean' },
    { field: 'notify_to_emails', type: 'json' },
    { field: 'backup_enabled', type: 'boolean' },
    { field: 'backup_interval_hours', type: 'integer' },
    { field: 'backup_retention_days_local', type: 'integer' },
    { field: 'backup_s3_enabled', type: 'boolean' },
    { field: 'backup_s3_prefix', type: 'string' },
    { field: 'backup_pause_until', type: 'timestamp' },
    { field: 'date_updated', type: 'timestamp' },
  ],
  backup_jobs: [
    { field: 'id', type: 'integer' },
    { field: 'started_at', type: 'timestamp' },
    { field: 'finished_at', type: 'timestamp' },
    { field: 'status', type: 'string' },
    { field: 'error', type: 'text' },
    { field: 'db_backup_path', type: 'string' },
    { field: 'uploads_backup_path', type: 'string' },
    { field: 'storage_targets', type: 'json' },
    { field: 'triggered_by', type: 'string' },
  ],
  backup_requests: [
    { field: 'id', type: 'integer' },
    { field: 'requested_at', type: 'timestamp' },
    { field: 'requested_by', type: 'string' },
    { field: 'status', type: 'string' },
    { field: 'note', type: 'text' },
  ],
};

function basicTaxonomyFields(): Array<{ field: string; type: string }> {
  return [
    { field: 'id', type: 'string' },
    { field: 'slug', type: 'string' },
    { field: 'name_ar', type: 'string' },
    { field: 'name_fr', type: 'string' },
    { field: 'name_en', type: 'string' },
    { field: 'sort_order', type: 'integer' },
  ];
}

/** UI meta for Directus fields (matches ensureField). */
function directusFieldMeta(field: { field: string; type: string }) {
  return {
    interface:
      field.type === 'text'
        ? 'input-multiline'
        : field.type === 'json'
          ? 'input-code'
          : 'input',
    width: 'full' as const,
  };
}

/**
 * Fields embedded in POST /collections so the physical PK matches mock data.
 * Without this, Directus creates a numeric auto-increment `id`, and POST /items with
 * string ids returns 403 ("You don't have permission") instead of a clear type error.
 */
function buildEmbeddedCollectionFields(collectionName: string): Array<Record<string, unknown>> {
  const defs = FIELD_DEFS[collectionName] ?? [];
  return defs.map((field) => {
    const meta = directusFieldMeta(field);
    if (field.field === 'id') {
      if (field.type === 'string') {
        return {
          field: field.field,
          type: 'string',
          schema: { is_primary_key: true, is_nullable: false, max_length: 255 },
          meta: { ...meta, hidden: true, readonly: true, interface: 'input' },
        };
      }
      if (field.type === 'integer') {
        return {
          field: field.field,
          type: 'integer',
          schema: { is_primary_key: true, has_auto_increment: true, is_nullable: false },
          meta: { ...meta, hidden: true, readonly: true, interface: 'input' },
        };
      }
    }
    return {
      field: field.field,
      type: field.type,
      schema: {},
      meta,
    };
  });
}

async function directusRequest<T>(
  path: string,
  method: string,
  token?: string,
  body?: unknown,
  accept404 = false,
): Promise<T | null> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (accept404 && res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`[${method} ${path}] ${res.status} ${await res.text()}`);
  }
  if (res.status === 204) return null;
  return (await res.json()) as T;
}

async function loginAsAdmin(): Promise<string> {
  const login = await directusRequest<{ data: { access_token: string } }>(
    '/auth/login',
    'POST',
    undefined,
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  );
  if (!login?.data?.access_token) {
    throw new Error('Failed to obtain Directus admin token.');
  }
  return login.data.access_token;
}

async function ensureCollection(token: string, collection: { name: string; icon?: string; singleton?: boolean }) {
  // Directus 11 often returns 403 (not 404) on GET /collections/:name when the collection
  // does not exist yet — so we create with POST + `schema: {}` per system API requirements.
  const embeddedFields = buildEmbeddedCollectionFields(collection.name);
  const res = await fetch(`${DIRECTUS_URL}/collections`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      collection: collection.name,
      schema: {},
      meta: {
        icon: collection.icon ?? 'table_chart',
        hidden: false,
        singleton: Boolean(collection.singleton),
        note: 'Seeded by scripts/seed.ts',
      },
      ...(embeddedFields.length ? { fields: embeddedFields } : {}),
    }),
  });
  if (res.ok) {
    console.log(`+ collection ${collection.name}`);
    return;
  }
  const text = await res.text();
  if (res.status === 409 || /exists|duplicate|already/i.test(text)) return;
  if (res.status === 403 && /exists|duplicate|already/i.test(text)) return;
  if (res.status === 400 && /exists|duplicate|already/i.test(text)) return;
  throw new Error(`[POST /collections ${collection.name}] ${res.status} ${text}`);
}

async function ensureField(token: string, collection: string, field: { field: string; type: string }) {
  const res = await fetch(`${DIRECTUS_URL}/fields/${collection}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      field: field.field,
      type: field.type,
      meta: {
        interface: field.type === 'text' ? 'input-multiline' : field.type === 'json' ? 'input-code' : 'input',
        width: 'full',
      },
    }),
  });
  if (res.ok) {
    console.log(`  + field ${collection}.${field.field}`);
    return;
  }
  const text = await res.text();
  if (res.status === 409 || /exists|duplicate|already/i.test(text)) return;
  if (res.status === 400 && /exists|duplicate|already/i.test(text)) return;
  throw new Error(`[POST /fields/${collection}/${field.field}] ${res.status} ${text}`);
}

async function ensureSchema(token: string) {
  for (const collection of COLLECTIONS) {
    await ensureCollection(token, collection);
    for (const field of FIELD_DEFS[collection.name] ?? []) {
      await ensureField(token, collection.name, field);
    }
  }
}

async function ensureRole(token: string, name: string): Promise<string> {
  const roles = await directusRequest<{ data: Array<{ id: string; name: string }> }>(
    `/roles?filter[name][_eq]=${encodeURIComponent(name)}`,
    'GET',
    token,
  );
  if (roles?.data?.[0]) return roles.data[0].id;
  const created = await directusRequest<{ data: { id: string } }>('/roles', 'POST', token, { name });
  if (!created?.data?.id) throw new Error(`Failed to create role ${name}`);
  return created.data.id;
}

async function ensurePermission(token: string, role: string, collection: string, action: string) {
  const existing = await directusRequest<{ data: Array<{ id: string }> }>(
    `/permissions?filter[role][_eq]=${role}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}`,
    'GET',
    token,
  );
  if (existing?.data?.length) return;
  await directusRequest('/permissions', 'POST', token, {
    role,
    collection,
    action,
    permissions: {},
    validation: {},
    presets: {},
    fields: ['*'],
  });
}

async function ensurePreset(
  token: string,
  role: string,
  collection: string,
  title: string,
  filter: Record<string, unknown>,
) {
  const existing = await directusRequest<{ data: Array<{ id: number }> }>(
    `/presets?filter[role][_eq]=${role}&filter[collection][_eq]=${collection}&filter[bookmark][_eq]=${encodeURIComponent(title)}`,
    'GET',
    token,
  );
  if (existing?.data?.length) return;
  await directusRequest('/presets', 'POST', token, {
    role,
    bookmark: title,
    collection,
    filter,
    layout: 'tabular',
  });
}

async function ensureDashboard(token: string, name: string, note: string): Promise<string> {
  const existing = await directusRequest<{ data: Array<{ id: string }> }>(
    `/dashboards?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`,
    'GET',
    token,
  );
  if (existing?.data?.[0]?.id) return existing.data[0].id;
  const created = await directusRequest<{ data: { id: string } }>('/dashboards', 'POST', token, {
    name,
    note,
    icon: 'dashboard',
  });
  if (!created?.data?.id) throw new Error(`Failed to create dashboard: ${name}`);
  return created.data.id;
}

async function ensurePanel(
  token: string,
  dashboardId: string,
  name: string,
  position: { x: number; y: number; w: number; h: number },
  options: Record<string, unknown>,
) {
  const existing = await directusRequest<{ data: Array<{ id: string }> }>(
    `/panels?filter[dashboard][_eq]=${dashboardId}&filter[name][_eq]=${encodeURIComponent(name)}&limit=1`,
    'GET',
    token,
  );
  if (existing?.data?.length) return;
  await directusRequest('/panels', 'POST', token, {
    dashboard: dashboardId,
    name,
    type: 'metric',
    show_header: true,
    position_x: position.x,
    position_y: position.y,
    width: position.w,
    height: position.h,
    options,
  });
}

async function ensurePublicPermissions(token: string): Promise<string> {
  const publicRole = await ensureRole(token, 'Public');
  const editorRole = await ensureRole(token, 'Editor');
  void editorRole;

  for (const collection of [
    'documents',
    'organizations',
    'themes',
    'document_types',
    'languages',
    'governorates',
    'partners',
    'donation_tiers',
    'pages',
    'team_members',
    'search_facets',
  ]) {
    await ensurePermission(token, publicRole, collection, 'read');
  }
  await ensurePermission(token, publicRole, 'donations', 'read');
  for (const writable of ['suggestions', 'submissions', 'contact_messages', 'donation_leads']) {
    await ensurePermission(token, publicRole, writable, 'create');
  }
  return publicRole;
}

async function ensureStaffPermissions(token: string) {
  const editorRole = await ensureRole(token, 'Editor');
  const moderatorRole = await ensureRole(token, 'Moderator');

  const editorWritable = [
    'documents',
    'organizations',
    'themes',
    'document_types',
    'languages',
    'governorates',
    'partners',
    'donation_tiers',
    'team_members',
    'pages',
    'search_facets',
    'suggestions',
    'translation_suggestions',
    'submissions',
    'contact_messages',
    'donation_leads',
  ];
  for (const collection of editorWritable) {
    await ensurePermission(token, editorRole, collection, 'read');
    await ensurePermission(token, editorRole, collection, 'create');
    await ensurePermission(token, editorRole, collection, 'update');
  }

  const moderatorWritable = [...editorWritable, 'donations'];
  for (const collection of moderatorWritable) {
    await ensurePermission(token, moderatorRole, collection, 'read');
    await ensurePermission(token, moderatorRole, collection, 'create');
    await ensurePermission(token, moderatorRole, collection, 'update');
  }
  // Strict ops boundary: staff can inspect backup history but cannot change ops controls.
  await ensurePermission(token, moderatorRole, 'backup_jobs', 'read');
}

async function ensureOpsPresets(token: string) {
  const adminRole = await ensureRole(token, 'Administrator');
  await ensurePreset(token, adminRole, 'backup_requests', 'Pending backup requests', {
    status: { _eq: 'pending' },
  });
  await ensurePreset(token, adminRole, 'backup_requests', 'Failed backup requests', {
    status: { _eq: 'failed' },
  });
  await ensurePreset(token, adminRole, 'backup_jobs', 'Recent backup failures', {
    status: { _eq: 'failed' },
  });
  await ensurePreset(token, adminRole, 'backup_jobs', 'Recent successful backups', {
    status: { _eq: 'success' },
  });
}

async function ensureOpsDashboard(token: string) {
  const dashboardId = await ensureDashboard(
    token,
    'Operations & Moderation',
    'First-line operational view for moderation queues and backup health.',
  );
  await ensurePanel(token, dashboardId, 'Pending suggestions', { x: 1, y: 1, w: 6, h: 6 }, {
    collection: 'suggestions',
    function: 'count',
    filter: { status: { _eq: 'pending' } },
    layout: 'vertical',
  });
  await ensurePanel(token, dashboardId, 'Pending submissions', { x: 7, y: 1, w: 6, h: 6 }, {
    collection: 'submissions',
    function: 'count',
    filter: { status: { _eq: 'pending' } },
    layout: 'vertical',
  });
  await ensurePanel(token, dashboardId, 'New contact messages', { x: 13, y: 1, w: 6, h: 6 }, {
    collection: 'contact_messages',
    function: 'count',
    filter: { status: { _eq: 'new' } },
    layout: 'vertical',
  });
  await ensurePanel(token, dashboardId, 'Failed backup jobs', { x: 1, y: 7, w: 6, h: 6 }, {
    collection: 'backup_jobs',
    function: 'count',
    filter: { status: { _eq: 'failed' } },
    layout: 'vertical',
  });
  await ensurePanel(token, dashboardId, 'Successful backups', { x: 7, y: 7, w: 6, h: 6 }, {
    collection: 'backup_jobs',
    function: 'count',
    filter: { status: { _eq: 'success' } },
    layout: 'vertical',
  });
  await ensurePanel(token, dashboardId, 'Pending backup requests', { x: 13, y: 7, w: 6, h: 6 }, {
    collection: 'backup_requests',
    function: 'count',
    filter: { status: { _eq: 'pending' } },
    layout: 'vertical',
  });
  await ensurePanel(token, dashboardId, 'Pending translation PDFs', { x: 1, y: 13, w: 6, h: 6 }, {
    collection: 'translation_suggestions',
    function: 'count',
    filter: { status: { _eq: 'pending' } },
    layout: 'vertical',
  });
}

function isSingletonCollection(name: string): boolean {
  return Boolean(COLLECTIONS.find((c) => c.name === name)?.singleton);
}

async function upsertItem(token: string, collection: string, item: DirectusItem, idField = 'id') {
  if (isSingletonCollection(collection)) {
    await directusRequest(`/items/${collection}`, 'PATCH', token, item);
    return;
  }
  const id = item[idField] as string | number | undefined;
  if (id === undefined || id === null) {
    await directusRequest(`/items/${collection}`, 'POST', token, item);
    return;
  }
  const postRes = await fetch(`${DIRECTUS_URL}/items/${collection}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });
  if (postRes.ok) return;
  const postText = await postRes.text();
  if (postRes.status === 400 || postRes.status === 409 || /unique|duplicate|already exists/i.test(postText)) {
    const path = `/items/${collection}/${encodeURIComponent(String(id))}`;
    await directusRequest(path, 'PATCH', token, item);
    return;
  }
  throw new Error(`[POST /items/${collection}] ${postRes.status} ${postText}`);
}

function normalizeDocument(doc: (typeof mockDocuments)[number]): DirectusItem {
  return {
    ...doc,
    organization: doc.organization?.id ?? null,
    language: doc.language?.id ?? null,
    document_type: doc.document_type?.id ?? null,
    themes: doc.themes.map((x) => x.id),
    governorates: doc.governorates.map((x) => x.id),
  };
}

async function seedData(token: string) {
  for (const t of mockThemes) await upsertItem(token, 'themes', t as unknown as DirectusItem);
  for (const t of mockDocumentTypes) await upsertItem(token, 'document_types', t as unknown as DirectusItem);
  for (const t of mockLanguages) await upsertItem(token, 'languages', t as unknown as DirectusItem);
  for (const facet of [
    {
      id: 'facet-themes',
      key: 'themes',
      query_param: 'themes',
      source_field: 'themes',
      label_ar: 'المواضيع',
      label_fr: 'Thèmes',
      label_en: 'Themes',
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'facet-types',
      key: 'types',
      query_param: 'types',
      source_field: 'document_type',
      label_ar: 'أنواع الوثائق',
      label_fr: 'Types de document',
      label_en: 'Document types',
      is_active: true,
      sort_order: 2,
    },
    {
      id: 'facet-orgs',
      key: 'organizations',
      query_param: 'orgs',
      source_field: 'organization',
      label_ar: 'المنظمات',
      label_fr: 'Organisations',
      label_en: 'Organizations',
      is_active: true,
      sort_order: 3,
    },
    {
      id: 'facet-governorates',
      key: 'governorates',
      query_param: 'governorates',
      source_field: 'governorates',
      label_ar: 'الولايات',
      label_fr: 'Gouvernorats',
      label_en: 'Governorates',
      is_active: true,
      sort_order: 4,
    },
    {
      id: 'facet-languages',
      key: 'languages',
      query_param: 'languages',
      source_field: 'language',
      label_ar: 'اللغات',
      label_fr: 'Langues',
      label_en: 'Languages',
      is_active: true,
      sort_order: 5,
    },
  ]) {
    await upsertItem(token, 'search_facets', facet);
  }
  for (const t of mockGovernorates) await upsertItem(token, 'governorates', t as unknown as DirectusItem);
  for (const org of mockOrganizations) await upsertItem(token, 'organizations', org as unknown as DirectusItem);
  for (const doc of mockDocuments) await upsertItem(token, 'documents', normalizeDocument(doc));
  for (const partner of mockPartners) await upsertItem(token, 'partners', partner as unknown as DirectusItem);
  for (const tier of mockDonationTiers) await upsertItem(token, 'donation_tiers', tier as unknown as DirectusItem);
  for (const member of mockTeamMembers) {
    await upsertItem(token, 'team_members', {
      ...member,
      organization: member.organization?.id ?? null,
    });
  }
  await upsertItem(token, 'pages', { id: 1, ...mockPages });
  await upsertItem(token, 'ops_settings', {
    id: 1,
    notifications_enabled: false,
    notify_contact_enabled: true,
    notify_suggestions_enabled: true,
    notify_submissions_enabled: true,
    notify_to_emails: [],
    backup_enabled: false,
    backup_interval_hours: 24,
    backup_retention_days_local: 30,
    backup_s3_enabled: false,
    backup_s3_prefix: 'roufouf',
    backup_pause_until: null,
    date_updated: new Date().toISOString(),
  });
}

async function ensurePublicToken(token: string, publicRole: string): Promise<string> {
  const email = 'public-api@example.com';
  const staticToken = randomUUID().replace(/-/g, '');
  const users = await directusRequest<{ data: Array<{ id: string; token?: string }> }>(
    `/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id,token`,
    'GET',
    token,
  );
  if (users?.data?.[0]?.id) {
    await directusRequest(`/users/${users.data[0].id}`, 'PATCH', token, { role: publicRole, token: staticToken });
    return staticToken;
  }

  await directusRequest('/users', 'POST', token, {
    first_name: 'Public',
    last_name: 'API',
    email,
    password: 'roufouf-public-dev',
    status: 'active',
    role: publicRole,
    token: staticToken,
  });
  return staticToken;
}

async function configureMeili() {
  const index = 'documents';
  const headers = {
    'content-type': 'application/json',
    Authorization: `Bearer ${MEILI_KEY}`,
  };

  await fetch(`${MEILI_URL}/indexes/${index}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ uid: index, primaryKey: 'id' }),
  }).catch(() => undefined);

  await fetch(`${MEILI_URL}/indexes/${index}/settings`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(meilisearchIndexSettings),
  });

  const docs = mockDocuments.map((doc) => ({
    id: doc.id,
    title: doc.title,
    abstract_original: doc.abstract_original ?? '',
    abstract_translations: doc.abstract_translations ?? {},
    keywords: doc.keywords ?? [],
    author: doc.author ?? '',
    organization: doc.organization ? { id: doc.organization.id, slug: doc.organization.slug, name: doc.organization.name } : null,
    themes: doc.themes.map((t) => ({ id: t.id, slug: t.slug })),
    governorates: doc.governorates.map((g) => ({ id: g.id, slug: g.slug })),
    document_type: doc.document_type ? { id: doc.document_type.id, slug: doc.document_type.slug } : null,
    language: doc.language ? { id: doc.language.id, slug: doc.language.slug } : null,
    date_published: doc.date_published ?? null,
    date_uploaded: doc.date_uploaded,
    status: doc.status,
  }));

  await fetch(`${MEILI_URL}/indexes/${index}/documents`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(docs),
  });
}

async function attachFixtureSamplePdf(token: string) {
  const filePath = resolve(process.cwd(), 'fixtures/sample.pdf');
  if (!existsSync(filePath)) {
    console.log('(skip) fixtures/sample.pdf not found');
    return;
  }
  const buffer = readFileSync(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'application/pdf' }), 'sample.pdf');
  const res = await fetch(`${DIRECTUS_URL}/files`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    console.warn('Fixture PDF upload skipped:', res.status, await res.text());
    return;
  }
  const uploaded = (await res.json()) as { data?: { id: string; filename_download?: string } };
  const fid = uploaded.data?.id;
  if (!fid) return;
  const base = DIRECTUS_URL.replace(/\/$/, '');
  const fileBlock = {
    id: 'docfile-sample',
    document: 'doc-001',
    file: {
      id: fid,
      url: `${base}/assets/${fid}`,
      filename: uploaded.data?.filename_download ?? 'sample.pdf',
      mime_type: 'application/pdf',
    },
    kind: 'main',
  };
  await directusRequest('/items/documents/doc-001', 'PATCH', token, { files: [fileBlock] });
  console.log('+ attached fixtures/sample.pdf to doc-001');
}

async function waitForDirectus() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`${DIRECTUS_URL}/server/health`);
      if (res.ok) return;
    } catch {
      // keep retrying until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Directus did not become healthy in time.');
}

async function main() {
  console.log(`Seeding Directus at ${DIRECTUS_URL}`);
  await waitForDirectus();
  const adminToken = await loginAsAdmin();
  await ensureSchema(adminToken);
  const publicRole = await ensurePublicPermissions(adminToken);
  await ensureStaffPermissions(adminToken);
  await ensureOpsPresets(adminToken);
  await ensureOpsDashboard(adminToken);
  const publicToken = await ensurePublicToken(adminToken, publicRole);
  await seedData(adminToken);
  await attachFixtureSamplePdf(adminToken);
  await configureMeili();

  console.log('\nSeed complete.');
  console.log('Use these values in .env.local:');
  console.log(`DIRECTUS_URL=${DIRECTUS_URL}`);
  console.log(`DIRECTUS_TOKEN=${publicToken}`);
  console.log(`MEILISEARCH_HOST=${MEILI_URL}`);
  console.log(`MEILISEARCH_KEY=${MEILI_KEY}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
