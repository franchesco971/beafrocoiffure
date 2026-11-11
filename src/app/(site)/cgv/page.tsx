import { LegalPage, legalMetadata } from "@/components/legal/LegalPage";

export const metadata = legalMetadata("legal.terms");

export default function CgvPage() {
  return <LegalPage contentKey="legal.terms" />;
}
