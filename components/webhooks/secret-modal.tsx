"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

/**
 * The secret signs every payload and the API returns it only from create and
 * rotate-secret, so this is the one moment it can be captured. Shared by both
 * flows because the consequence is identical.
 */
export function SecretModal({
  name,
  secret,
  rotated,
  onClose,
}: {
  name: string;
  secret: string;
  /** Rotation additionally breaks the receiver until the new secret is in. */
  rotated?: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked outside a secure context; the secret is selectable
      // on screen either way, so this is not worth an error dialog.
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={rotated ? `Secret "${name}" diputar` : `Webhook "${name}" dibuat`}
      footer={<Button onClick={onClose}>Sudah saya simpan</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-warning-soft px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {rotated ? (
              <>
                Secret lama <strong>langsung berhenti berlaku</strong>. Receiver
                Anda akan menolak semua kiriman sampai secret baru ini dipasang.
              </>
            ) : (
              <>
                Salin sekarang. Setelah dialog ditutup, secret ini tidak bisa
                ditampilkan lagi — hanya bisa diputar dengan yang baru.
              </>
            )}
          </span>
        </div>

        <div className="space-y-1.5">
          <Label>Signing secret</Label>
          <div className="flex gap-2">
            <code className="flex-1 select-all break-all rounded-lg border border-border bg-slate-50 px-3 py-2 font-mono text-xs">
              {secret}
            </code>
            <Button variant="secondary" onClick={copy} aria-label="Salin secret">
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Cara memverifikasi di receiver</Label>
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-700">
            {`// header: x-mwc-signature: sha256=<hex>
import { createHmac, timingSafeEqual } from "crypto";

const expected =
  "sha256=" + createHmac("sha256", SECRET).update(rawBody).digest("hex");

// Bandingkan dengan timingSafeEqual, bukan ===
const ok = timingSafeEqual(
  Buffer.from(expected),
  Buffer.from(req.headers["x-mwc-signature"]),
);`}
          </pre>
          <p className="text-xs text-muted">
            HMAC dihitung dari <strong>raw body</strong>, bukan JSON hasil parse
            — parse ulang bisa mengubah spasi dan urutan key sehingga tanda
            tangan tidak cocok.
          </p>
        </div>
      </div>
    </Modal>
  );
}
