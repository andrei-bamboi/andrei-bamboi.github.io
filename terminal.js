// Interactive terminal — opens from the "andrei@cloud:~$" logo (or press ` / Ctrl+K).
(function () {
  var C = {
    bg: 'hsl(216 28% 7%)', card: 'hsl(215 21% 11%)', border: 'hsl(212 12% 21%)',
    fg: 'hsl(0 0% 96%)', muted: 'hsl(212 9% 58%)', green: 'hsl(130 64% 53%)',
    blue: 'hsl(212 100% 67%)', red: 'hsl(0 84% 60%)', yellow: 'hsl(45 90% 60%)'
  };

  var DATA = {
    name: 'Andrei Bamboi',
    role: 'Cloud Architect & DevOps Engineer',
    location: 'Iași, Romania',
    email: 'bamboi.andrei@gmail.com',
    links: { github: 'https://github.com/andrei-bamboi', linkedin: 'https://www.linkedin.com/in/andrei-bamboi-21223278/' },
    skills: {
      'Cloud & Virtualisation': [['AWS', 90], ['Azure', 80], ['VMware', 85]],
      'Containers & Orchestration': [['Kubernetes', 90], ['Docker', 90], ['Rancher / RKE', 80]],
      'CI/CD & IaC': [['GitLab CI', 90], ['Jenkins', 85], ['Ansible', 85], ['Terraform', 80], ['ArgoCD', 80]],
      'Monitoring & Security': [['Grafana', 90], ['Prometheus', 85], ['Checkmk', 80], ['CloudFlare', 85]],
      'Systems & Scripting': [['Linux', 95], ['Bash', 85], ['Python', 70]]
    },
    projects: [
      [1337, 'Multi-Region K8s Platform', 'DEPLOYED', 'Kubernetes, Terraform, AWS, ArgoCD, Prometheus',
        'Multi-region Kubernetes platform serving 2M+ daily requests with 99.99% uptime. Zero-downtime deployments via GitOps.'],
      [2048, 'Cloud Cost Optimization Engine', 'ACTIVE', 'Python, AWS Lambda, Terraform, Grafana',
        'Automated cost analysis and rightsizing that cut cloud spend by 40% across 200+ microservices.'],
      [4096, 'Zero-Trust Security Framework', 'DEPLOYED', 'Vault, Istio, OPA, Kubernetes, Terraform',
        'Zero-trust network architecture with service mesh, secrets management and policy-as-code across hybrid cloud.']
    ]
  };

  var FS = {
    'about.txt': function () {
      return [DATA.name + ' — ' + DATA.role, 'Location: ' + DATA.location, '10+ years · 6 companies · 5 certifications · 3 cloud providers',
        '', 'Designing resilient infrastructure. Automating everything. Shipping at scale.'];
    },
    'skills.yaml': function () { return cmds.skills(); },
    'projects.md': function () { return cmds.projects(); },
    'contact.txt': function () { return cmds.contact(); },
    '.secrets': function () { return [c('Permission denied. Nice try though. 🔒', C.red)]; }
  };
  var SECTIONS = ['about', 'skills', 'projects', 'contact'];

  // ---------- helpers ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function c(text, color) { return { html: '<span style="color:' + color + '">' + esc(text) + '</span>' }; }
  function bar(p) { var n = Math.round(p / 10); return '█'.repeat(n) + '░'.repeat(10 - n); }
  function pad(s, n) { s = String(s); return s + ' '.repeat(Math.max(0, n - s.length)); }
  function link(text, href) { return { html: '<a href="' + esc(href) + '" target="_blank" rel="noopener" style="color:' + C.blue + ';text-decoration:underline">' + esc(text) + '</a>' }; }

  // ---------- commands ----------
  var startTime = Date.now();
  var cmds = {
    help: function () {
      var list = [
        ['whoami', 'who is this guy?'], ['about', 'short bio'], ['skills', 'installed modules'],
        ['projects', 'running processes'], ['contact', 'how to reach me'], ['neofetch', 'system info'],
        ['ls / cat <file>', 'browse the filesystem'], ['cd <section>', 'jump to a page section'],
        ['open github|linkedin|email', 'open a link'], ['kubectl get pods', 'check the cluster'],
        ['history', 'previous commands'], ['date · uptime · echo', 'the classics'],
        ['clear', 'clear the screen'], ['exit', 'close the terminal']
      ];
      return [c('Available commands:', C.green), ''].concat(list.map(function (r) {
        return { html: '  <span style="color:' + C.blue + '">' + esc(pad(r[0], 28)) + '</span><span style="color:' + C.muted + '">' + esc(r[1]) + '</span>' };
      })).concat(['', c('Tip: Tab autocompletes, ↑/↓ walks history.', C.muted)]);
    },
    whoami: function () { return [DATA.name.toLowerCase().replace(' ', '.') + ' — ' + DATA.role]; },
    about: function () { return FS['about.txt'](); },
    skills: function () {
      var out = [];
      Object.keys(DATA.skills).forEach(function (g) {
        out.push(c('[' + g + ']', C.blue));
        DATA.skills[g].forEach(function (s) {
          out.push({ html: '  ' + esc(pad(s[0], 16)) + '<span style="color:' + C.green + '">' + bar(s[1]) + '</span> ' + s[1] + '%' });
        });
        out.push('');
      });
      return out;
    },
    projects: function () {
      var out = [c(pad('PID', 7) + pad('NAME', 34) + 'STATUS', C.muted)];
      DATA.projects.forEach(function (p) {
        var col = p[2] === 'ACTIVE' ? C.green : C.blue;
        out.push({ html: esc(pad(p[0], 7)) + '<b>' + esc(pad(p[1], 34)) + '</b><span style="color:' + col + '">' + (p[2] === 'ACTIVE' ? '● ' : '✓ ') + p[2] + '</span>' });
        out.push(c('       stack: ' + p[3], C.muted));
        out.push('       ' + p[4]);
        out.push('');
      });
      return out;
    },
    contact: function () {
      return [
        { html: 'email    : ' + link(DATA.email, 'mailto:' + DATA.email).html },
        { html: 'github   : ' + link(DATA.links.github, DATA.links.github).html },
        { html: 'linkedin : ' + link(DATA.links.linkedin, DATA.links.linkedin).html },
        '', c("Open to new opportunities, consulting, and infrastructure projects.", C.green)
      ];
    },
    neofetch: function () {
      var art = [' █████╗ ██████╗ ', '██╔══██╗██╔══██╗', '███████║██████╔╝', '██╔══██║██╔══██╗', '██║  ██║██████╔╝', '╚═╝  ╚═╝╚═════╝ ', '', ''];
      var info = [['', 'andrei@cloud'], ['', '------------'], ['OS', 'Cloud Native'], ['Uptime', '10+ years'],
        ['Kernel', 'Kubernetes'], ['Shell', 'Bash / Ansible'], ['CPU', 'AWS + Azure'], ['Location', DATA.location]];
      return art.map(function (a, i) {
        var r = info[i];
        var right = r[0] ? '<span style="color:' + C.blue + '">' + esc(r[0]) + '</span>: ' + esc(r[1]) : '<span style="color:' + C.green + '">' + esc(r[1]) + '</span>';
        return { html: '<span style="color:' + C.green + '">' + esc(pad(a, 18)) + '</span>' + right };
      });
    },
    ls: function (a) {
      var all = a.indexOf('-a') > -1 || a.indexOf('-la') > -1;
      return [Object.keys(FS).filter(function (f) { return all || f[0] !== '.'; }).map(function (f) { return f; }).join('   ')];
    },
    cat: function (a) {
      if (!a.length) return [c('usage: cat <file>', C.muted)];
      var f = FS[a[0]];
      return f ? f() : [c('cat: ' + a[0] + ': No such file or directory', C.red)];
    },
    cd: function (a) {
      var t = (a[0] || '').replace(/^\.?\/?/, '').replace(/\/$/, '');
      if (!t || t === '~' || t === 'top') { scrollTo('top'); return ['→ ~']; }
      if (SECTIONS.indexOf(t) < 0) return [c('cd: ' + a[0] + ': No such directory. Try: ' + SECTIONS.join(', '), C.red)];
      scrollTo(t); return [c('→ jumped to ' + t + ' (scroll behind the terminal)', C.green)];
    },
    open: function (a) {
      var t = a[0];
      var url = t === 'email' ? 'mailto:' + DATA.email : DATA.links[t];
      if (!url) return [c('usage: open github|linkedin|email', C.muted)];
      window.open(url, '_blank'); return ['Opening ' + t + '…'];
    },
    kubectl: function (a) {
      if (a.join(' ') !== 'get pods') return [c('try: kubectl get pods', C.muted)];
      var pods = [['portfolio-web-7f9c8d-x2k4p', 'Running', 0], ['coffee-maker-5b6d7-q9z1m', 'Running', 3],
        ['motivation-daemon-8c2f1-h7j3k', 'Running', 0], ['legacy-monolith-1a2b3-zzzzz', 'CrashLoopBackOff', 42]];
      return [c(pad('NAME', 34) + pad('READY', 8) + pad('STATUS', 20) + 'RESTARTS', C.muted)].concat(pods.map(function (p) {
        var col = p[1] === 'Running' ? C.green : C.red;
        return { html: esc(pad(p[0], 34)) + pad(p[1] === 'Running' ? '1/1' : '0/1', 8) + '<span style="color:' + col + '">' + esc(pad(p[1], 20)) + '</span>' + p[2] };
      }));
    },
    terraform: function (a) {
      if (a[0] !== 'plan' && a[0] !== 'apply') return [c('try: terraform plan', C.muted)];
      return [c('Plan: 1 to add, 0 to change, 0 to destroy.', C.green), '', '  + resource "collaboration" "you_and_andrei" {', '      status = "pending your message"', '    }', '', c('Run `contact` to apply.', C.muted)];
    },
    sudo: function () { return [c('andrei is not in the sudoers file. This incident will be reported. 👀', C.red)]; },
    rm: function (a) {
      if (a.join(' ').indexOf('-rf') > -1) return [c('Nice try. Production is protected by RBAC, backups and a very stubborn engineer.', C.yellow)];
      return [c('rm: permission denied', C.red)];
    },
    date: function () { return [new Date().toString()]; },
    uptime: function () {
      var s = Math.floor((Date.now() - startTime) / 1000);
      return ['up 10+ years (this session: ' + Math.floor(s / 60) + 'm ' + (s % 60) + 's), load average: 0.42, 0.37, 0.31'];
    },
    echo: function (a) { return [a.join(' ')]; },
    pwd: function () { return ['/home/andrei']; },
    history: function () { return hist.map(function (h, i) { return pad(i + 1, 5) + h; }); },
    clear: function () { out.innerHTML = ''; return []; },
    exit: function () { close(); return []; }
  };
  cmds.ll = function () { return cmds.ls(['-la']); };
  cmds.hire = cmds.contact;

  // ---------- UI ----------
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6);backdrop-filter:blur(3px)';
  overlay.innerHTML =
    '<div role="dialog" aria-label="Terminal" style="width:100%;max-width:820px;height:min(560px,85vh);display:flex;flex-direction:column;background:' + C.bg + ';border:1px solid ' + C.border + ';box-shadow:0 20px 60px rgba(0,0,0,.6);font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:13px;color:' + C.fg + '">' +
      '<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid ' + C.border + ';background:' + C.card + '">' +
        '<button data-close aria-label="Close" style="width:12px;height:12px;border-radius:50%;background:hsl(0 84% 60% / .8);border:0;cursor:pointer"></button>' +
        '<span style="width:12px;height:12px;border-radius:50%;background:hsl(45 90% 55% / .8)"></span>' +
        '<span style="width:12px;height:12px;border-radius:50%;background:hsl(130 64% 45% / .8)"></span>' +
        '<span style="margin-left:12px;font-size:12px;color:' + C.muted + ';letter-spacing:.1em">andrei@cloud:~ — bash — interactive</span>' +
      '</div>' +
      '<div data-body style="flex:1;overflow-y:auto;padding:14px 16px;line-height:1.55;cursor:text">' +
        '<div data-out style="white-space:pre-wrap;word-break:break-word"></div>' +
        '<div style="display:flex;align-items:center">' +
          '<span data-prompt style="white-space:pre"></span>' +
          '<input data-in autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Command" style="flex:1;min-width:0;background:transparent;border:0;outline:0;color:' + C.fg + ';font:inherit;caret-color:' + C.green + ';padding:0;margin-left:8px">' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var out = overlay.querySelector('[data-out]');
  var input = overlay.querySelector('[data-in]');
  var body = overlay.querySelector('[data-body]');
  var PROMPT = '<span style="color:' + C.green + '">andrei</span><span style="color:' + C.blue + '">@cloud</span><span style="color:' + C.muted + '">:~</span><span style="color:' + C.green + '">$</span>';
  overlay.querySelector('[data-prompt]').innerHTML = PROMPT;

  var hist = [], hIdx = 0, booted = false;

  function print(lines) {
    lines.forEach(function (l) {
      var d = document.createElement('div');
      if (typeof l === 'object') d.innerHTML = l.html; else d.textContent = l === '' ? ' ' : l;
      out.appendChild(d);
    });
    body.scrollTop = body.scrollHeight;
  }

  function run(raw) {
    var line = raw.trim();
    print([{ html: PROMPT + ' ' + esc(line) }]);
    if (!line) return;
    hist.push(line); hIdx = hist.length;
    var parts = line.split(/\s+/), name = parts[0].toLowerCase(), args = parts.slice(1);
    if (name.indexOf('./') === 0 && SECTIONS.indexOf(name.slice(2)) > -1) { print(cmds.cd([name.slice(2)])); return; }
    var fn = cmds[name];
    print(fn ? fn(args) : [c(name + ': command not found. Type `help` to see what I can do.', C.red)]);
  }

  function complete() {
    var v = input.value, parts = v.split(' ');
    var pool = parts.length > 1
      ? (parts[0] === 'cat' ? Object.keys(FS) : parts[0] === 'cd' ? SECTIONS : parts[0] === 'open' ? ['github', 'linkedin', 'email'] : [])
      : Object.keys(cmds);
    var last = parts[parts.length - 1];
    var m = pool.filter(function (x) { return x.indexOf(last) === 0; });
    if (m.length === 1) { parts[parts.length - 1] = m[0]; input.value = parts.join(' ') + (parts.length === 1 ? ' ' : ''); }
    else if (m.length > 1) { print([{ html: PROMPT + ' ' + esc(v) }, m.join('   ')]); }
  }

  function scrollTo(id) {
    var el = document.getElementById(id); if (!el) return;
    var h = document.querySelector('header');
    window.scrollTo({ top: id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - (h ? h.offsetHeight : 0), behavior: 'smooth' });
  }

  function open() {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (!booted) {
      booted = true;
      print([c('Last login: ' + new Date().toDateString() + ' on ttys001', C.muted),
        { html: 'Welcome to <span style="color:' + C.green + '">andrei@cloud</span>. Type <span style="color:' + C.blue + '">help</span> to get started.' }, '']);
    }
    setTimeout(function () { input.focus(); }, 0);
  }
  function close() { overlay.style.display = 'none'; document.body.style.overflow = ''; }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { run(input.value); input.value = ''; }
    else if (e.key === 'Tab') { e.preventDefault(); complete(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hIdx > 0) input.value = hist[--hIdx]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hIdx = Math.min(hist.length, hIdx + 1); input.value = hist[hIdx] || ''; }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
    else if (e.key === 'c' && e.ctrlKey && !window.getSelection().toString()) { print([{ html: PROMPT + ' ' + esc(input.value) + '^C' }]); input.value = ''; }
  });
  body.addEventListener('click', function () { if (!window.getSelection().toString()) input.focus(); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.hasAttribute('data-close')) close(); });
  document.addEventListener('keydown', function (e) {
    var typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === 'Escape' && overlay.style.display === 'flex') close();
    else if (!typing && (e.key === '`' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'))) { e.preventDefault(); open(); }
  });

  // Hook the header logo
  var logo = document.querySelector('header a[href="#top"]');
  if (logo) {
    logo.title = 'Open terminal (`)';
    logo.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(); }, true);
  }
  window.openTerminal = open;
})();
