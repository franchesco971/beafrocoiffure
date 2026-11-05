import { Booking } from "@/components/home/Booking";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { Services } from "@/components/home/Services";
import { Universes } from "@/components/home/Universes";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { StickyBook } from "@/components/site/StickyBook";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Marquee />
        <Universes />
        <Services />
        <Booking />
      </main>
      <Footer />
      <StickyBook />
    </>
  );
}
