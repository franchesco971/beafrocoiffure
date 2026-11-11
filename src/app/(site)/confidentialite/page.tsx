import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

export const metadata = legalMetadata("legal.privacy");

export default function ConfidentialitePage() {
  return <LegalPage contentKey="legal.privacy" />;
}
