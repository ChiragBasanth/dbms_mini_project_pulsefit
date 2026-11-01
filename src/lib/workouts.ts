import type { Document } from "mongodb";
export function progressPipeline(
  userId: string,
  from?: Date,
  to?: Date,
): Document[] {
  const range = {
    ...(from ? { $gte: from } : {}),
    ...(to ? { $lte: to } : {}),
  };
  return [
    {
      $match: {
        userId,
        ...(Object.keys(range).length ? { performedAt: range } : {}),
      },
    },
    {
      $facet: {
        sessions: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$performedAt",
                  timezone: "UTC",
                },
              },
              sessions: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: "$_id", sessions: 1 } },
        ],
        volume: [
          { $unwind: "$exercises" },
          { $unwind: "$exercises.sets" },
          {
            $group: {
              _id: "$exercises.name",
              volume: {
                $sum: {
                  $multiply: [
                    { $ifNull: ["$exercises.sets.reps", 0] },
                    { $ifNull: ["$exercises.sets.weight", 0] },
                  ],
                },
              },
              duration: { $sum: { $ifNull: ["$exercises.sets.duration", 0] } },
              distance: { $sum: { $ifNull: ["$exercises.sets.distance", 0] } },
            },
          },
          { $sort: { volume: -1 } },
          {
            $project: {
              _id: 0,
              exercise: "$_id",
              volume: 1,
              duration: 1,
              distance: 1,
            },
          },
        ],
      },
    },
  ];
}
