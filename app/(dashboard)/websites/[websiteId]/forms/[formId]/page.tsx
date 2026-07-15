"use client";

import { use } from "react";
import { FormSubmissionsSection } from "@/sections/forms/form-submissions-section";

export default function FormSubmissionsPage({
  params,
}: {
  params: Promise<{ websiteId: string; formId: string }>;
}) {
  const { websiteId, formId } = use(params);
  return <FormSubmissionsSection websiteId={websiteId} formId={formId} />;
}
