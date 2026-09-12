/* Starksway V2 confirmed public data. Operational secrets stay server-side. */
(function(root){
const seed=root.StarkswayAvailabilitySeed||(typeof require!=='undefined'?require('./availability-seed.js'):null);
const gallery=(id,count)=>Array.from({length:count},(_,i)=>ASSET_MAP[`assets/stays/${id}-${String(i+1).padStart(2,'0')}.webp`]);
const rooms=[
 ['henderson','Henderson','Teepee XL',3200,3400,8,['4 queen beds'],['Air-conditioned','Bonfire'],2],
 ['yerington','Yerington','Teepee stay',2000,2400,5,['Double-deck bed','Single bed'],['Non-air-conditioned','Bonfire'],2],
 ['hawthorne','Hawthorne','Teepee Couples',1800,1900,2,['Double bed'],['Air-conditioned'],3],
 ['carson','Carson','Teepee stay',2000,2400,5,['Queen bed','King bed'],['Non-air-conditioned','Bonfire'],3],
 ['kingston','Kingston','Group stay',6500,7500,15,['3 double-deck beds','2 king beds'],['Air-conditioned','2 toilets','Refrigerator'],7],
 ['mini-house','Mini House','Private retreat',3500,4300,4,['Queen bed','Sofa / foam bed'],['Air-conditioned','Private jacuzzi','Own bathroom','Refrigerator'],5],
 ['vegas','Vegas','Two-bedroom stay',2800,3200,6,['Queen bed','Double-deck bed'],['2 bedrooms','Own bathroom','Air-conditioned'],5],
 ['tahoe','Tahoe','Two-bedroom stay',2800,3200,6,['Queen bed','Double-deck bed'],['2 bedrooms','Own bathroom','Air-conditioned'],5],
 ['reno','Reno','Two-bedroom stay',2800,3200,6,['Queen bed','Double-deck bed'],['2 bedrooms','Own bathroom','Air-conditioned'],5]
].map(([id,name,type,regular,peak,baseCapacity,beds,features,count])=>({id,name,type,regular,peak,baseCapacity,maxCapacity:baseCapacity+2,unitCount:1,beds,features,images:gallery(id,count)}));
rooms.find(r=>r.id==='mini-house').cover=ASSET_MAP['assets/stays/mini-house-cover-v22.png'];
rooms.find(r=>r.id==='kingston').cover=ASSET_MAP['assets/stays/kingston-cover-v22.png'];
const config={
 mode:'review',reviewControls:true,review:{paymentMode:'public_review',liveBooking:false,livePaymentVerification:false,liveInventoryLocking:false,liveEmail:false},timezone:'Asia/Manila',checkIn:'14:00',checkOut:'12:00',
 sundayRate:'regular',multiNightAllowed:true,sameDayAllowed:true,sameDayCutoff:'23:59',
 holidayCalendarConfirmed:true,holidaySource:'Philippines 2026 national regular and special non-working holidays; local special holidays remain admin-configurable',holidays:['2026-01-01','2026-02-17','2026-03-20','2026-04-02','2026-04-03','2026-04-04','2026-04-09','2026-05-01','2026-05-27','2026-06-12','2026-08-21','2026-08-31','2026-11-01','2026-11-02','2026-11-30','2026-12-08','2026-12-24','2026-12-25','2026-12-30','2026-12-31'],overrides:{},promotions:[],
 extraGuestPrice:300,extraGuestMinAge:2,extraGuestChargeFrequency:null,extraGuestIncludedInDeposit:null,
 depositPercent:50,inventoryConnected:false,ecoCollection:'on_site_or_tourism',ecoAdult:50,ecoChild:30,ecoChildBracket:null,
 payment:{
  gcash:{enabled:true,flow:'manual',label:'GCash',accountName:'Kirsten May Menosa',accountNumber:'0952 448 ••••',qrAsset:null},
  bank:{enabled:true,flow:'manual',label:'RCBC Bank Transfer',bankName:'RCBC',accountName:'RUFERT ASAHAN',accountNumber:'••••••••••8469'},
  card:{enabled:false,flow:'gateway',label:'Credit / debit card',brands:'Visa · Mastercard · supported cards',note:"Available once Starksway's merchant account is connected."}
 },
 cashNotice:'Cash reservations must be arranged and paid onsite at Starksway Resort. Cash/manual reservations will later be created through the Admin Dashboard.',
 seedYear:2026
};
const availability={blocked:seed.blocked,confirmedBookings:seed.confirmedBookings,needsManualVerification:seed.needsManualVerification};
const internalResources=seed.resources;
const exclusiveResourceIds=[...rooms.map(r=>r.id),...internalResources.map(r=>r.id)];
const exclusive={id:'exclusive-resort',name:'Exclusive Resort Rental',type:'Whole-resort stay',regular:28000,peak:28000,baseCapacity:57,maxCapacity:null,unitCount:1,beds:['All 9 sleeping accommodations'],features:['Private use of all 9 units','Function Hall included','Up to 57 sleeping guests'],images:[ASSET_MAP['assets/amenities-pool-night.webp']],resourceIds:exclusiveResourceIds};
const inclusions=['Free pool access','Free non-heated jacuzzi access','Free use of kitchen','Free Wi-Fi','Free use of griller','Free use of poolside cottage','No corkage fee','Pet-friendly','Free secured parking inside the resort','No resort entrance fee — mandatory ECO Tourism Fee applies separately'];
const fees=[
 {id:'water',name:'Mineral water',display:'₱50 / container',price:50,unit:'container',collection:'on_site'},
 {id:'towel',name:'Towel or blanket',display:'₱100 / piece or request',price:100,unit:'request',collection:'on_site'},
 {id:'pillow',name:'Extra pillow',display:'₱50 / piece',price:50,unit:'piece',collection:'on_site'},
 {id:'foam',name:'Extra foam bed',display:'₱150 / piece',price:150,unit:'piece',collection:'on_site'},
 {id:'appliance',name:'Guest electric appliance',display:'₱100 / applicable appliance',price:100,unit:'appliance',collection:'on_site'},
 {id:'gas',name:'Gasul usage',display:'₱150–₱300 / room',price:null,collection:'on_site',note:'Kitchen use is free; actual gas usage is assessed at the resort.'},
 {id:'pet',name:'Pet security deposit',display:'₱1,000 refundable upon check-in',price:1000,collection:'informational'},
 {id:'videoke',name:'Videoke',display:'₱5 / song',price:5,collection:'on_site',note:'Available until 10:00 PM.'},
 {id:'billiards',name:'Billiards',display:'₱100 / hour',price:100,collection:'on_site'},
 {id:'extended',name:'Extended time',display:'₱150, subject to availability',price:150,collection:'on_site',note:'Arrange at the resort; not charged per hour.'}
];
const rules=['Swimming pool resort only — no beach','Pool access until 12:00 midnight','Quiet time starts at 10:00 PM','Bring towels and toiletries','Bring dinnerware or disposable wares','Bring food'];
const policies=[
 ['Reservation confirmation','First come, first served upon receipt and verification of the required 50% down payment. No pencil or tentative bookings. Payment submission does not temporarily hold inventory.'],
 ['Cancellation','Once the down payment has been made, it is strictly non-refundable in case of cancellation.'],
 ['Rescheduling','Request at least 1 week before the reservation. Only one reschedule per booking, with a ₱500 fee. The new schedule must fall within the following month. Requests 2 days before or on the reservation date are not eligible for rebooking.'],
 ['Typhoon','If there is a typhoon on the reservation date, guests may reschedule.'],
 ['No call / no show','The reservation is forfeited.']
];
const data={rooms,accommodations:rooms,exclusive,internalResources,config,availability,inclusions,fees,rules,policies};root.StarkswayData=data;if(typeof module!=='undefined')module.exports=data;
})(typeof window!=='undefined'?window:globalThis);