"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { ApiError, api, apiFetch } from "./client";
import type {
  AddMemberInput,
  ApiKey,
  ApiKeyCreated,
  Collection,
  Entry,
  EntryStatus,
  Field,
  Media,
  Member,
  Menu,
  MenuDetail,
  MenuItemInput,
  Page,
  PageStatus,
  Paginated,
  ReorderMenuItem,
  Role,
  Seo,
  SeoDefaults,
  SeoInput,
  SeoTarget,
  Setting,
  User,
  Website,
  WebsiteDetail,
  WebsitePermissions,
} from "./types";

/**
 * Every key is prefixed by the website it belongs to, so invalidating one
 * website never disturbs another's cache.
 */
export const keys = {
  websites: ["websites"] as const,
  website: (id: string) => ["websites", id] as const,
  permissions: (id: string) => ["websites", id, "me"] as const,
  collections: (id: string) => ["websites", id, "collections"] as const,
  collection: (id: string, cid: string) =>
    ["websites", id, "collections", cid] as const,
  entries: (id: string, cid: string, q?: unknown) =>
    ["websites", id, "collections", cid, "entries", q ?? null] as const,
  entry: (id: string, cid: string, eid: string) =>
    ["websites", id, "collections", cid, "entries", eid] as const,
  media: (id: string, page: number) => ["websites", id, "media", page] as const,
  members: (id: string) => ["websites", id, "members"] as const,
  roles: (id: string) => ["websites", id, "roles"] as const,
  users: (page: number) => ["users", page] as const,

  pages: (id: string, q?: unknown) => ["websites", id, "pages", q ?? null] as const,
  page: (id: string, pid: string) => ["websites", id, "pages", pid] as const,
  menus: (id: string) => ["websites", id, "menus"] as const,
  menu: (id: string, mid: string) => ["websites", id, "menus", mid] as const,
  seoDefaults: (id: string) => ["websites", id, "seo", "defaults"] as const,
  seo: (id: string, type: SeoTarget, targetId: string) =>
    ["websites", id, "seo", type, targetId] as const,
  settings: (id: string) => ["websites", id, "settings"] as const,
  apiKeys: (id: string) => ["websites", id, "api-keys"] as const,
};

// ---------------------------------------------------------------- websites

export function useWebsites(page = 1) {
  return useQuery({
    queryKey: [...keys.websites, page],
    queryFn: () => api.get<Paginated<Website>>("/websites", { page, limit: 50 }),
  });
}

export function useWebsite(websiteId: string) {
  return useQuery({
    queryKey: keys.website(websiteId),
    queryFn: () => api.get<WebsiteDetail>(`/websites/${websiteId}`),
    enabled: !!websiteId,
  });
}

/**
 * Drives which controls the UI renders. Kept fresh forever within a session:
 * a role change mid-session is rare, and the backend is the real gate anyway —
 * a stale menu item costs a 403, not a security hole.
 */
export function useWebsitePermissions(websiteId: string) {
  return useQuery({
    queryKey: keys.permissions(websiteId),
    queryFn: () => api.get<WebsitePermissions>(`/websites/${websiteId}/me`),
    enabled: !!websiteId,
    staleTime: Infinity,
  });
}

export function useCreateWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Website>) => api.post<Website>("/websites", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.websites }),
  });
}

export function useUpdateWebsite(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Website>) =>
      api.patch<Website>(`/websites/${websiteId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.website(websiteId) });
      qc.invalidateQueries({ queryKey: keys.websites });
    },
  });
}

export function useDeleteWebsite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (websiteId: string) => api.delete(`/websites/${websiteId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.websites }),
  });
}

// ------------------------------------------------------------- collections

export function useCollections(websiteId: string) {
  return useQuery({
    queryKey: keys.collections(websiteId),
    queryFn: () =>
      api.get<Collection[]>(`/websites/${websiteId}/collections`),
    enabled: !!websiteId,
  });
}

export function useCollection(websiteId: string, collectionId: string) {
  return useQuery({
    queryKey: keys.collection(websiteId, collectionId),
    queryFn: () =>
      api.get<Collection>(
        `/websites/${websiteId}/collections/${collectionId}`,
      ),
    enabled: !!websiteId && !!collectionId,
  });
}

export function useCreateCollection(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Collection>) =>
      api.post<Collection>(`/websites/${websiteId}/collections`, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.collections(websiteId) }),
  });
}

export function useDeleteCollection(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) =>
      api.delete(`/websites/${websiteId}/collections/${collectionId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.collections(websiteId) }),
  });
}

// ------------------------------------------------------------------ fields

export function useCreateField(websiteId: string, collectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Field>) =>
      api.post<Field>(
        `/websites/${websiteId}/collections/${collectionId}/fields`,
        body,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.collection(websiteId, collectionId) }),
  });
}

export function useUpdateField(websiteId: string, collectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldId, ...body }: Partial<Field> & { fieldId: string }) =>
      api.patch<Field>(
        `/websites/${websiteId}/collections/${collectionId}/fields/${fieldId}`,
        body,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.collection(websiteId, collectionId) }),
  });
}

export function useDeleteField(websiteId: string, collectionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: string) =>
      api.delete(
        `/websites/${websiteId}/collections/${collectionId}/fields/${fieldId}`,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.collection(websiteId, collectionId) }),
  });
}

// ----------------------------------------------------------------- entries

export interface EntryQuery {
  page?: number;
  limit?: number;
  status?: EntryStatus | "";
  sort?: string;
}

export function useEntries(
  websiteId: string,
  collectionId: string,
  query: EntryQuery,
) {
  return useQuery({
    queryKey: keys.entries(websiteId, collectionId, query),
    queryFn: () =>
      api.get<Paginated<Entry>>(
        `/websites/${websiteId}/collections/${collectionId}/entries`,
        { ...query },
      ),
    enabled: !!websiteId && !!collectionId,
  });
}

export function useEntry(
  websiteId: string,
  collectionId: string,
  entryId: string,
  options?: Partial<UseQueryOptions<Entry>>,
) {
  return useQuery({
    queryKey: keys.entry(websiteId, collectionId, entryId),
    queryFn: () =>
      api.get<Entry>(
        `/websites/${websiteId}/collections/${collectionId}/entries/${entryId}`,
      ),
    enabled: !!entryId,
    ...options,
  });
}

/**
 * Invalidates the whole collection subtree — list, detail and counts.
 * Generic over the result too, so callers keep the Entry the API returned
 * (useCreateEntry needs its id to redirect).
 */
function useEntryMutation<TArgs, TResult>(
  websiteId: string,
  collectionId: string,
  fn: (args: TArgs) => Promise<TResult>,
) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TArgs>({
    mutationFn: fn,
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["websites", websiteId, "collections", collectionId],
      }),
  });
}

export function useCreateEntry(websiteId: string, collectionId: string) {
  return useEntryMutation(
    websiteId,
    collectionId,
    (body: { data: Record<string, unknown>; status?: EntryStatus }) =>
      api.post<Entry>(
        `/websites/${websiteId}/collections/${collectionId}/entries`,
        body,
      ),
  );
}

export function useUpdateEntry(websiteId: string, collectionId: string) {
  return useEntryMutation(
    websiteId,
    collectionId,
    ({ entryId, data }: { entryId: string; data: Record<string, unknown> }) =>
      api.patch<Entry>(
        `/websites/${websiteId}/collections/${collectionId}/entries/${entryId}`,
        { data },
      ),
  );
}

export function useEntryPublish(websiteId: string, collectionId: string) {
  return useEntryMutation(
    websiteId,
    collectionId,
    ({ entryId, publish }: { entryId: string; publish: boolean }) =>
      api.post<Entry>(
        `/websites/${websiteId}/collections/${collectionId}/entries/${entryId}/${
          publish ? "publish" : "unpublish"
        }`,
      ),
  );
}

export function useDeleteEntry(websiteId: string, collectionId: string) {
  return useEntryMutation(websiteId, collectionId, (entryId: string) =>
    api.delete(
      `/websites/${websiteId}/collections/${collectionId}/entries/${entryId}`,
    ),
  );
}

// ------------------------------------------------------------------- media

export function useMedia(websiteId: string, page = 1) {
  return useQuery({
    queryKey: keys.media(websiteId, page),
    queryFn: () =>
      api.get<Paginated<Media>>(`/websites/${websiteId}/media`, {
        page,
        limit: 40,
      }),
    enabled: !!websiteId,
  });
}

export function useUploadMedia(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, alt }: { file: File; alt?: string }) => {
      const form = new FormData();
      form.append("file", file);
      if (alt) form.append("alt", alt);
      // Passed as FormData so the client leaves Content-Type to the browser.
      return apiFetch<Media>(`/websites/${websiteId}/media`, {
        method: "POST",
        body: form,
      });
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["websites", websiteId, "media"] }),
  });
}

export function useDeleteMedia(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) =>
      api.delete(`/websites/${websiteId}/media/${mediaId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["websites", websiteId, "media"] }),
  });
}

// --------------------------------------------------------- members & roles

export function useMembers(websiteId: string) {
  return useQuery({
    queryKey: keys.members(websiteId),
    queryFn: () => api.get<Member[]>(`/websites/${websiteId}/members`),
    enabled: !!websiteId,
  });
}

export function useAddMember(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddMemberInput) =>
      api.post<Member>(`/websites/${websiteId}/members`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members(websiteId) }),
  });
}

export function useUpdateMemberRole(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      api.patch<Member>(`/websites/${websiteId}/members/${memberId}`, { roleId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members(websiteId) }),
  });
}

export function useRemoveMember(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/websites/${websiteId}/members/${memberId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members(websiteId) }),
  });
}

export function useRoles(websiteId: string) {
  return useQuery({
    queryKey: keys.roles(websiteId),
    queryFn: () => api.get<Role[]>(`/websites/${websiteId}/roles`),
    enabled: !!websiteId,
  });
}

export function useCreateRole(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; permissions: string[] }) =>
      api.post<Role>(`/websites/${websiteId}/roles`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.roles(websiteId) }),
  });
}

export function useUpdateRole(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      ...body
    }: {
      roleId: string;
      name?: string;
      permissions?: string[];
    }) => api.patch<Role>(`/websites/${websiteId}/roles/${roleId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.roles(websiteId) });
      // The caller's own capabilities may have just changed.
      qc.invalidateQueries({ queryKey: keys.permissions(websiteId) });
    },
  });
}

export function useDeleteRole(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) =>
      api.delete(`/websites/${websiteId}/roles/${roleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.roles(websiteId) }),
  });
}

// ------------------------------------------------------------------- users

export function useUsers(page = 1) {
  return useQuery({
    queryKey: keys.users(page),
    queryFn: () => api.get<Paginated<User>>("/users", { page, limit: 50 }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Partial<User>) =>
      api.patch<User>(`/users/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// ------------------------------------------------------------------- pages

export interface PageQuery {
  page?: number;
  limit?: number;
  status?: PageStatus | "";
  search?: string;
}

export function usePages(websiteId: string, query: PageQuery) {
  return useQuery({
    queryKey: keys.pages(websiteId, query),
    queryFn: () =>
      api.get<Paginated<Page>>(`/websites/${websiteId}/pages`, { ...query }),
    enabled: !!websiteId,
  });
}

export function usePage(websiteId: string, pageId: string) {
  return useQuery({
    queryKey: keys.page(websiteId, pageId),
    queryFn: () => api.get<Page>(`/websites/${websiteId}/pages/${pageId}`),
    enabled: !!websiteId && !!pageId,
  });
}

/** Invalidates the whole pages subtree — list and detail alike. */
function usePageMutation<TArgs, TResult>(
  websiteId: string,
  fn: (args: TArgs) => Promise<TResult>,
) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TArgs>({
    mutationFn: fn,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["websites", websiteId, "pages"] }),
  });
}

export function useCreatePage(websiteId: string) {
  return usePageMutation(websiteId, (body: Partial<Page>) =>
    api.post<Page>(`/websites/${websiteId}/pages`, body),
  );
}

export function useUpdatePage(websiteId: string) {
  return usePageMutation(
    websiteId,
    ({ pageId, ...body }: Partial<Page> & { pageId: string }) =>
      api.patch<Page>(`/websites/${websiteId}/pages/${pageId}`, body),
  );
}

export function usePagePublish(websiteId: string) {
  return usePageMutation(
    websiteId,
    ({ pageId, publish }: { pageId: string; publish: boolean }) =>
      api.post<Page>(
        `/websites/${websiteId}/pages/${pageId}/${
          publish ? "publish" : "unpublish"
        }`,
      ),
  );
}

export function useDeletePage(websiteId: string) {
  return usePageMutation(websiteId, (pageId: string) =>
    api.delete(`/websites/${websiteId}/pages/${pageId}`),
  );
}

// ------------------------------------------------------------------- menus

export function useMenus(websiteId: string) {
  return useQuery({
    queryKey: keys.menus(websiteId),
    queryFn: () => api.get<Menu[]>(`/websites/${websiteId}/menus`),
    enabled: !!websiteId,
  });
}

export function useMenu(websiteId: string, menuId: string) {
  return useQuery({
    queryKey: keys.menu(websiteId, menuId),
    queryFn: () => api.get<MenuDetail>(`/websites/${websiteId}/menus/${menuId}`),
    enabled: !!websiteId && !!menuId,
  });
}

function useMenuMutation<TArgs, TResult>(
  websiteId: string,
  fn: (args: TArgs) => Promise<TResult>,
) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TArgs>({
    mutationFn: fn,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["websites", websiteId, "menus"] }),
  });
}

export function useCreateMenu(websiteId: string) {
  return useMenuMutation(websiteId, (body: { name: string; slug: string }) =>
    api.post<Menu>(`/websites/${websiteId}/menus`, body),
  );
}

export function useUpdateMenu(websiteId: string) {
  return useMenuMutation(
    websiteId,
    ({ menuId, ...body }: { menuId: string; name?: string; slug?: string }) =>
      api.patch<Menu>(`/websites/${websiteId}/menus/${menuId}`, body),
  );
}

export function useDeleteMenu(websiteId: string) {
  return useMenuMutation(websiteId, (menuId: string) =>
    api.delete(`/websites/${websiteId}/menus/${menuId}`),
  );
}

export function useAddMenuItem(websiteId: string, menuId: string) {
  return useMenuMutation(websiteId, (body: MenuItemInput) =>
    api.post(`/websites/${websiteId}/menus/${menuId}/items`, body),
  );
}

export function useUpdateMenuItem(websiteId: string, menuId: string) {
  return useMenuMutation(
    websiteId,
    ({ itemId, ...body }: MenuItemInput & { itemId: string }) =>
      api.patch(`/websites/${websiteId}/menus/${menuId}/items/${itemId}`, body),
  );
}

export function useDeleteMenuItem(websiteId: string, menuId: string) {
  return useMenuMutation(websiteId, (itemId: string) =>
    api.delete(`/websites/${websiteId}/menus/${menuId}/items/${itemId}`),
  );
}

/**
 * Whole-tree reorder in one call — unlike fields, menus have a dedicated
 * endpoint, so a drag never fans out into N requests.
 */
export function useReorderMenu(websiteId: string, menuId: string) {
  return useMenuMutation(websiteId, (items: ReorderMenuItem[]) =>
    apiFetch(`/websites/${websiteId}/menus/${menuId}/reorder`, {
      method: "PUT",
      body: { items },
    }),
  );
}

// --------------------------------------------------------------------- seo

export function useSeoDefaults(websiteId: string) {
  return useQuery({
    queryKey: keys.seoDefaults(websiteId),
    queryFn: () => api.get<SeoDefaults>(`/websites/${websiteId}/seo/defaults`),
    enabled: !!websiteId,
  });
}

export function useUpsertSeoDefaults(websiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SeoDefaults) =>
      apiFetch<SeoDefaults>(`/websites/${websiteId}/seo/defaults`, {
        method: "PUT",
        body,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.seoDefaults(websiteId) }),
  });
}

/**
 * SEO lives in one polymorphic table keyed by (targetType, targetId), so a page
 * and an entry go through the very same endpoint.
 */
export function useSeo(
  websiteId: string,
  targetType: SeoTarget,
  targetId: string,
) {
  return useQuery({
    queryKey: keys.seo(websiteId, targetType, targetId),
    queryFn: async () => {
      try {
        return await api.get<Seo>(
          `/websites/${websiteId}/seo/${targetType}/${targetId}`,
        );
      } catch (error) {
        // A target with no SEO row 404s, which is the normal state of anything
        // just created — an empty form is the answer, not an error banner.
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: !!websiteId && !!targetId,
  });
}

export function useUpsertSeo(
  websiteId: string,
  targetType: SeoTarget,
  targetId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SeoInput) =>
      apiFetch<Seo>(`/websites/${websiteId}/seo/${targetType}/${targetId}`, {
        method: "PUT",
        body,
      }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: keys.seo(websiteId, targetType, targetId),
      }),
  });
}

// ---------------------------------------------------------------- settings

export function useSettings(websiteId: string) {
  return useQuery({
    queryKey: keys.settings(websiteId),
    queryFn: () => api.get<Setting[]>(`/websites/${websiteId}/settings`),
    enabled: !!websiteId,
  });
}

function useSettingMutation<TArgs, TResult>(
  websiteId: string,
  fn: (args: TArgs) => Promise<TResult>,
) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TArgs>({
    mutationFn: fn,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.settings(websiteId) }),
  });
}

export function useUpsertSetting(websiteId: string) {
  return useSettingMutation(
    websiteId,
    ({ key, value }: { key: string; value: unknown }) =>
      apiFetch<Setting>(`/websites/${websiteId}/settings/${key}`, {
        method: "PUT",
        body: { value },
      }),
  );
}

export function useDeleteSetting(websiteId: string) {
  return useSettingMutation(websiteId, (key: string) =>
    api.delete(`/websites/${websiteId}/settings/${key}`),
  );
}

// ---------------------------------------------------------------- api keys

export function useApiKeys(websiteId: string) {
  return useQuery({
    queryKey: keys.apiKeys(websiteId),
    queryFn: () => api.get<ApiKey[]>(`/websites/${websiteId}/api-keys`),
    enabled: !!websiteId,
  });
}

function useApiKeyMutation<TArgs, TResult>(
  websiteId: string,
  fn: (args: TArgs) => Promise<TResult>,
) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TArgs>({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.apiKeys(websiteId) }),
  });
}

/** The plaintext key comes back only here — the caller must show it at once. */
export function useCreateApiKey(websiteId: string) {
  return useApiKeyMutation(websiteId, (body: { name: string }) =>
    api.post<ApiKeyCreated>(`/websites/${websiteId}/api-keys`, body),
  );
}

export function useRevokeApiKey(websiteId: string) {
  return useApiKeyMutation(websiteId, (apiKeyId: string) =>
    api.post<ApiKey>(`/websites/${websiteId}/api-keys/${apiKeyId}/revoke`),
  );
}

export function useDeleteApiKey(websiteId: string) {
  return useApiKeyMutation(websiteId, (apiKeyId: string) =>
    api.delete(`/websites/${websiteId}/api-keys/${apiKeyId}`),
  );
}
