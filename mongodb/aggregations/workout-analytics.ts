// Replace MEMBER_ID with a real PostgreSQL member UUID string when running in mongosh.
export const workoutAnalytics = (memberId: string) => [
  { $match: { memberId } },
  { $facet: {
    totalWorkouts: [{ $count: "count" }],
    weeklyFrequency: [
      { $group: { _id: { $dateTrunc: { date: "$workoutDate", unit: "week" } }, workouts: { $sum: 1 }, minutes: { $sum: "$durationMinutes" } } },
      { $sort: { _id: 1 } }
    ],
    exercisePerformance: [
      { $unwind: "$exercises" },
      { $group: { _id: "$exercises.name", sessions: { $sum: 1 }, setCount: { $sum: { $size: "$exercises.sets" } } } },
      { $sort: { sessions: -1 } }
    ],
    consistency: [
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$workoutDate" } } } },
      { $count: "activeDays" }
    ]
  } }
];

export const totalVolumePipeline = (memberId: string) => [
  { $match: { memberId } },
  { $unwind: "$exercises" },
  { $unwind: "$exercises.sets" },
  { $group: { _id: "$memberId", volumeKg: { $sum: { $multiply: [{ $ifNull: ["$exercises.sets.reps", 0] }, { $ifNull: ["$exercises.sets.weightKg", 0] }] } } } }
];
