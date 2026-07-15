/** Mirrors the backend enums in prisma/schema.prisma. */
export type PlatformRole = "NONE" | "SUPPORT" | "PLATFORM_ADMIN" | "SUPER_ADMIN";

export type FieldType =
  | "TEXT"
  | "TEXTAREA"
  | "RICHTEXT"
  | "NUMBER"
  | "BOOLEAN"
  | "DATE"
  | "SELECT"
  | "MEDIA"
  | "RELATION"
  | "JSON";

export type EntryStatus = "DRAFT" | "PUBLISHED";

export type WebsiteStatus = "ACTIVE" | "INACTIVE";

export type PageStatus = "DRAFT" | "PUBLISHED";

export type SeoTarget = "PAGE" | "ENTRY";

export type WebhookDeliveryStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface User {
  id: string;
  email: string;
  name: string;
  platformRole: PlatformRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Website {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  status: WebsiteStatus;
  requireApiKey: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteDetail extends Website {
  collections: Pick<Collection, "id" | "name" | "slug">[];
  _count: { members: number; entries: number; media: number };
}

export interface Collection {
  id: string;
  websiteId: string;
  name: string;
  slug: string;
  description?: string | null;
  fields?: Field[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Only the keys the backend's field-type strategies actually read. See
 * src/modules/entries/domain/field-types/ — anything else would sit unused in
 * the JSON column.
 */
export interface FieldOptions {
  maxLength?: number;
  min?: number;
  max?: number;
  choices?: string[];
  multiple?: boolean;
  /**
   * UI-only. RelationStrategy accepts any entry id — it never checks the target
   * collection — so this just tells the editor which collection to offer.
   */
  collectionId?: string;
}

export interface Field {
  id: string;
  collectionId: string;
  name: string;
  key: string;
  type: FieldType;
  required: boolean;
  order: number;
  options?: FieldOptions | null;
}

export interface Entry {
  id: string;
  websiteId: string;
  collectionId: string;
  data: Record<string, unknown>;
  status: EntryStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  websiteId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string | null;
  variants?: Record<string, string> | null;
  createdAt: string;
}

export interface Role {
  id: string;
  websiteId: string;
  name: string;
  permissions: string[];
}

export interface Member {
  id: string;
  userId: string;
  websiteId: string;
  roleId: string;
  user: Pick<User, "id" | "email" | "name">;
  role: Pick<Role, "id" | "name">;
}

/** Members are added by email — the backend resolves the existing user. */
export interface AddMemberInput {
  email: string;
  roleId: string;
}

/** GET /websites/:id/me — what the signed-in user may actually do here. */
export interface WebsitePermissions {
  role: { id: string; name: string } | null;
  permissions: string[];
}

// ------------------------------------------------------------ Fase 2

/**
 * A block is opaque to the CMS: it only guarantees a `type`, and `props` stay
 * free-form so the frontend can add block types without a backend change.
 * That is why the editor here is generic rather than a per-type form.
 */
export interface PageBlock {
  type: string;
  props?: Record<string, unknown>;
}

export interface Page {
  id: string;
  websiteId: string;
  title: string;
  slug: string;
  blocks: PageBlock[];
  status: PageStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Menu {
  id: string;
  websiteId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}

/** Nested shape returned by GET /menus/:id — assembled by the backend. */
export interface MenuItemNode {
  id: string;
  label: string;
  url?: string | null;
  pageId?: string | null;
  entryId?: string | null;
  target?: string | null;
  order: number;
  children: MenuItemNode[];
}

export interface MenuDetail extends Menu {
  items: MenuItemNode[];
}

export interface MenuItemInput {
  label: string;
  url?: string;
  pageId?: string;
  entryId?: string;
  target?: string;
  parentId?: string;
  order?: number;
}

/** Flat payload for PUT /menus/:id/reorder — the whole tree in one call. */
export interface ReorderMenuItem {
  id: string;
  parentId?: string | null;
  order: number;
}

export interface Seo {
  id: string;
  websiteId: string;
  targetType: SeoTarget;
  targetId: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  noIndex: boolean;
  extra?: Record<string, unknown> | null;
}

export interface SeoInput {
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  extra?: Record<string, unknown>;
}

export interface SeoDefaults {
  titleTemplate?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
}

export interface Setting {
  id: string;
  websiteId: string;
  key: string;
  /** Any JSON value: string, number, boolean, object or array. */
  value: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  websiteId: string;
  name: string;
  prefix: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

/** Only ever returned by POST /api-keys — `key` is not recoverable later. */
export interface ApiKeyCreated {
  id: string;
  name: string;
  prefix: string;
  key: string;
  createdAt: string;
}

// ------------------------------------------------------------ Fase 3

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * The secret signs payloads, so the API only ever returns it from create and
 * rotate-secret — never from a list or a read.
 */
export interface WebhookCreated extends Webhook {
  secret: string;
}

export interface WebhookSecret {
  id: string;
  secret: string;
}

export interface WebhookInput {
  name: string;
  url: string;
  events: string[];
  active?: boolean;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  attempts: number;
  responseStatus?: number | null;
  lastError?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

// ------------------------------------------------------------ Fase 4

/**
 * Same shape as a collection Field — the backend deliberately reuses
 * EntryValidator for forms, so a new field type needs one strategy, not two.
 */
export interface FormField {
  key: string;
  name: string;
  type: FieldType;
  required?: boolean;
  options?: FieldOptions;
}

export interface Form {
  id: string;
  websiteId: string;
  name: string;
  slug: string;
  fields: FormField[];
  notifyEmails: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { submissions: number };
}

export interface FormInput {
  name: string;
  slug: string;
  fields: FormField[];
  notifyEmails?: string[];
  active?: boolean;
}

export interface FormSubmission {
  id: string;
  formId: string;
  websiteId: string;
  data: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

/** Daily counters, not per-visit rows — see the Fase 4 decisions in PLAN.md. */
export interface PageViewSummary {
  range: { from: string; to: string };
  total: number;
  topPaths: { path: string; count: number }[];
  daily: { day: string; count: number }[];
}

export interface AuditLog {
  id: string;
  websiteId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  resource: string;
  action: string;
  targetId?: string | null;
  meta?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string;
}

export interface PreviewToken {
  token: string;
  expiresIn: string;
  websiteSlug: string;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
