import { createHash } from "node:crypto";
// Deterministic feature-hashing embedding (128 dimensions), normalized for cosine distance.
// This is a reproducible local baseline, not a pretrained language model.
export function embedText(text:string):number[]{const vector=Array(128).fill(0);const tokens=text.toLowerCase().normalize("NFKD").match(/[a-z0-9]+/g)||[];for(let i=0;i<tokens.length;i++){const token=tokens[i];const digest=createHash("sha256").update(token).digest();const index=digest.readUInt32LE(0)%128;const sign=(digest[4]&1)?1:-1;vector[index]+=sign; if(i+1<tokens.length){const bigram=`${token}_${tokens[i+1]}`;const d=createHash("sha256").update(bigram).digest();vector[d.readUInt32LE(0)%128]+=(d[4]&1)?0.5:-0.5;}}const norm=Math.sqrt(vector.reduce((s,v)=>s+v*v,0))||1;return vector.map(v=>Number((v/norm).toFixed(8)));}
export function toPgVector(values:number[]):string{if(values.length!==128)throw new Error("Expected 128-dimensional embedding");return `[${values.join(",")}]`;}
