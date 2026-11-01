import "server-only";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { hash, compare } from "bcryptjs";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { sql, mongo } from "@/lib/db";
import { currentUser, requireUser, session, guardOrigin } from "@/lib/auth";
import { HttpError, errorResponse } from "@/lib/errors";
import {
  registration,
  credentials,
  slotInput,
  uuid,
  workoutInput,
  goalsInput,
} from "@/lib/validation";
import { progressPipeline } from "@/lib/workouts";
import { embed, vector, MODEL } from "@/lib/embedding";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; until: number }>();
function throttle(email: string) {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const v = attempts.get(email) || { count: 0, until: now + 60000 };
  if (v.count >= 12)
    throw new HttpError(429, "Too many attempts; retry in one minute");
  v.count++;
  if (attempts.size < 10000 || attempts.has(email)) attempts.set(email, v);
}
async function body(req: Request) {
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 65536)
    throw new HttpError(413, "Request too large");
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}
const ok = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
function objectId(id: string) {
  if (!/^[0-9a-f]{24}$/i.test(id))
    throw new HttpError(400, "Invalid workout id");
  return new ObjectId(id);
}
function dates(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from"),
    to = req.nextUrl.searchParams.get("to");
  const parse = (s: string | null) =>
    s ? new Date(z.iso.datetime({ offset: true }).parse(s)) : undefined;
  const a = parse(from),
    b = parse(to);
  if (a && b && a > b) throw new HttpError(400, "Invalid date range");
  return { from: a, to: b };
}
async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const p = (await ctx.params).path;
    const route = p[0],
      id = p[1],
      method = req.method;
    if (method !== "GET") guardOrigin(req);
    if (route === "auth" && method === "POST") {
      if (id === "logout") {
        (await cookies()).delete("pulsefit");
        return ok({ ok: true });
      }
      if (id === "register") {
        const input = registration.parse(await body(req));
        throttle(input.email);
        const password = await hash(input.password, 12);
        const c = await sql().connect();
        try {
          await c.query("BEGIN");
          const user = (
            await c.query(
              "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role",
              [input.name, input.email, password, input.role],
            )
          ).rows[0];
          if (input.role === "MEMBER")
            await c.query("INSERT INTO member_profiles(user_id) VALUES($1)", [
              user.id,
            ]);
          else
            await c.query("INSERT INTO trainer_profiles(user_id) VALUES($1)", [
              user.id,
            ]);
          await c.query("COMMIT");
          await session(user);
          return ok({ user }, 201);
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      }
      if (id === "login") {
        const input = credentials.parse(await body(req));
        throttle(input.email);
        const user = (
          await sql().query("SELECT * FROM users WHERE email=$1", [input.email])
        ).rows[0];
        const valid = await compare(
          input.password,
          user?.password_hash ||
            "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6Ttx9QmYj7NQQyVY0wOjH1yXh1G9K",
        );
        if (!user || !valid)
          throw new HttpError(401, "Invalid email or password");
        await session(user);
        return ok({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
    }
    if (route === "me" && method === "GET") {
      const user = await currentUser();
      return ok({ user });
    }
    if (route === "trainers" && method === "GET") {
      await requireUser();
      const search = z
        .string()
        .max(100)
        .parse(req.nextUrl.searchParams.get("q") || "");
      const rows = (
        await sql().query(
          "SELECT u.id,u.name,t.bio,t.specialties,t.experience_years,t.location FROM users u JOIN trainer_profiles t ON t.user_id=u.id WHERE ($1='' OR u.name ILIKE '%'||$1||'%' OR t.bio ILIKE '%'||$1||'%' OR array_to_string(t.specialties,',') ILIKE '%'||$1||'%') AND ($2::uuid IS NULL OR u.id=$2) ORDER BY u.name LIMIT 100",
          [search, id ? uuid.parse(id) : null],
        )
      ).rows;
      return ok(rows);
    }
    if (route === "profile" && method === "PUT") {
      const u = await requireUser();
      if (u.role === "MEMBER") {
        const v = z
          .object({ goals: z.string().max(2000) })
          .parse(await body(req));
        await sql().query(
          "UPDATE member_profiles SET fitness_goals=$1 WHERE user_id=$2",
          [v.goals, u.id],
        );
      } else {
        const v = z
          .object({
            bio: z.string().max(2000),
            specialties: z.array(z.string().trim().min(1).max(60)).max(15),
            experienceYears: z.number().int().min(0).max(80),
          })
          .parse(await body(req));
        const embedding = await embed([v.bio, ...v.specialties].join(" "));
        await sql().query(
          "UPDATE trainer_profiles SET bio=$1,specialties=$2,experience_years=$3,embedding=$4::vector,embedding_model=$5 WHERE user_id=$6",
          [
            v.bio,
            v.specialties,
            v.experienceYears,
            vector(embedding),
            MODEL,
            u.id,
          ],
        );
      }
      return ok({ ok: true });
    }
    if (route === "availability") {
      if (method === "GET") {
        const u = await requireUser();
        const trainer = req.nextUrl.searchParams.get("trainerId");
        const trainerId = trainer
          ? uuid.parse(trainer)
          : u.role === "TRAINER"
            ? u.id
            : null;
        return ok(
          (
            await sql().query(
              "SELECT s.*,EXISTS(SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status='CONFIRMED') occupied FROM trainer_availability s WHERE ($1::uuid IS NULL OR s.trainer_id=$1) AND s.ends_at>now() ORDER BY starts_at LIMIT 200",
              [trainerId],
            )
          ).rows,
        );
      }
      const u = await requireUser("TRAINER");
      if (method === "POST") {
        const v = slotInput.parse(await body(req));
        return ok(
          (
            await sql().query(
              "INSERT INTO trainer_availability(trainer_id,starts_at,ends_at) VALUES($1,$2,$3) RETURNING *",
              [u.id, v.startsAt, v.endsAt],
            )
          ).rows[0],
          201,
        );
      }
      if (method === "DELETE" && id) {
        const result = await sql().query(
          "UPDATE trainer_availability SET status='CLOSED' WHERE id=$1 AND trainer_id=$2 RETURNING id",
          [uuid.parse(id), u.id],
        );
        if (!result.rowCount) throw new HttpError(404, "Slot not found");
        return ok({ ok: true });
      }
    }
    if (route === "bookings") {
      const u = await requireUser();
      if (method === "GET")
        return ok(
          (
            await sql().query(
              "SELECT b.id,b.status,b.slot_id,b.member_id,b.trainer_id,m.name member_name,t.name trainer_name,s.starts_at,s.ends_at FROM bookings b JOIN users m ON m.id=b.member_id JOIN users t ON t.id=b.trainer_id JOIN trainer_availability s ON s.id=b.slot_id WHERE ($1='MEMBER' AND b.member_id=$2) OR ($1='TRAINER' AND b.trainer_id=$2) ORDER BY s.starts_at DESC LIMIT 200",
              [u.role, u.id],
            )
          ).rows,
        );
      await requireUser("MEMBER");
      if (method === "POST") {
        const v = z.object({ slotId: uuid }).parse(await body(req));
        const result = await sql().query("SELECT reserve_slot($1,$2) id", [
          u.id,
          v.slotId,
        ]);
        return ok(result.rows[0], 201);
      }
      if (method === "DELETE" && id) {
        const result = await sql().query(
          "UPDATE bookings b SET status='CANCELLED' FROM trainer_availability s WHERE b.slot_id=s.id AND b.id=$1 AND b.member_id=$2 AND b.status='CONFIRMED' AND s.starts_at>now() RETURNING b.id",
          [uuid.parse(id), u.id],
        );
        if (!result.rowCount)
          throw new HttpError(404, "Active future booking not found");
        return ok({ ok: true });
      }
    }
    if (route === "workouts") {
      const u = await requireUser("MEMBER");
      const collection = (await mongo()).collection("workout_logs");
      if (method === "GET") {
        const range = dates(req);
        const type = req.nextUrl.searchParams.get("type");
        if (type)
          z.enum(["STRENGTH", "CARDIO", "MIXED", "MOBILITY"]).parse(type);
        const items = await collection
          .find({
            userId: u.id,
            ...(id ? { _id: objectId(id) } : {}),
            ...(type ? { workoutType: type } : {}),
            ...(range.from || range.to
              ? {
                  performedAt: {
                    ...(range.from ? { $gte: range.from } : {}),
                    ...(range.to ? { $lte: range.to } : {}),
                  },
                }
              : {}),
          })
          .sort({ performedAt: -1 })
          .limit(100)
          .toArray();
        return ok(items);
      }
      if (method === "POST" || method === "PUT") {
        const v = workoutInput.parse(await body(req));
        const doc = { ...v, performedAt: new Date(v.performedAt) };
        if (method === "POST") {
          const result = await collection.insertOne({
            ...doc,
            userId: u.id,
            createdAt: new Date(),
          });
          return ok({ id: result.insertedId.toHexString() }, 201);
        }
        if (!id) throw new HttpError(400, "Workout id required");
        const result = await collection.updateOne(
          { _id: objectId(id), userId: u.id },
          { $set: doc },
        );
        if (!result.matchedCount) throw new HttpError(404, "Workout not found");
        return ok({ ok: true });
      }
      if (method === "DELETE" && id) {
        const result = await collection.deleteOne({
          _id: objectId(id),
          userId: u.id,
        });
        if (!result.deletedCount) throw new HttpError(404, "Workout not found");
        return ok({ ok: true });
      }
    }
    if (route === "analytics" && method === "GET") {
      const u = await requireUser("MEMBER");
      const range = dates(req);
      return ok(
        (
          await (
            await mongo()
          )
            .collection("workout_logs")
            .aggregate(progressPipeline(u.id, range.from, range.to))
            .toArray()
        )[0] || { sessions: [], volume: [] },
      );
    }
    if (route === "recommendations" && method === "POST") {
      const u = await requireUser("MEMBER");
      const v = goalsInput.parse(await body(req));
      const embedding = vector(await embed(v.goals));
      const exercises = (
        await sql().query(
          "SELECT id,name,description,category,1-(embedding <=> $1::vector) similarity FROM exercises WHERE embedding IS NOT NULL AND embedding_model=$2 AND ($3::text IS NULL OR category=$3) ORDER BY embedding <=> $1::vector LIMIT 5",
          [embedding, MODEL, v.category || null],
        )
      ).rows;
      const trainers = (
        await sql().query(
          "SELECT t.user_id id,u.name,t.bio,t.specialties,1-(t.embedding <=> $1::vector) similarity FROM trainer_profiles t JOIN users u ON u.id=t.user_id WHERE t.embedding IS NOT NULL AND t.embedding_model=$2 AND EXISTS(SELECT 1 FROM trainer_availability s WHERE s.trainer_id=t.user_id AND s.starts_at>now() AND s.status='OPEN' AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status='CONFIRMED')) ORDER BY t.embedding <=> $1::vector LIMIT 5",
          [embedding, MODEL],
        )
      ).rows;
      await sql().query(
        "UPDATE member_profiles SET fitness_goals=$1 WHERE user_id=$2",
        [v.goals, u.id],
      );
      return ok({ exercises, trainers, model: MODEL, dimension: 384 });
    }
    throw new HttpError(404, "Endpoint not found");
  } catch (e) {
    return errorResponse(e);
  }
}
export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
