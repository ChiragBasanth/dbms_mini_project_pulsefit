import { Schema, model, models, Types } from "mongoose";
const ExerciseSchema=new Schema({name:{type:String,required:true},kind:{type:String,enum:["strength","cardio","mobility","sport","other"],required:true},sets:[{reps:Number,weightKg:Number,durationSeconds:Number,distanceMeters:Number, rpe:Number}],notes:String},{_id:false});
const WorkoutLogSchema=new Schema({memberId:{type:String,required:true,index:true},workoutDate:{type:Date,required:true,index:true},exercises:{type:[ExerciseSchema],default:[]},durationMinutes:{type:Number,min:0},caloriesBurned:{type:Number,min:0},notes:{type:String,maxlength:2000}},{timestamps:true});
WorkoutLogSchema.index({memberId:1,workoutDate:-1});
export type WorkoutLogDocument={memberId:string;workoutDate:Date;exercises:Array<{name:string;kind:string;sets:Array<{reps?:number;weightKg?:number;durationSeconds?:number;distanceMeters?:number;rpe?:number}>}>;durationMinutes?:number;caloriesBurned?:number;notes?:string};
export const WorkoutLog=models.WorkoutLog||model("WorkoutLog",WorkoutLogSchema);
