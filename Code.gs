const SHEET_NAME = 'Bookings';
const LAUNCH_DATE = '2026-12-04';
const COL = { ID:1, SUBMITTED:2, DATE:3, NAME:4, WHATSAPP:5, EMAIL:6, TYPE:7, LOCATION:8, TIME:9, GUESTS:10, IDEAS:11, NOTES:12, STATUS:13, PAYMENT:14, AMOUNT:15, REFERENCE:16, UPDATED:17 };

function doGet(e) {
  if ((e.parameter.action || '') !== 'availability') return json_({ok:false,message:'Unknown action'});
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sh) return json_({ok:false,message:'Bookings sheet not found'});
  const last = sh.getLastRow(); if (last < 2) return json_({ok:true,confirmedDates:[]});
  const rows = sh.getRange(2,1,last-1,COL.UPDATED).getValues();
  const confirmed = rows.filter(r => String(r[COL.STATUS-1]).trim().toLowerCase()==='confirmed' && r[COL.DATE-1])
    .map(r => dateKey_(r[COL.DATE-1]));
  return json_({ok:true,confirmedDates:[...new Set(confirmed)]});
}

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.action !== 'submitInquiry') return json_({ok:false,message:'Unknown action'});
    const required=['eventDate','name','whatsapp','eventType','location'];
    for (const k of required) if (!String(body[k]||'').trim()) return json_({ok:false,message:'Please complete all required fields.'});
    if (body.eventDate < LAUNCH_DATE) return json_({ok:false,message:'Bookings open from 4 December 2026.'});
    const sh=SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    if (!sh) return json_({ok:false,message:'Bookings sheet not found'});
    if (isConfirmed_(sh, body.eventDate)) return json_({ok:false,message:'That date has already been confirmed as booked. Please choose another date.'});
    const now=new Date();
    sh.appendRow([
      'K-'+Utilities.getUuid().slice(0,8).toUpperCase(), now, new Date(body.eventDate+'T12:00:00'), clean_(body.name), clean_(body.whatsapp), clean_(body.email), clean_(body.eventType), clean_(body.location), '', '', clean_(body.ideas), clean_(body.notes), 'New Inquiry', 'Not Sent', '', '', now
    ]);
    return json_({ok:true,message:'Inquiry received'});
  } catch(err) { return json_({ok:false,message:'Could not submit inquiry.'}); }
  finally { lock.releaseLock(); }
}

function onEdit(e) {
  const sh=e.range.getSheet(); if (sh.getName()!==SHEET_NAME || e.range.getColumn()!==COL.STATUS || e.range.getRow()<2) return;
  if (String(e.value||'').trim().toLowerCase()!=='confirmed') return;
  const date=sh.getRange(e.range.getRow(),COL.DATE).getValue(); if (!date) return;
  const target=dateKey_(date), last=sh.getLastRow(), rows=sh.getRange(2,1,last-1,COL.STATUS).getValues();
  let count=0; rows.forEach(r=>{if(r[COL.DATE-1] && dateKey_(r[COL.DATE-1])===target && String(r[COL.STATUS-1]).trim().toLowerCase()==='confirmed')count++});
  if(count>1){e.range.setValue(e.oldValue || 'Contacted');SpreadsheetApp.getActive().toast('That date already has a confirmed KEEPS booking. Confirmation was not saved.','KEEPS ♡',8)}
}

function isConfirmed_(sh,dateString){const last=sh.getLastRow();if(last<2)return false;const rows=sh.getRange(2,1,last-1,COL.STATUS).getValues();return rows.some(r=>r[COL.DATE-1]&&dateKey_(r[COL.DATE-1])===dateString&&String(r[COL.STATUS-1]).trim().toLowerCase()==='confirmed')}
function dateKey_(v){const d=v instanceof Date?v:new Date(v);return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM-dd')}
function clean_(v){return String(v||'').trim().slice(0,1000)}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
