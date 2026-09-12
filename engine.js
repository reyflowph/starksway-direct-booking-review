(function(root){
const DAY=86400000;
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return null;const d=new Date(v+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v?d:null;}
function phParts(now=new Date(),timezone='Asia/Manila'){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(now);return Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));}
function phToday(now=new Date(),timezone='Asia/Manila'){const p=phParts(now,timezone);return `${p.year}-${p.month}-${p.day}`;}
function phMinutes(now=new Date(),timezone='Asia/Manila'){const p=phParts(now,timezone);return Number(p.hour)*60+Number(p.minute);}
function cutoffMinutes(value){const match=/^(\d{2}):(\d{2})$/.exec(value||'');return match?Number(match[1])*60+Number(match[2]):null;}
function validateStayStart(checkIn,now=new Date(),c){const current=phToday(now,c.timezone);if(!date(checkIn))return {valid:false,reason:'Choose a valid check-in date.'};if(checkIn<current)return {valid:false,reason:'Check-in cannot be before today in Philippine time.'};if(checkIn>current)return {valid:true,reason:null};if(!c.sameDayAllowed)return {valid:false,reason:'Same-day booking is not available.'};const cutoff=cutoffMinutes(c.sameDayCutoff);if(cutoff!=null&&phMinutes(now,c.timezone)>cutoff)return {valid:false,reason:`Same-day booking closed at ${c.sameDayCutoff} Philippine time.`};return {valid:true,reason:null};}
function etaWindow(checkIn,now=new Date(),c){const current=phToday(now,c.timezone);if(checkIn!==current)return {min:c.checkIn,value:c.checkIn,sameDayLate:false};const mins=phMinutes(now,c.timezone);const base=cutoffMinutes(c.checkIn)||840;if(mins<=base)return {min:c.checkIn,value:c.checkIn,sameDayLate:false};const rounded=Math.min(1439,Math.ceil(mins/5)*5),hh=String(Math.floor(rounded/60)).padStart(2,'0'),mm=String(rounded%60).padStart(2,'0');return {min:`${hh}:${mm}`,value:'',sameDayLate:true};}
function nights(a,b){return date(a)&&date(b)?Math.round((date(b)-date(a))/DAY):0;}
function addDay(v,n=1){const d=date(v);return d?new Date(+d+n*DAY).toISOString().slice(0,10):null;}
function overlaps(a,b,c,d){return a<d&&c<b;}
function money(n){return n==null?'Pending':new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(n);}
function rate(room,day,c){
 if(c.overrides[room.id]?.[day]!=null)return {amount:c.overrides[room.id][day],label:'Manual date rate'};
 if(c.holidays.includes(day))return {amount:room.peak,label:'Holiday rate'};
 const weekday=date(day).getUTCDay();
 if(weekday===5||weekday===6)return {amount:room.peak,label:'Friday / Saturday rate'};
 return {amount:room.regular,label:weekday===0?'Sunday regular rate':'Regular rate',holidayCheckPending:!c.holidayCalendarConfirmed};
}
function commitmentBlocks(entry){return ['confirmed','payment_verified'].includes(entry.status);}
function roomAvailable(roomId,checkIn,checkOut,data,extra=[]){
 const all=[...data.availability.confirmedBookings,...data.availability.blocked,...extra].filter(commitmentBlocks);
 const conflict=all.find(x=>overlaps(checkIn,checkOut,x.checkIn,x.checkOut)&&(x.kind==='exclusive'||x.resourceId===roomId));
 return {available:!conflict,conflict:conflict||null,source:data.config.inventoryConnected?'live':'review-seed'};
}
function exclusiveAvailable(checkIn,checkOut,data,extra=[]){
 const all=[...data.availability.confirmedBookings,...data.availability.blocked,...extra].filter(commitmentBlocks);
 const conflict=all.find(x=>overlaps(checkIn,checkOut,x.checkIn,x.checkOut)&&(x.kind==='exclusive'||data.exclusive.resourceIds.includes(x.resourceId)));
 return {available:!conflict,conflict:conflict||null,source:data.config.inventoryConnected?'live':'review-seed'};
}
function resourceAvailable(resourceId,checkIn,checkOut,data,extra=[]){const all=[...data.availability.confirmedBookings,...data.availability.blocked,...extra].filter(commitmentBlocks);const conflict=all.find(x=>overlaps(checkIn,checkOut,x.checkIn,x.checkOut)&&(x.kind==='exclusive'||x.resourceId===resourceId));return {available:!conflict,conflict:conflict||null,source:data.config.inventoryConnected?'live':'review-seed'};}
function exclusiveCommitmentResources(data){return [...data.exclusive.resourceIds];}
function chargeableGuests(item){return Number(item.adults||0)+(item.childAges||[]).filter(a=>a!==''&&a!=null&&Number(a)>=2).length;}
function itemQuote(item,state,data){
 const room=item.kind==='exclusive'?data.exclusive:data.rooms.find(r=>r.id===item.resourceId);const count=nights(state.checkIn,state.checkOut);const lines=[];let roomSubtotal=0;
 for(let i=0;i<count;i++){const day=addDay(state.checkIn,i);const r=item.kind==='exclusive'?{amount:room.regular,label:'Exclusive rental rate'}:rate(room,day,data.config);lines.push({day,...r});roomSubtotal+=r.amount;}
 const chargeable=chargeableGuests(item);const excess=Math.max(0,chargeable-room.baseCapacity);const overMax=room.maxCapacity!=null&&chargeable>room.maxCapacity;
 return {...item,room,lines,roomSubtotal,chargeable,excess,overMax,excessKnownAmount:excess*data.config.extraGuestPrice,excessPerOccurrence:excess*data.config.extraGuestPrice,excessTotal:null,excessMultipliedByNights:false,excessIncludedInDeposit:false};
}
function quote(state,data){
 const items=state.items.map(i=>itemQuote(i,state,data));const accommodationTotal=items.reduce((n,i)=>n+i.roomSubtotal,0);const deposit=Math.round(accommodationTotal*data.config.depositPercent)/100;const balance=accommodationTotal-deposit;
 const totalAdults=items.reduce((n,i)=>n+Number(i.adults||0),0),totalChildren=items.reduce((n,i)=>n+(i.childAges||[]).length,0);
 const eco={adults:totalAdults*data.config.ecoAdult,children:totalChildren*data.config.ecoChild,total:totalAdults*data.config.ecoAdult+totalChildren*data.config.ecoChild,inOnlineTotal:false,childBracketPending:data.config.ecoChildBracket==null};
 const excessItems=items.filter(i=>i.excess>0),excessKnownTotal=excessItems.reduce((n,i)=>n+i.excessKnownAmount,0);
 return {items,accommodationTotal,deposit,balance,onlineTotal:deposit,eco,excessItems,excessKnownTotal,excessIncludedInDeposit:false,warnings:[!data.config.holidayCalendarConfirmed?'Holiday calendar requires final backend verification.':null,excessItems.length?'Excess guest collection timing and down-payment treatment await final configuration.':null,!data.config.inventoryConnected?'Final live availability is rechecked after payment proof submission.':null].filter(Boolean)};
}
function maskGcash(value){const digits=String(value||'').replace(/\D/g,'');return digits.length>=8?`${digits.slice(0,4)} ${digits.slice(4,7)} ••••`:'•••• ••• ••••';}
function maskBank(value){const digits=String(value||'').replace(/\D/g,'');return `••••••••••${digits.slice(-4)}`;}
function paymentPresentation(mode,payment){
 const isPublic=mode==='public_review',isPrivate=mode==='private_client_review',isProduction=mode==='production';
 return {mode,isPublic,isPrivate,isProduction,review:!isProduction,fullDetails:isPrivate||isProduction,qrVisible:!isPublic&&Boolean(payment.gcash.qrAsset),gcash:{...payment.gcash,accountNumber:isPublic?maskGcash(payment.gcash.accountNumber):payment.gcash.accountNumber,qrAsset:isPublic?null:payment.gcash.qrAsset},bank:{...payment.bank,accountNumber:isPublic?maskBank(payment.bank.accountNumber):payment.bank.accountNumber},card:{...payment.card}};
}
function allocation(state,data){
 const assignedAdults=state.items.reduce((n,i)=>n+Number(i.adults||0),0);
 const allChildIndexes=state.items.flatMap(i=>i.childIndexes||[]);
 const childCounts=allChildIndexes.reduce((map,index)=>(map[index]=(map[index]||0)+1,map),{});
 const duplicateChildIndexes=Object.keys(childCounts).filter(index=>childCounts[index]>1).map(Number);
 const unassignedChildIndexes=state.childAges.map((_,index)=>index).filter(index=>!childCounts[index]);
 const assignedChildren=new Set(allChildIndexes).size;
 const capacityErrors=state.items.map(i=>itemQuote(i,state,data)).filter(i=>i.overMax).map(i=>`${i.room.name} allows up to ${i.room.maxCapacity} guests age 2+ in this configuration.`);
 const adultsLeft=Number(state.adults||0)-assignedAdults;
 const childrenLeft=state.childAges.length-assignedChildren;
 return {assignedAdults,assignedChildren,adultsLeft,childrenLeft,duplicateChildIndexes,unassignedChildIndexes,capacityErrors,allAssigned:adultsLeft===0&&childrenLeft===0&&!duplicateChildIndexes.length&&!capacityErrors.length};
}
function validation(state,data,now=new Date()){const errors=[];const count=nights(state.checkIn,state.checkOut),start=validateStayStart(state.checkIn,now,data.config);if(!start.valid)errors.push(start.reason);if(!date(state.checkOut)||count<1)errors.push('Check-out must be after check-in.');if(!state.items.length)errors.push('Add at least one stay.');state.items.forEach(i=>{const q=itemQuote(i,state,data);if(q.overMax)errors.push(`${q.room.name} allows up to ${q.room.maxCapacity} guests in this configuration.`);if((i.childAges||[]).some(a=>a===''))errors.push(`Select every child age for ${q.room.name}.`);});return errors;}
const paymentTransitions={awaiting_dp:['proof_submitted'],proof_submitted:['verification_pending'],verification_pending:['payment_verified','availability_conflict'],availability_conflict:['refund_required','rescheduled'],refund_required:['refunded'],payment_verified:[]};
const bookingTransitions={draft:['submitted'],submitted:['pending_payment_verification'],pending_payment_verification:['confirmed','availability_conflict'],availability_conflict:['rescheduled','refund_required'],confirmed:['cancelled','rescheduled','no_show']};
function transition(map,current,next){if(!map[current]?.includes(next))throw Error(`Invalid transition: ${current} → ${next}`);return next;}
const api={date,phParts,phToday,phMinutes,cutoffMinutes,validateStayStart,etaWindow,nights,addDay,overlaps,money,rate,roomAvailable,resourceAvailable,exclusiveAvailable,exclusiveCommitmentResources,chargeableGuests,itemQuote,quote,allocation,validation,maskGcash,maskBank,paymentPresentation,paymentTransitions,bookingTransitions,transition};root.StarkswayEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);