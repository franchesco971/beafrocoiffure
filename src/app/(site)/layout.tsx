import { Suspense } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { StickyBook } from "@/components/site/StickyBook";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <StickyBook />
      </Suspense>
    </>
  );
}
