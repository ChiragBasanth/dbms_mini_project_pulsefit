export async function GET(){return Response.json({name:"PulseFit API",status:"ready",databases:{postgres:Boolean(process.env.DATABASE_URL),mongo:Boolean(process.env.MONGODB_URI)}})}
