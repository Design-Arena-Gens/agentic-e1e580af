import { NextResponse } from "next/server";
import { z } from "zod";

import { generateAssistantTurn } from "@/lib/assistant";
import { createBooking, listBookings, updateBookingStatus } from "@/lib/storage";
import type { AssistantMessage } from "@/lib/types";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { messages } = requestSchema.parse(payload);

    const bookings = await listBookings();
    const result = await generateAssistantTurn({
      history: messages as AssistantMessage[],
      bookings,
    });

    let createdBooking = null;
    let updatedBooking = null;

    if (result.action.type === "create") {
      createdBooking = await createBooking({
        ...result.action.booking,
        startTime: new Date(result.action.booking.startTime).toISOString(),
      });
    } else if (result.action.type === "update") {
      updatedBooking = await updateBookingStatus(
        result.action.bookingId,
        result.action.status,
      );
    }

    return NextResponse.json({
      reply: result.reply,
      createdBooking,
      updatedBooking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid assistant payload", details: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Assistant handler failed", error);
    return NextResponse.json(
      { error: "Unable to process assistant request" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
