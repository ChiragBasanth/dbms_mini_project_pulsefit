import type { Db } from "mongodb";
export const validator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "userId",
      "performedAt",
      "workoutType",
      "exercises",
      "createdAt",
    ],
    properties: {
      userId: { bsonType: "string", pattern: "^[0-9a-fA-F-]{36}$" },
      performedAt: { bsonType: "date" },
      createdAt: { bsonType: "date" },
      notes: { bsonType: "string", maxLength: 2000 },
      workoutType: { enum: ["STRENGTH", "CARDIO", "MIXED", "MOBILITY"] },
      exercises: {
        bsonType: "array",
        minItems: 1,
        maxItems: 30,
        items: {
          bsonType: "object",
          required: ["name", "sets"],
          properties: {
            name: { bsonType: "string", minLength: 1, maxLength: 100 },
            sets: {
              bsonType: "array",
              minItems: 1,
              maxItems: 30,
              items: {
                bsonType: "object",
                anyOf: [{ required: ["reps"] }, { required: ["duration"] }],
                properties: {
                  reps: {
                    bsonType: ["int", "long", "double"],
                    minimum: 1,
                    maximum: 1000,
                    multipleOf: 1,
                  },
                  weight: {
                    bsonType: ["int", "long", "double"],
                    minimum: 0,
                    maximum: 1500,
                  },
                  duration: {
                    bsonType: ["int", "long", "double"],
                    minimum: 0.001,
                    maximum: 86400,
                  },
                  distance: {
                    bsonType: ["int", "long", "double"],
                    minimum: 0.001,
                    maximum: 1000000,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
export async function setup(db: Db) {
  if (await db.listCollections({ name: "workout_logs" }).hasNext())
    await db.command({
      collMod: "workout_logs",
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  else await db.createCollection("workout_logs", { validator });
  await db
    .collection("workout_logs")
    .createIndex({ userId: 1, performedAt: -1 });
  await db
    .collection("workout_logs")
    .createIndex({ userId: 1, workoutType: 1, performedAt: -1 });
}
