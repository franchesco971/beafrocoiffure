import type { Metadata } from "next";
import { Booking } from "@/components/home/Booking";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { Services } from "@/components/home/Services";
import { Universes } from "@/components/home/Universes";
import { JsonLd } from "@/components/seo/JsonLd";
import { getContent } from "@/lib/content";
import { salonJsonLd } from "@/lib/seo";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const contact = await getContent("site.contact");

  return (
    <>
      <JsonLd data={salonJsonLd(contact)} />
      <Hero />
      <Marquee />
      <Universes />
      <Services />
      <Booking />
    </>
  );
}
