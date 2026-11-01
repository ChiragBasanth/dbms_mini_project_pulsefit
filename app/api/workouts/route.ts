import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { WorkoutLog } from "@/lib/workout-model";
import { workoutSchema } from "@/lib/validation";
import { requireSession } from "@/lib/authorization";

const volumeStages = [
  { $unwind: { path: "$exercises", preserveNullAndEmptyArrays: true } },
  { $unwind: { path: "$exercises.sets", preserveNullAndEmptyArrays: true } },
  { $group: { _id: "$memberId", volume: { $sum: { $multiply: [{ $ifNull: ["$exercises.sets.reps", 0] }, { $ifNull: ["$exercises.sets.weightKg", 0] }] } } } }
];

export async function POST(request: Request) {
  try {
    const auth = await requireSession(["MEMBER"]);
    if (auth.error) return auth.error;
    const body = workoutSchema.parse(await request.json());
    await connectMongo();
    const workout = await WorkoutLog.create({ ...body, memberId: auth.session.id });
    return NextResponse.json({ id: workout.id }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Workout save failed" }, { status: 400 }); }
}

export async function GET(request: Request) {
  try {
    const auth = await requireSession(["MEMBER", "TRAINER"]);
    if (auth.error) return auth.error;
    const requestedMemberId = new URL(request.url).searchParams.get("memberId");
    const memberId = auth.session.role === "MEMBER" ? auth.session.id : requestedMemberId;
    if (!memberId) return NextResponse.json({ error: "memberId required for trainer access" }, { status: 400 });
    await connectMongo();
    const [analytics] = await WorkoutLog.aggregate([
      { $match: { memberId } },
      { $facet: {
        total: [{ $count: "count" }],
        weekly: [{ $group: { _id: { $dateTrunc: { date: "$workoutDate", unit: "week" } }, count: { $sum: 1 }, durationMinutes: { $sum: "$durationMinutes" } } }, { $sort: { _id: 1 } }],
        history: [{ $sort: { workoutDate: -1 } }, { $limit: 30 }],
        exercisePerformance: [{ $unwind: "$exercises" }, { $group: { _id: "$exercises.name", sessions: { $sum: 1 }, sets: { $sum: { $size: "$exercises.sets" } } } }, { $sort: { sessions: -1 } }]
      } }
    ]);
    const [volume] = await WorkoutLog.aggregate([{ $match: { memberId } }, ...volumeStages]);
    return NextResponse.json({ ...analytics, totalVolumeKg: volume?.volume || 0 });
  } catch { return NextResponse.json({ error: "MongoDB unavailable" }, { status: 503 }); }
}
