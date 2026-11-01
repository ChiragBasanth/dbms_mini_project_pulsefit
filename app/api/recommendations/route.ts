import { NextResponse } from "next/server";
import { z } from "zod";
import { searchExercises, searchTrainers } from "@/lib/semantic-search";
import { requireSession } from "@/lib/authorization";

const querySchema = z.object({ query: z.string().min(4).max(500), type: z.enum(["trainers", "exercises"]).default("trainers") });

export async function POST(request: Request) {
  const auth = await requireSession(["MEMBER"]);
  if (auth.error) return auth.error;
  const parsed = querySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const results = parsed.data.type === "trainers"
      ? await searchTrainers(parsed.data.query)
      : await searchExercises(parsed.data.query);
    return NextResponse.json({ results, model: "deterministic-token-bigram-hashing", dimensions: 128 });
  } catch {
    return NextResponse.json({ error: "PostgreSQL/pgvector is unavailable. Configure DATABASE_URL and apply the schema." }, { status: 503 });
  }
}
