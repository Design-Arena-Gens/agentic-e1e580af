import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { listBookings, updateBookingStatus } from "@/lib/storage";

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const payload = await request.json();
    const data = updateSchema.parse(payload);
    const { id } = await params;
    const updated = await updateBookingStatus(id, data.status);

    if (!updated) {
      return NextResponse.json(
        { error: `Booking ${id} not found` },
        { status: 404 },
      );
    }

    return NextResponse.json({ booking: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid update payload", details: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Failed to update booking", error);
    return NextResponse.json(
      { error: "Unable to update booking" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bookings = await listBookings();
  const booking = bookings.find((item) => item.id === id);

  if (!booking) {
    return NextResponse.json(
      { error: `Booking ${id} not found` },
      { status: 404 },
    );
  }

  return NextResponse.json({ booking });
}

export const dynamic = "force-dynamic";
