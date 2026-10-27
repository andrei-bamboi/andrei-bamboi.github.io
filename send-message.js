// ./send_message — a terminal-style "secure transmission" contact form.
// Static site (GitHub Pages) → no backend by default: the message is handed off to
// Gmail / the visitor's mail app / clipboard. To deliver straight to your inbox instead,
// create a free form at https://formspree.io and paste its URL into ENDPOINT below.
(function () {
  var TO = 'bamboi.andrei@gmail.com';
  var ENDPOINT = ''; // e.g. 'https://formspree.io/f/abcdwxyz'

  var C = {
    bg: 'hsl(216 28% 7%)', card: 'hsl(215 21% 11%)', border: 'hsl(212 12% 21%)',
    fg: 'hsl(0 0% 96%)', muted: 'hsl(212 9% 58%)', green: 'hsl(130 64% 53%)',
    blue: 'hsl(212 100% 67%)', red: 'hsl(0 84% 60%)', yellow: 'hsl(45 90% 60%)'
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function sp(t, col) { return '<span style="color:' + col + '">' + esc(t) + '</span>'; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function rnd(a, z) { return Math.floor(a + Math.random() * (z - a + 1)); }
  function hex(n) { var o = ''; while (o.length < n) o += Math.random().toString(16).slice(2); return o.slice(0, n); }

  // ---------- UI ----------
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:110;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.65);backdrop-filter:blur(3px)';
  ov.innerHTML =
    '<div role="dialog" aria-label="Send a message" style="width:100%;max-width:760px;height:min(600px,88vh);display:flex;flex-direction:column;background:' + C.bg + ';border:1px solid ' + C.border + ';box-shadow:0 0 0 1px hsl(130 64% 53% / .08),0 24px 70px rgba(0,0,0,.65);font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:13px;color:' + C.fg + ';position:relative;overflow:hidden">' +
      '<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid ' + C.border + ';background:' + C.card + '">' +
        '<button data-x aria-label="Close" style="width:12px;height:12px;border-radius:50%;background:hsl(0 84% 60% / .8);border:0;cursor:pointer"></button>' +
        '<span style="width:12px;height:12px;border-radius:50%;background:hsl(45 90% 55% / .8)"></span>' +
        '<span style="width:12px;height:12px;border-radius:50%;background:hsl(130 64% 45% / .8)"></span>' +
        '<span style="margin-left:12px;font-size:12px;color:' + C.muted + ';letter-spacing:.1em">msgctl — secure channel — ' + esc(TO.split('@')[0]) + '@inbox</span>' +
        '<span data-lock style="margin-left:auto;font-size:11px;color:' + C.yellow + '">○ handshaking</span>' +
      '</div>' +
      '<div data-scr style="flex:1;overflow-y:auto;padding:14px 16px;line-height:1.6;cursor:text"><div data-o style="white-space:pre-wrap;word-break:break-word"></div></div>' +
      '<div style="padding:6px 12px;border-top:1px solid ' + C.border + ';background:' + C.card + ';font-size:11px;color:' + C.muted + ';display:flex;gap:16px;flex-wrap:wrap">' +
        '<span>Enter ↵ next</span><span>Ctrl/⌘+Enter send message body</span><span>Esc abort</span><span style="margin-left:auto">cipher: X25519 · AES-256-GCM</span>' +
      '</div>' +
      '<div data-scan style="pointer-events:none;position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.12) 2px,rgba(0,0,0,.12) 4px)"></div>' +
    '</div>';
  document.body.appendChild(ov);
  var out = ov.querySelector('[data-o]'), scr = ov.querySelector('[data-scr]'), lock = ov.querySelector('[data-lock]');

  function line(html) { var d = document.createElement('div'); d.innerHTML = html === '' ? '&nbsp;' : html; out.appendChild(d); scr.scrollTop = scr.scrollHeight; return d; }
  var run = 0; // bumps on every open/close so stale async flows stop
  function alive(id) { if (id !== run) throw 'aborted'; }

  async function type(html, id, speed) {
    var d = line(''), tmp = document.createElement('div'); tmp.innerHTML = html;
    var text = tmp.textContent;
    for (var i = 1; i <= text.length; i += 2) { alive(id); d.textContent = text.slice(0, i); await sleep(speed || 8); }
    d.innerHTML = html; scr.scrollTop = scr.scrollHeight;
  }
  async function spin(label, ms, id) {
    var fr = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏', d = line(''), t0 = Date.now(), i = 0;
    while (Date.now() - t0 < ms) { alive(id); d.innerHTML = sp(fr[i++ % 10], C.blue) + ' ' + esc(label); scr.scrollTop = scr.scrollHeight; await sleep(70); }
    d.innerHTML = sp('[ OK ]', C.green) + ' ' + esc(label);
  }
  async function bar(label, ms, id) {
    var d = line('');
    for (var i = 0; i <= 24; i++) { alive(id); d.innerHTML = esc(label) + ' ' + sp('█'.repeat(i), C.green) + sp('░'.repeat(24 - i), C.muted) + ' ' + Math.round(i / 24 * 100) + '%'; await sleep(ms / 24); }
  }

  // Ask one question, terminal style. Resolves with the value.
  function ask(q, id) {
    return new Promise(function (resolve, reject) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:flex-start;margin-top:2px';
      row.innerHTML = '<span style="white-space:nowrap">' + sp('?', C.yellow) + ' ' + sp(q.label, C.blue) + ' ' + sp('›', C.muted) + '</span>';
      var inp = document.createElement(q.multi ? 'textarea' : 'input');
      inp.setAttribute('aria-label', q.label);
      inp.placeholder = q.placeholder || '';
      if (q.type) inp.type = q.type;
      inp.autocomplete = q.autocomplete || 'off';
      inp.spellcheck = !!q.multi;
      inp.style.cssText = 'flex:1;min-width:0;background:transparent;border:0;outline:0;color:' + C.fg + ';font:inherit;caret-color:' + C.green + ';padding:0;resize:none;line-height:1.6' + (q.multi ? ';min-height:6.4em;border-left:2px solid ' + C.border + ';padding-left:8px' : '');
      if (q.value) inp.value = q.value;
      row.appendChild(inp); out.appendChild(row); scr.scrollTop = scr.scrollHeight;
      setTimeout(function () { inp.focus(); }, 0);
      var err = null;
      inp.addEventListener('keydown', function (e) {
        if (id !== run) return reject('aborted');
        var submit = q.multi ? (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) : e.key === 'Enter';
        if (!submit) return;
        e.preventDefault();
        var v = inp.value.trim() || (q.def || '');
        var problem = q.validate ? q.validate(v) : (!v ? 'required' : '');
        if (problem) {
          if (!err) { err = document.createElement('div'); out.appendChild(err); }
          err.innerHTML = sp('  ✗ ' + problem, C.red); scr.scrollTop = scr.scrollHeight; return;
        }
        if (err) err.remove();
        row.innerHTML = sp('✔', C.green) + ' ' + sp(q.label, C.blue) + ' ' + sp('›', C.muted) + ' ' +
          (q.multi ? '<div style="border-left:2px solid ' + C.border + ';padding-left:8px;margin:2px 0 0 14px">' + esc(v) + '</div>' : esc(q.mask ? v : v));
        resolve(v);
      });
    });
  }

  function jsonView(o) {
    var keys = Object.keys(o);
    return '{\n' + keys.map(function (k, i) {
      var v = String(o[k]); if (v.length > 120) v = v.slice(0, 117) + '…';
      return '  ' + sp('"' + k + '"', C.blue) + ': ' + sp(JSON.stringify(v), C.green) + (i < keys.length - 1 ? ',' : '');
    }).join('\n') + '\n}';
  }

  function hexdump(str) {
    var bytes = new TextEncoder().encode(str).slice(0, 64), rows = [];
    for (var i = 0; i < bytes.length; i += 16) {
      var chunk = Array.prototype.slice.call(bytes, i, i + 16);
      var hx = chunk.map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join(' ');
      var asc = chunk.map(function (b) { return b >= 32 && b < 127 ? String.fromCharCode(b) : '.'; }).join('');
      rows.push(sp(('0000000' + i.toString(16)).slice(-8), C.muted) + '  ' + esc(hx + '   '.repeat(16 - chunk.length)) + '  ' + sp('|' + asc + '|', C.muted));
    }
    return rows.join('\n');
  }

  function btn(label, onClick, primary) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'font:inherit;font-size:12px;padding:6px 12px;margin:0 8px 8px 0;cursor:pointer;background:transparent;border:1px solid ' + (primary ? C.green : C.border) + ';color:' + (primary ? C.green : C.fg) + ';transition:all .1s';
    b.onmouseenter = function () { b.style.background = primary ? C.green : C.fg; b.style.color = C.bg; };
    b.onmouseleave = function () { b.style.background = 'transparent'; b.style.color = primary ? C.green : C.fg; };
    b.onclick = onClick;
    return b;
  }

  // ---------- flow ----------
  async function flow() {
    var id = ++run;
    out.innerHTML = '';
    lock.textContent = '○ handshaking'; lock.style.color = C.yellow;
    try {
      await type(sp('$ ', C.green) + 'msgctl --to=andrei --encrypt --priority=high', id, 10);
      await spin('Resolving route: you → edge → ' + TO.split('@')[1], 380, id);
      await spin('Generating ephemeral keypair (X25519) · fp ' + hex(4) + ':' + hex(4) + ':' + hex(4), 420, id);
      await spin('TLS 1.3 handshake · TLS_AES_256_GCM_SHA384', 380, id);
      lock.textContent = '● secure'; lock.style.color = C.green;
      line('');
      line(sp('Channel open. Fill in the fields below — I read every message. ', C.muted) + sp('(~24h response time)', C.muted));
      line('');

      var name = await ask({ label: 'name', placeholder: 'Ada Lovelace', autocomplete: 'name' }, id);
      var email = await ask({ label: 'reply_to', placeholder: 'you@company.com', type: 'email', autocomplete: 'email',
        validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'invalid address — expected user@domain.tld'; } }, id);
      var topic = await ask({ label: 'subject', placeholder: "Let's work together  (Enter to accept)", def: "Let's work together", validate: function () { return ''; } }, id);
      var msg = await ask({ label: 'body', multi: true, placeholder: 'Tell me about the project, the stack, the timeline…\n\n(Ctrl/⌘ + Enter to continue)',
        validate: function (v) { return v.length < 10 ? 'message too short (min 10 chars) — give me something to work with 🙂' : ''; } }, id);

      var payload = { from: name + ' <' + email + '>', to: TO, subject: topic, body: msg, ts: new Date().toISOString() };
      line('');
      line(sp('# payload.json', C.muted));
      line(jsonView(payload));
      line('');
      var ok = await ask({ label: 'transmit? [Y/n]', placeholder: 'Y', def: 'y', validate: function (v) { return /^(y|yes|n|no)$/i.test(v) ? '' : 'answer y or n'; } }, id);
      if (/^n/i.test(ok)) { line(sp('Aborted. Restarting session…', C.yellow)); await sleep(900); return flow(); }

      line('');
      await spin('Signing payload · sha256:' + hex(16) + '…', 450, id);
      await spin('Encrypting body (AES-256-GCM, ' + new TextEncoder().encode(msg).length + ' bytes)', 450, id);
      line(sp('# wire preview (first 64 bytes)', C.muted));
      line(hexdump(JSON.stringify(payload)));
      var pk = Math.max(1, Math.ceil(JSON.stringify(payload).length / 512));
      await bar('Transmitting ' + pk + ' packet' + (pk > 1 ? 's' : '') + '  ', 1100, id);

      var subject = '[portfolio] ' + topic;
      var bodyText = msg + '\n\n—\nFrom: ' + name + ' <' + email + '>\nSent via andrei@cloud:~$ ./send_message';

      if (ENDPOINT) {
        await spin('POST ' + ENDPOINT.replace(/^https?:\/\//, ''), 300, id);
        try {
          var res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ name: name, email: email, _replyto: email, _subject: subject, message: msg }) });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          line(sp('HTTP/2 200 OK', C.green) + sp(' · x-request-id: ' + hex(12), C.muted));
          return success(id, name, true);
        } catch (e) {
          line(sp('✗ Relay failed (' + e.message + '). Falling back to manual hand-off.', C.red));
        }
      }

      line(sp('[ OK ]', C.green) + ' Payload packed. Final hop: hand it to your mail client ↓');
      line('');
      var row = document.createElement('div');
      var gmail = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(TO) + '&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyText);
      var mailto = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyText);
      row.appendChild(btn('[ send via gmail ]', function () { window.open(gmail, '_blank', 'noopener'); success(id, name); }, true));
      row.appendChild(btn('[ open mail app ]', function () { location.href = mailto; success(id, name); }));
      row.appendChild(btn('[ copy to clipboard ]', function (e) {
        var t = 'To: ' + TO + '\nSubject: ' + subject + '\n\n' + bodyText;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () {
          e.target.textContent = '[ copied ✓ ]';
          line(sp('Copied. Paste it into any client and send it to ', C.muted) + sp(TO, C.blue));
        }, function () { line(sp('Clipboard blocked — email me directly: ', C.muted) + sp(TO, C.blue)); });
      }));
      out.appendChild(row); scr.scrollTop = scr.scrollHeight;
    } catch (e) { if (e !== 'aborted') throw e; }
  }

  var done = false;
  async function success(id, name, delivered) {
    if (done) return; done = true;
    try {
      line('');
      await type(delivered
        ? sp('✔ Message delivered.', C.green) + ' Thanks, ' + esc(name.split(' ')[0]) + ' — I\'ll get back to you soon.'
        : sp('✔ Handed off.', C.green) + ' Hit send in your mail client, ' + esc(name.split(' ')[0]) + ' — I\'ll get back to you soon.', id, 14);
      line(sp('  exit code 0 · session ' + hex(8) + ' closed · Esc to return to the site', C.muted));
      lock.textContent = delivered ? '● delivered' : '● handed off'; lock.style.color = C.green;
    } catch (e) { if (e !== 'aborted') throw e; }
  }

  function open() {
    ov.style.display = 'flex'; document.body.style.overflow = 'hidden'; done = false;
    flow();
  }
  function close() { run++; ov.style.display = 'none'; document.body.style.overflow = ''; }

  ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.style.display === 'flex') { e.stopPropagation(); close(); } }, true);
  scr.addEventListener('click', function () {
    if (window.getSelection().toString()) return;
    var f = out.querySelectorAll('input,textarea'); if (f.length) f[f.length - 1].focus();
  });

  // Wire up "./send_message" and "./hire_me" buttons
  Array.prototype.forEach.call(document.querySelectorAll('a'), function (a) {
    var t = a.textContent.trim();
    if (t === './send_message' || t === './hire_me') {
      a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(); }, true);
    }
  });

  // Expose to the interactive terminal
  window.openSendMessage = open;
  if (window.Term && window.Term.cmds) {
    var cmd = function () {
      var t = document.querySelector('[aria-label="Terminal"]');
      if (t) t.parentNode.style.display = 'none';
      document.body.style.overflow = '';
      setTimeout(open, 50);
      return ['Opening secure channel…'];
    };
    window.Term.cmds.send_message = window.Term.cmds['./send_message'] = window.Term.cmds.mail = window.Term.cmds.msg = cmd;
  }
})();
