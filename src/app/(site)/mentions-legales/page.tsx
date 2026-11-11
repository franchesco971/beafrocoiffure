import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

export const metadata = legalMetadata("legal.mentions");

export default function MentionsLegalesPage() {
  return <LegalPage contentKey="legal.mentions" />;
}
