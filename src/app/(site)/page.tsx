import { Booking } from "@/components/home/Booking";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { Services } from "@/components/home/Services";
import { Universes } from "@/components/home/Universes";

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Universes />
      <Services />
      <Booking />
    </>
  );
}
