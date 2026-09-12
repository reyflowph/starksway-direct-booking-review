/* Review-only availability fixtures. Migrate these records to Supabase before production. */
(function(root){
const resources=[
 {id:'DAY_TOUR',name:'Day Tour',kind:'manual',public:false},
 {id:'NIGHT_TOUR',name:'Night Tour',kind:'manual',public:false},
 {id:'FUNCTION_HALL',name:'Function Hall',kind:'manual',public:false}
];
const room=(id,resourceId,checkIn,checkOut=checkIn)=>({id,kind:'room',resourceId,checkIn,checkOut:next(checkOut),status:'confirmed',source:'client_colored_calendar'});
const manual=(id,resourceId,checkIn,checkOut=checkIn)=>({id,kind:'manual',resourceId,checkIn,checkOut:next(checkOut),status:'confirmed',source:'client_colored_calendar'});
function next(day){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10)}
const confirmedBookings=[
 // September 2026 — every colored cell supplied by the client is treated as confirmed.
 room('seed-hawthorne-2026-09-01','hawthorne','2026-09-01'),
 // Mini House colored run: Sep 2 through Sep 10 inclusive.
 {id:'seed-mini-house-2026-09-02-10',kind:'room',resourceId:'mini-house',checkIn:'2026-09-02',checkOut:'2026-09-11',status:'confirmed',source:'client_colored_calendar'},
 room('seed-hawthorne-2026-09-03','hawthorne','2026-09-03'),
 ...['vegas','reno','tahoe','hawthorne','carson','yerington','henderson','kingston'].map(resourceId=>room(`seed-${resourceId}-2026-09-05`,resourceId,'2026-09-05')),
 room('seed-hawthorne-2026-09-06','hawthorne','2026-09-06'),
 room('seed-tahoe-2026-09-09','tahoe','2026-09-09'),
 {id:'seed-carson-2026-09-10-11',kind:'room',resourceId:'carson',checkIn:'2026-09-10',checkOut:'2026-09-12',status:'confirmed',source:'client_colored_calendar'},
 room('seed-vegas-2026-09-12','vegas','2026-09-12'),
 {id:'seed-hawthorne-2026-09-12-13',kind:'room',resourceId:'hawthorne',checkIn:'2026-09-12',checkOut:'2026-09-14',status:'confirmed',source:'client_colored_calendar'},
 manual('seed-day-tour-2026-09-12','DAY_TOUR','2026-09-12'),
 room('seed-vegas-2026-09-15','vegas','2026-09-15'),
 room('seed-henderson-2026-09-15','henderson','2026-09-15'),
 {id:'seed-mini-house-2026-09-17-18',kind:'room',resourceId:'mini-house',checkIn:'2026-09-17',checkOut:'2026-09-19',status:'confirmed',source:'client_colored_calendar'},
 room('seed-kingston-2026-09-18','kingston','2026-09-18'),
 {id:'seed-exclusive-2026-09-19',kind:'exclusive',checkIn:'2026-09-19',checkOut:'2026-09-20',status:'confirmed',source:'client_written_correction'},
 room('seed-carson-2026-09-26','carson','2026-09-26'),
 room('seed-kingston-2026-09-26','kingston','2026-09-26'),
 room('seed-hawthorne-2026-09-27','hawthorne','2026-09-27'),

 // October 2026.
 {id:'seed-henderson-2026-10-10',kind:'room',resourceId:'henderson',checkIn:'2026-10-10',checkOut:'2026-10-11',status:'confirmed',source:'client_written_correction'},
 room('seed-vegas-2026-10-11','vegas','2026-10-11'),
 room('seed-tahoe-2026-10-30','tahoe','2026-10-30'),
 manual('seed-function-hall-2026-10-30','FUNCTION_HALL','2026-10-30'),

 // November 2026.
 room('seed-kingston-2026-11-14','kingston','2026-11-14')
];
const needsManualVerification=[];
const seed={resources,confirmedBookings,blocked:[],needsManualVerification};
root.StarkswayAvailabilitySeed=seed;if(typeof module!=='undefined')module.exports=seed;
})(typeof window!=='undefined'?window:globalThis);