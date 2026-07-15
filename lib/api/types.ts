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

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
