import { Pool } from "pg";
import { embedText,toPgVector } from "./embeddings";
const pool=new Pool({connectionString:process.env.DATABASE_URL});
export async function searchTrainers(query:string,limit=8){const vector=toPgVector(embedText(query));const {rows}=await pool.query("SELECT * FROM recommend_trainers($1::vector,$2)",[vector,limit]);return rows;}
export async function searchExercises(query:string,limit=8){const vector=toPgVector(embedText(query));const {rows}=await pool.query("SELECT id,name,description,category,1-(embedding <=> $1::vector) AS similarity,metadata FROM exercise_embeddings ORDER BY embedding <=> $1::vector LIMIT $2",[vector,limit]);return rows;}
