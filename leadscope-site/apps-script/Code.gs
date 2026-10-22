var NOTIFY_EMAIL = 'manish.k@leadscope.in';

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'bad payload' });
  }

  if (data.type === 'pageview') {
    logPageview(data);
    return json({ ok: true });
  }

  if (data.company_url) {
    return json({ ok: true });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheets()[0];

  if (sh.getLastRow() === 0) {
    sh.appendRow(['Submitted at', 'Name', 'Email', 'Company', 'Website', 'Role', 'Stage', 'Interested in', 'Challenge', 'Source']);
    sh.getRange(1, 1, 1, 10).setFontWeight('bold');
  }

  sh.appendRow([
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'),
    data.name || '',
    data.email || '',
    data.company || '',
    data.website || '',
    data.role || '',
    data.stage || '',
    (data.interests || []).join(', '),
    data.challenge || '',
    data.source || ''
  ]);

  var subject = 'Growth call request: ' + (data.company || data.name || 'New lead');
  var body = [
    'New lead from leadscope.in',
    '',
    'Name: ' + (data.name || '-'),
    'Email: ' + (data.email || '-'),
    'Company: ' + (data.company || '-'),
    'Website: ' + (data.website || '-'),
    'Role: ' + (data.role || '-'),
    'Stage: ' + (data.stage || '-'),
    'Interested in: ' + ((data.interests || []).join(', ') || '-'),
    '',
    'Biggest GTM challenge:',
    data.challenge || '-',
    '',
    '---',
    'Submitted at: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
  ].join('\n');

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);

  return json({ ok: true });
}

function pageviewSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Pageviews');
  if (!sh) {
    sh = ss.insertSheet('Pageviews');
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Date', 'Timestamp', 'Path', 'Referrer']);
    sh.getRange(1, 1, 1, 4).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function logPageview(d) {
  var sh = pageviewSheet_();
  if (sh.getLastRow() > 40000) return;
  var now = new Date();
  var tz = Session.getScriptTimeZone();
  sh.appendRow([
    Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
    Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss'),
    String(d.path || '/').slice(0, 300),
    String(d.ref || '').slice(0, 300)
  ]);
}

function dayKey_(dt) {
  return Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function buildStats_() {
  var tz = Session.getScriptTimeZone();
  var sh;
  try {
    sh = pageviewSheet_();
  } catch (err) {
    return { ok: false, error: String(err) };
  }

  var values = sh.getDataRange().getValues();
  var byDay = {};
  var byPath = {};
  var byRef = {};
  var total = 0;

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row || !row[0]) continue;

    var key = (row[0] instanceof Date) ? dayKey_(row[0]) : String(row[0]).slice(0, 10);
    byDay[key] = (byDay[key] || 0) + 1;
    total++;

    var p = String(row[2] || '/').split('?')[0].split('#')[0];
    if (p.length > 1 && p.charAt(p.length - 1) === '/') p = p.slice(0, -1);
    if (!p) p = '/';
    byPath[p] = (byPath[p] || 0) + 1;

    var r = String(row[3] || '').trim();
    var host = 'Direct';
    if (r) {
      var m = r.match(/^https?:\/\/([^\/]+)/i);
      if (m) host = m[1].replace(/^www\./, '').toLowerCase();
      else host = r.split('/')[0].toLowerCase();
      if (host === 'leadscope.in' || host === 'www.leadscope.in') host = 'Direct';
    }
    byRef[host] = (byRef[host] || 0) + 1;
  }

  var days = [];
  var now = new Date();
  var today = null;
  var yesterday = 0;
  var last7 = 0;
  var last30 = 0;

  for (var k = 29; k >= 0; k--) {
    var d = new Date(now.getTime() - k * 86400000);
    var dk = dayKey_(d);
    var n = byDay[dk] || 0;
    days.push({ d: dk, n: n });
    last30 += n;
    if (k < 7) last7 += n;
    if (k === 0) today = n;
    if (k === 1) yesterday = n;
  }

  function top(map, limit) {
    var out = [];
    for (var key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key)) out.push({ k: key, n: map[key] });
    }
    out.sort(function (a, b) { return b.n - a.n || (a.k < b.k ? -1 : 1); });
    return out.slice(0, limit);
  }

  return {
    ok: true,
    updated: Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm:ss'),
    today: today === null ? 0 : today,
    yesterday: yesterday,
    last7: last7,
    last30: last30,
    all: total,
    days: days,
    paths: top(byPath, 10),
    refs: top(byRef, 8)
  };
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var cb = String(p.callback || '').replace(/[^A-Za-z0-9_$.]/g, '');
  var payload = JSON.stringify(buildStats_());
  if (cb) {
    return ContentService.createTextOutput(cb + '(' + payload + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json({ ok: true, hint: 'Use ?callback=name for JSONP' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
