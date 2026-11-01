import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { WorkoutLog } from "@/lib/workout-model";
import { workoutSchema } from "@/lib/validation";
import { requireSession } from "@/lib/authorization";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const auth=await requireSession(["MEMBER"]);if(auth.error)return auth.error;const body=workoutSchema.safeParse(await request.json());if(!body.success)return NextResponse.json({error:body.error.flatten()},{status:400});try{await connectMongo();const doc=await WorkoutLog.findOneAndUpdate({_id:(await params).id,memberId:auth.session.id},body.data,{new:true});return doc?NextResponse.json({workout:doc}):NextResponse.json({error:"Workout not found"},{status:404});}catch{return NextResponse.json({error:"Workout update failed"},{status:503});}}
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){const auth=await requireSession(["MEMBER"]);if(auth.error)return auth.error;try{await connectMongo();const doc=await WorkoutLog.findOneAndDelete({_id:(await params).id,memberId:auth.session.id});return doc?NextResponse.json({ok:true}):NextResponse.json({error:"Workout not found"},{status:404});}catch{return NextResponse.json({error:"Workout deletion failed"},{status:503});}}
