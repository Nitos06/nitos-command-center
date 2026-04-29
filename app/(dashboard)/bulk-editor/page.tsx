import { PageHeader, EmptyState } from "@/components/page-header";
import { PenLine } from "lucide-react";

export default function BulkEditorPage() {
  return (
    <>
      <PageHeader
        title="Bulk Editor"
        subtitle="Edit prices, titles, tags, and inventory across all products at once"
      />
      <div className="card">
        <EmptyState
          icon={PenLine}
          title="Bulk editor coming soon"
          hint="Live spreadsheet-style editor for all your Shopify products. Inline edit prices, compare-at prices, titles, descriptions, tags, and inventory. Save changes write directly to Shopify via Admin API."
        />
      </div>
    </>
  );
}
