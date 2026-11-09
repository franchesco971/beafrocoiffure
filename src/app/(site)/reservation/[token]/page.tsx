import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ManageBooking } from "@/components/booking/ManageBooking";
import { getBookingByToken, toPublicBooking } from "@/modules/booking/booking.service";
import { bookingTokenSchema } from "@/modules/booking/schemas";

// Lien personnel : ni indexé, ni transmis en référent.
export const metadata: Metadata = {
  title: "Votre rendez-vous",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function BookingPage(props: PageProps<"/reservation/[token]">) {
  return (
    <section className="px-5 pb-28 pt-36 lg:px-10 lg:pb-40 lg:pt-44">
      <div className="mx-auto max-w-[88rem]">
        <Suspense fallback={<BookingSkeleton />}>
          <Booking params={props.params} />
        </Suspense>
      </div>
    </section>
  );
}

function BookingSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="h-3 w-40 rounded-full bg-bone/10" />
      <div className="h-16 w-full max-w-2xl rounded-2xl bg-bone/10 md:h-24" />
      <div className="h-24 w-full max-w-xl rounded-2xl bg-bone/5" />
    </div>
  );
}

async function Booking({ params }: Pick<PageProps<"/reservation/[token]">, "params">) {
  const token = bookingTokenSchema.safeParse((await params).token);
  if (!token.success) notFound();

  await connection();
  const booking = await getBookingByToken(token.data);
  if (!booking) notFound();

  return <ManageBooking token={token.data} initial={toPublicBooking(booking)} />;
}
