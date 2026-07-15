/**
 * Mirrors PERMISSIONS in the backend's src/modules/rbac/permissions.ts. The API
 * rejects anything outside that list (`@IsIn(PERMISSIONS)`), so if the two ever
 * drift, role saving fails loudly rather than granting something unintended.
 */
export const PERMISSIONS = [
  "websites.read",
  "websites.update",
  "members.read",
  "members.manage",
  "roles.read",
  "roles.manage",
  "collections.read",
  "collections.manage",
  "entries.read",
  "entries.create",
  "entries.update",
  "entries.delete",
  "entries.publish",
  "media.read",
  "media.upload",
  "media.delete",
  "pages.read",
  "pages.create",
  "pages.update",
  "pages.delete",
  "pages.publish",
  "menus.read",
  "menus.manage",
  "seo.read",
  "seo.manage",
  "settings.read",
  "settings.manage",
  "apikeys.read",
  "apikeys.manage",
  "webhooks.read",
  "webhooks.manage",
  "audit.read",
  "forms.read",
  "forms.manage",
  "submissions.read",
  "submissions.delete",
  "analytics.read",
  "preview.create",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** Handing these out mints credentials, so the backend keeps them Owner-only. */
export const OWNER_ONLY: Permission[] = [
  "roles.manage",
  "apikeys.manage",
  "webhooks.manage",
];

const GROUP_LABELS: Record<string, string> = {
  websites: "Website",
  members: "Anggota",
  roles: "Role",
  collections: "Collections",
  entries: "Entries",
  media: "Media",
  pages: "Pages",
  menus: "Menus",
  seo: "SEO",
  settings: "Settings",
  apikeys: "API Keys",
  webhooks: "Webhooks",
  audit: "Audit log",
  forms: "Forms",
  submissions: "Submissions",
  analytics: "Analytics",
  preview: "Preview",
};

export function groupedPermissions() {
  const groups = new Map<string, Permission[]>();
  for (const permission of PERMISSIONS) {
    const resource = permission.split(".")[0];
    const list = groups.get(resource) ?? [];
    list.push(permission);
    groups.set(resource, list);
  }
  return [...groups.entries()].map(([resource, permissions]) => ({
    resource,
    label: GROUP_LABELS[resource] ?? resource,
    permissions,
  }));
}
