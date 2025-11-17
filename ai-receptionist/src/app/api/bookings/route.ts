import { NextResponse } from "next/server";
import { z } from "zod";

import { createBooking, listBookings } from "@/lib/storage";

const newBookingSchema = z.object({
  guestName: z.string().min(1),
  phoneNumber: z.string().min(3),
  email: z.string().email().optional(),
  service: z.string().min(1),
  notes: z.string().optional(),
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(8 * 60),
});

export async function GET() {
  const bookings = await listBookings();
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = newBookingSchema.parse(payload);
    const booking = await createBooking(data);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid booking payload", details: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Failed to create booking", error);
    return NextResponse.json(
      { error: "Unable to create booking" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
