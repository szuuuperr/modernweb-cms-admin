"use client";

import { useState } from "react";
import { Check, Copy, Eye, ExternalLink } from "lucide-react";
import { useIssuePreviewToken, useWebsite } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ErrorBlock } from "@/components/ui/feedback";
import type { PreviewToken } from "@/lib/api/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/**
 * Issues a short-lived, website-scoped preview token so a draft can be viewed
 * on the real frontend. Every click mints a new one, so it is a button rather
 * than something a render triggers.
 */
export function PreviewButton({
  websiteId,
  /** The Content API path this draft lives at, for the copyable example. */
  contentPath,
}: {
  websiteId: string;
  contentPath: string;
}) {
  const { can } = useCan(websiteId);
  const issue = useIssuePreviewToken(websiteId);
  const [token, setToken] = useState<PreviewToken | null>(null);

  if (!can("preview.create")) return null;

  return (
    <>
      <Button
        variant="secondary"
        loading={issue.isPending}
        onClick={async () => setToken(await issue.mutateAsync())}
      >
        <Eye className="h-4 w-4" />
        Preview
      </Button>

      {token && (
        <PreviewModal
          token={token}
          websiteId={websiteId}
          contentPath={contentPath}
          error={issue.error}
          onClose={() => setToken(null)}
        />
      )}
    </>
  );
}

function PreviewModal({
  token,
  websiteId,
  contentPath,
  error,
  onClose,
}: {
  token: PreviewToken;
  websiteId: string;
  contentPath: string;
  error: unknown;
  onClose: () => void;
}) {
  const { data: website } = useWebsite(websiteId);
  const [copied, setCopied] = useState<string | null>(null);

  const apiUrl = `${API_URL}/content/${token.websiteSlug}${contentPath}?preview=${token.token}`;

  const copy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard is blocked outside a secure context; the text is selectable.
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Preview draft"
      footer={<Button onClick={onClose}>Tutup</Button>}
    >
      <div className="space-y-4">
        {error != null && <ErrorBlock error={error} />}

        <p className="text-sm text-muted">
          Token ini membuka konten DRAFT lewat Content API dan{" "}
          <strong>melewati cache</strong>, berlaku {token.expiresIn} dan hanya
          untuk website <span className="font-mono">{token.websiteSlug}</span>.
        </p>

        <div className="space-y-1.5">
          <Label>Cek langsung di Content API</Label>
          <div className="flex gap-2">
            <code className="min-w-0 flex-1 select-all break-all rounded-lg border border-border bg-slate-50 px-3 py-2 font-mono text-xs">
              {apiUrl}
            </code>
            <div className="flex shrink-0 flex-col gap-1">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => copy(apiUrl, "url")}
                aria-label="Salin URL"
              >
                {copied === "url" ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <a href={apiUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="icon" aria-label="Buka URL">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
          <p className="text-xs text-muted">
            Ini mengembalikan JSON mentah — berguna untuk memastikan draft-nya
            memang tersaji.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Token</Label>
          <div className="flex gap-2">
            <code className="min-w-0 flex-1 select-all break-all rounded-lg border border-border bg-slate-50 px-3 py-2 font-mono text-xs">
              {token.token}
            </code>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => copy(token.token, "token")}
              aria-label="Salin token"
            >
              {copied === "token" ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* No frontend preview link is offered: the CMS does not know the
            frontend's preview route, and a guessed URL that 404s is worse than
            no link at all. */}
        <div className="space-y-1.5 rounded-lg border border-border bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-700">
            Memakainya di frontend
          </p>
          <p className="text-xs text-muted">
            Panel tidak tahu route preview website Anda, jadi tidak ada tautan
            langsung ke sana. Frontend perlu meneruskan token ini sebagai{" "}
            <code className="font-mono">?preview=</code> saat memanggil Content
            API
            {website?.domain && (
              <>
                {" "}
                — mis. <span className="font-mono">{website.domain}</span>{" "}
                membuat route yang menerima token lalu me-render draft
              </>
            )}
            .
          </p>
        </div>
      </div>
    </Modal>
  );
}
