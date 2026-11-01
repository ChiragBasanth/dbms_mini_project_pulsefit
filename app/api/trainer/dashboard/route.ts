import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authorization";
import { pgPool } from "@/lib/postgres";
export async function GET(){const auth=await requireSession(["TRAINER"]);if(auth.error)return auth.error;try{const {rows}=await pgPool.query("SELECT COUNT(*) FILTER(WHERE status='PENDING')::int pending,COUNT(*) FILTER(WHERE status='CONFIRMED' AND starts_at>=now())::int upcoming,COUNT(*) FILTER(WHERE status='COMPLETED')::int completed,MIN(starts_at) FILTER(WHERE status='CONFIRMED' AND starts_at>=now()) next_session FROM bookings WHERE trainer_id=$1",[auth.session.id]);return NextResponse.json({stats:rows[0]});}catch{return NextResponse.json({error:"Database unavailable"},{status:503});}}
