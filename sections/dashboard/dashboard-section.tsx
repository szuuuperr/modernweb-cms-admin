"use client";

import Link from "next/link";
import {
  FileText,
  Image as ImageIcon,
  Layers,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useWebsite } from "@/lib/api/hooks";
import { useCan } from "@/lib/auth/use-can";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import { AnalyticsSection } from "@/sections/analytics/analytics-section";
import type { WebsiteDetail } from "@/lib/api/types";

/**
 * The client's landing screen: what this website *is*, what is in it, and how
 * it is doing. Website details are read-only here — name, slug and domain are
 * wired into the deployed frontend and the public Content API, so changing them
 * is a platform-admin operation, not something a client should reach past by
 * accident.
 */
export function DashboardSection({ websiteId }: { websiteId: string }) {
  const { data, isLoading, error } = useWebsite(websiteId);
  const { can } = useCan(websiteId);

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock error={error} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title={data.name}
        description="Ringkasan konten dan kunjungan website Anda."
      />

      <div className="space-y-6">
        <WebsiteInfo website={data} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Collection"
            value={data.collections.length}
            icon={Layers}
            href={can("collections.read") ? `/websites/${websiteId}/collections` : undefined}
          />
          <StatCard
            label="Entry"
            value={data._count.entries}
            icon={FileText}
            href={can("collections.read") ? `/websites/${websiteId}/collections` : undefined}
          />
          <StatCard
            label="Media"
            value={data._count.media}
            icon={ImageIcon}
            href={can("media.read") ? `/websites/${websiteId}/media` : undefined}
          />
          <StatCard
            label="Anggota"
            value={data._count.members}
            icon={Users}
            href={can("members.read") ? `/websites/${websiteId}/members` : undefined}
          />
        </div>

        {can("analytics.read") && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Kunjungan</h2>
            {/* Reused whole: the analytics screen is already filters + stats +
                chart, which is exactly what belongs here. */}
            <AnalyticsSection websiteId={websiteId} />
          </div>
        )}
      </div>
    </div>
  );
}

function WebsiteInfo({ website }: { website: WebsiteDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi website</CardTitle>
        <span className="text-xs text-muted">
          Dikelola oleh ModernWeb — hubungi kami untuk mengubahnya
        </span>
      </CardHeader>
      <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="Nama" value={website.name} />
        <InfoItem label="Slug" value={website.slug} mono />
        <InfoItem label="Domain" value={website.domain ?? "—"} />
        <div className="space-y-1">
          <p className="text-xs text-muted">Status</p>
          <Badge tone={website.status === "ACTIVE" ? "success" : "slate"}>
            {website.status}
          </Badge>
        </div>
      </CardBody>
    </Card>
  );
}

function InfoItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-sm ${mono ? "font-mono" : "font-medium"}`}>{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  /** Omitted when the user lacks permission — the card then just informs. */
  href?: string;
}) {
  const body = (
    <Card className={href ? "h-full transition-shadow hover:shadow-pop" : "h-full"}>
      <CardBody className="flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted">{label}</p>
          {/* Proportional figures: tabular-nums reads loose at this size. */}
          <p className="text-2xl font-bold">{value.toLocaleString("id-ID")}</p>
        </div>
      </CardBody>
    </Card>
  );

  if (!href) return body;
  return (
    <Link
      href={href}
      className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700/40"
    >
      {body}
    </Link>
  );
}
