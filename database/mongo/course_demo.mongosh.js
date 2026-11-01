// mongosh "$MONGODB_URI/pulsefit_test" database/mongo/course_demo.mongosh.js
// Only disposable test database; fixture operations are owned and removed.
if (!db.getName().endsWith('_test')) throw Error('Use a disposable *_test database');
const uid='00000000-0000-4000-8000-000000000099';
const result=db.workout_logs.insertOne({userId:uid,performedAt:new Date(),createdAt:new Date(),workoutType:'STRENGTH',exercises:[{name:'Squat',sets:[{reps:10,weight:20}]}]});
printjson(db.workout_logs.findOne({_id:result.insertedId,userId:uid}));
db.workout_logs.updateOne({_id:result.insertedId,userId:uid},{$set:{notes:'Owned update'}});
printjson(db.workout_logs.aggregate([{$match:{userId:uid}},{$unwind:'$exercises'},{$unwind:'$exercises.sets'},{$group:{_id:'$exercises.name',volume:{$sum:{$multiply:[{$ifNull:['$exercises.sets.reps',0]},{$ifNull:['$exercises.sets.weight',0]}]}}}},{$sort:{volume:-1}},{$project:{_id:0,exercise:'$_id',volume:1}}]).toArray());
db.workout_logs.deleteOne({_id:result.insertedId,userId:uid});
