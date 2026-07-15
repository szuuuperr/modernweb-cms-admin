"use client";

import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { useDeleteMedia, useMedia, useUploadMedia } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils";
import type { Media } from "@/lib/api/types";

export function MediaSection({ websiteId }: { websiteId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useMedia(websiteId, page);
  const upload = useUploadMedia(websiteId);
  const { can } = useCan(websiteId);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (files: FileList | null) => {
    if (!files?.length) return;
    // Uploaded one at a time: the API takes a single file per request, and
    // serialising keeps one rejected file from cancelling the rest.
    for (const file of Array.from(files)) {
      await upload.mutateAsync({ file }).catch(() => undefined);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Berkas diunggah ke storage yang dikonfigurasi backend (local atau
          Cloudinary).
        </p>
        {can("media.upload") && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onPick(e.target.files)}
            />
            <Button
              loading={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Unggah
            </Button>
          </>
        )}
      </div>

      {upload.error && <ErrorBlock error={upload.error} />}
      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}

      {data?.items.length === 0 && (
        <EmptyState
          title="Media kosong"
          description="Unggah gambar atau berkas untuk dipakai di field bertipe MEDIA."
        />
      )}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {data?.items.map((item) => (
          <MediaCard key={item.id} websiteId={websiteId} media={item} canDelete={can("media.delete")} />
        ))}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}
    </div>
  );
}

function MediaCard({
  websiteId,
  media,
  canDelete,
}: {
  websiteId: string;
  media: Media;
  canDelete: boolean;
}) {
  const remove = useDeleteMedia(websiteId);
  const isImage = media.mimeType.startsWith("image/");
  // Prefer a generated thumbnail so a grid of 40 does not pull full-size
  // originals; local storage has no variants and falls back to the original.
  const thumb = media.variants?.thumb ?? media.variants?.small ?? media.url;

  return (
    <Card className="overflow-hidden">
      <div className="flex aspect-square items-center justify-center bg-slate-100">
        {isImage ? (
          // Plain <img>: these URLs are Cloudinary/local and already sized, and
          // next/image would need every host allow-listed for no gain here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={media.alt ?? media.filename}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-2 text-center text-xs text-slate-500">
            {media.mimeType}
          </span>
        )}
      </div>
      <CardBody className="space-y-1 p-3">
        <p className="truncate text-xs font-medium" title={media.filename}>
          {media.filename}
        </p>
        <p className="text-xs text-slate-400">
          {formatBytes(media.size)} · {formatDate(media.createdAt)}
        </p>
        <div className="flex items-center justify-between pt-1">
          <a
            href={media.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 hover:underline"
          >
            Buka
          </a>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              loading={remove.isPending}
              aria-label="Hapus media"
              onClick={() => {
                if (confirm(`Hapus "${media.filename}"?`)) remove.mutate(media.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </Button>
          )}
        </div>
        {remove.error && <ErrorBlock error={remove.error} />}
      </CardBody>
    </Card>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
