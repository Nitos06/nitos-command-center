import { PageHeader, EmptyState } from "@/components/page-header";
import { HelpCircle } from "lucide-react";

export default function QuizPage() {
  return (
    <>
      <PageHeader
        title="Quiz"
        subtitle="Product recommendation quizzes — replacing Octane AI / RevenueHunt"
      />
      <div className="card">
        <EmptyState
          icon={HelpCircle}
          title="Quiz builder coming soon"
          hint="Create personalized product recommendation quizzes. Captures email before showing results. Automatically tags Shopify customers and triggers follow-up email flows based on quiz outcome."
        />
      </div>
    </>
  );
}
