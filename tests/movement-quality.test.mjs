import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSrcModules } from './loadTsModules.mjs';
const m=loadSrcModules();
const {createMemoryFoodRepository}=m['storage/foodRepository'];
const make=()=>createMemoryFoodRepository({timezone:'UTC'});
const plan=(r,date='2026-11-10')=>r.addPlannedActivity({dateLocal:date,kind:'strength',title:'A',templateId:'tmpl-upper-a'});
test('rapid start and completed plan reopen reuse one session and its sets',()=>{
 const r=make(),p=plan(r),input={dateLocal:p.dateLocal,title:p.title,templateId:p.templateId,plannedActivityId:p.id};
 const a=r.startWorkoutSession(input),n=r.listWorkoutSets(a.id).length;
 assert.equal(r.startWorkoutSession(input).id,a.id); assert.equal(r.listWorkoutSets(a.id).length,n);
 r.completeWorkoutSession(a.id); assert.equal(r.startWorkoutSession(input).status,'completed');
 assert.equal(r.listWorkoutSessionsForDate(p.dateLocal).length,1);
});
test('session preserves template order through snapshot and next-set focus',()=>{
 const r=make(),xs=r.listStrengthExercises().slice(0,2).sort((a,b)=>b.id.localeCompare(a.id));
 const t=r.createWorkoutTemplate({name:'Order',exercises:xs.map(x=>({exerciseId:x.id,targetSets:2}))});
 const s=r.startWorkoutSession({dateLocal:'2026-11-10',title:t.name,templateId:t.id});
 const rr=createMemoryFoodRepository({snapshot:r.toSnapshot()});
 const rows=rr.listWorkoutSets(s.id); assert.deepEqual([...new Set(rows.map(x=>x.exerciseId))],xs.map(x=>x.id));
 assert.equal(m['domain/strength/setLogPrefill'].nextIncompleteSetId(rows),rows[0].id);
});
test('closed sessions cannot change through set APIs',()=>{
 const r=make(),s=r.startWorkoutSession({dateLocal:'2026-11-10',title:'A',templateId:'tmpl-upper-a'}),row=r.listWorkoutSets(s.id)[0];
 r.completeWorkoutSession(s.id); const before=r.toSnapshot();
 assert.throws(()=>r.completeWorkoutSet(row.id,{weightKg:10,reps:8}));
 assert.throws(()=>r.softDeleteWorkoutSet(row.id));
 assert.throws(()=>r.upsertWorkoutSet({sessionId:s.id,exerciseId:row.exerciseId,setIndex:1,reps:10}));
 assert.deepEqual(r.toSnapshot(),before);
});
test('invalid multi-field plan update is atomic; invalid calendar and clock rejected',()=>{
 const r=make(),p=plan(r);
 assert.throws(()=>r.updatePlannedActivity(p.id,{title:'Changed',cardioMinutes:-1}));
 assert.deepEqual(r.listPlannedActivitiesForDate(p.dateLocal)[0],p);
 assert.throws(()=>r.addPlannedActivity({dateLocal:'2026-02-30',kind:'rest',title:'Rest'}));
 assert.throws(()=>r.movePlannedActivity(p.id,{dateLocal:'2026-11-11',timeLocal:'25:99'}));
 assert.deepEqual(r.listPlannedActivitiesForDate(p.dateLocal)[0],p);
});
test('move appends to target day; repeat week copies plan but never history',async()=>{
 const r=make(),a=plan(r),b=plan(r,'2026-11-11');
 r.movePlannedActivity(a.id,{dateLocal:b.dateLocal});
 assert.deepEqual(r.listPlannedActivitiesForDate(b.dateLocal).map(x=>x.id),[b.id,a.id]);
 const before=r.toSnapshot(); let writes=0; r.setPersistHook(()=>writes++);
 const copies=r.repeatTrainingWeek('2026-11-09','2026-11-16'); await Promise.resolve();
 assert.equal(writes,1); assert.equal(copies.length,2); assert.ok(copies.every(x=>x.dateLocal==='2026-11-18'));
 assert.deepEqual(r.toSnapshot().workoutSessions,before.workoutSessions); assert.deepEqual(r.toSnapshot().workouts,before.workouts);
});
test('program replace validates deleted templates before removing current plan',()=>{
 const r=make(),p=plan(r); r.softDeleteWorkoutTemplate('tmpl-upper-a');
 assert.throws(()=>r.applyStrengthProgramWeek('2026-11-09',{replace:true}));
 assert.equal(r.listPlannedActivitiesForDate(p.dateLocal)[0].id,p.id);
});
test('manual sleep delete/restore retains ID and imported Garmin night',()=>{
 const r=make(),manual=r.upsertSleepNight({dateLocal:'2026-11-10',source:'user',sleepSec:0});
 assert.equal(r.getSleepForDate(manual.dateLocal).sleepSec,0);
 r.upsertSleepNight({dateLocal:manual.dateLocal,source:'garmin',sleepSec:26000});
 const removed=r.removeManualSleepNight(manual.dateLocal); r.restoreManualSleepNight(removed);
 assert.equal(r.getSleepForDate(manual.dateLocal).source,'garmin');
 assert.ok(r.toSnapshot().sleepNights.some(x=>x.id===manual.id));
});
test('partial sleep phases never fabricate total or zero; averages ignore missing nights',()=>{
 const {mapGarminSleepItem}=m['domain/garmin/mapSleep'];
 assert.equal(mapGarminSleepItem({calendarDate:'2026-11-10',deepSleepSeconds:3600}).sleepSec,null);
 const n=mapGarminSleepItem({calendarDate:'2026-11-10',deepSleepSeconds:3600,lightSleepSeconds:7200,remSleepSeconds:3600});
 assert.equal(n.sleepSec,14400);
 const summary=m['domain/sleepStats'].sleepWeekSummary([null,{sleepSec:25200,sleepScore:80},{sleepSec:null,sleepScore:60}]);
 assert.equal(summary.averageSec,25200); assert.equal(summary.knownCount,1); assert.equal(summary.averageScore,70);
 const rows=m['domain/sleepStats'].buildSleepStageRows({sleepSec:14400,deepSec:3600,lightSec:null,remSec:null,awakeSec:null});
 assert.equal(rows[0].barShare,0.25);
});
test('persistence error is visible and retry writes the full retained state',async()=>{
 const r=make(),events=[]; r.setPersistStatusListener(e=>events.push(e)); r.setPersistHook(()=>{throw new Error('disk full');});
 plan(r); await Promise.resolve(); assert.equal(events.at(-1).message,'disk full');
 let saved; r.setPersistHook(s=>{saved=s;}); r.flushPersist();
 assert.equal(events.at(-1),null); assert.equal(saved.plannedActivities.length,1);
});
test('rest deadline catches up after suspension; repetitions must be integers',()=>{
 const {restSecondsRemaining}=m['domain/strength/restTimer'];
 assert.equal(restSecondsRemaining(90000,60000),30); assert.equal(restSecondsRemaining(150000,60000),90); assert.equal(restSecondsRemaining(90000,200000),0);
 assert.equal(m['domain/strength/parseSetInput'].parseOptionalRepetitions('2,5').ok,false);
 const r=make(),s=r.startWorkoutSession({dateLocal:'2026-11-10',title:'A',templateId:'tmpl-upper-a'});
 assert.throws(()=>r.completeWorkoutSet(r.listWorkoutSets(s.id)[0].id,{weightKg:42.5,reps:2.5}));
});
