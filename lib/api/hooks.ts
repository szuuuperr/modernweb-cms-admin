"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { api, apiFetch } from "./client";
import type {
  AddMemberInput,
  Collection,
  Entry,
  EntryStatus,
  Field,
  Media,
  Member,
  Paginated,
  Role,
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
