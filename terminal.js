// Interactive terminal — opens from the "andrei@cloud:~$" logo (or press ` / Ctrl+K).
(function () {
  var C = {
    bg: 'hsl(216 28% 7%)', card: 'hsl(215 21% 11%)', border: 'hsl(212 12% 21%)',
    fg: 'hsl(0 0% 96%)', muted: 'hsl(212 9% 58%)', green: 'hsl(130 64% 53%)',
    blue: 'hsl(212 100% 67%)', red: 'hsl(0 84% 60%)', yellow: 'hsl(45 90% 60%)'
  };

  var T = window.Term = { subs: {}, aborted: false };
  var DATA = {
    name: 'Andrei Bamboi',
    role: 'DevOps & Cloud Architect · Infrastructure Tech Lead',
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
      [2111, 'AWS → Azure Migration · Financial SaaS (Visma)', 'DEPLOYED', 'AWS, Azure, Terraform, TeamCity, Octopus Deploy',
        'Led the end-to-end migration of a mission-critical financial SaaS to Azure with minimal downtime and full compliance.'],
      [2112, 'Azure AI Landing Zone (Visma)', 'DEPLOYED', 'Azure, Terraform, IAM, Networking, Policy',
        'Secure, governed, scalable landing zone for AI/ML workloads with networking, IAM and compliance guardrails.'],
      [2113, 'Self-hosted AKS GitHub Runner Platform (Visma)', 'DEPLOYED', 'AKS, GitHub Actions, Terraform',
        'Centralized runner platform on AKS with dynamic autoscaling — faster CI/CD, better resource efficiency.'],
      [2205, 'GPU Kubernetes for AI/ML (Dydon AI)', 'DEPLOYED', 'Kubernetes, GPU passthrough, Hetzner, Ionos',
        'GPU-accelerated clusters for model training: passthrough, scheduling and orchestration to maximize utilization.'],
      [2301, 'Cloudflare Edge & Zero Trust (ZeroBounce)', 'ACTIVE', 'Cloudflare Zero Trust, Tunnels, Workers, WAF',
        'Identity-based access and tunnels instead of VPN exposure; Workers running logic at the edge.'],
      [1808, 'BI Tool → Microservices (Endava)', 'DEPLOYED', 'Docker, Kubernetes, GitLab CI, OpenShift',
        'Containerized a complex VM-native BI visualization tool into a microservices architecture.']
    ],
    jobs: [
      ['2025', 'present', 'Infrastructure Tech Lead (cross-team)', 'ZeroBounce', 'Infra point of contact for other teams: requirements → plans, design & review, shared standards and runbooks'],
      ['2023-01', 'present', 'DevOps Engineer', 'ZeroBounce', 'Hybrid VMware + Kubernetes, GitLab CI, Jenkins, Ansible, Cloudflare (DNS/WAF/Workers/Zero Trust/Tunnels), Grafana, Checkmk, Sentry'],
      ['2022-05', '2023-01', 'Cloud Architect', 'Dydon AI', 'On-prem Kubernetes as code, GPU clusters on Ionos/Hetzner, GPU GitHub Actions runners, ELK, Prometheus'],
      ['2021-11', '2022-05', 'Infrastructure Engineer', 'Visma', 'AWS + Azure with Terraform, AWS→Azure migration, Azure AI Landing Zone, AKS runners, TeamCity, Octopus'],
      ['2018-08', '2021-11', 'DevOps Engineer', 'Endava', 'GitLab CI + Kubernetes, OpenShift, Docker, AWS, Terraform, Jenkins, Splunk'],
      ['2018-03', '2018-08', 'DevOps Engineer', 'Levi9 Romania', 'Rancher/RKE, Helm, ArgoCD, GitHub Actions, Longhorn, Prometheus/Grafana'],
      ['2016-01', '2018-03', 'IT System Administrator', 'Levi9 Romania', 'Servers & migrations, Cisco/MikroTik, SCOM, Backup Exec, AD DS, SCCM, 24/7 on-call'],
      ['2013-08', '2016-01', 'IT Service Desk Analyst (L2)', 'SCC Services Romania', 'Active Directory, Windows Server, Citrix, SCCM/SCOM, ITSM & SLAs']
    ]
  };

  var FS = {
    'experience.log': function () { return cmds.experience(); },
    'education.txt': function () { return cmds.education(); },
    'about.txt': function () {
      return [DATA.name + ' — ' + DATA.role, 'Location: ' + DATA.location, '13+ years in IT · 8+ in DevOps & IaC · 6 companies · AWS / Azure / VMware / Hetzner / Ionos',
        '', 'Multi-cloud platforms, Infrastructure as Code and zero-downtime delivery —', 'built by someone who started on 24/7 support and knows what breaks at 3 a.m.'];
    },
    'skills.yaml': function () { return cmds.skills(); },
    'projects.md': function () { return cmds.projects(); },
    'contact.txt': function () { return cmds.contact(); },
    '.secrets': function () { return [c('Permission denied. Nice try though. 🔒', C.red)]; }
  };
  var SECTIONS = ['about', 'skills', 'experience', 'projects', 'contact'];

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
        ['experience', 'career log (git log)'], ['projects', 'running processes'], ['certs', 'certifications'], ['education', 'degrees & languages'], ['contact', 'how to reach me'], ['neofetch', 'system info'],
        ['tech', '★ DevOps playground: kubectl, terraform, deploy…'], ['k9s', '★ interactive project explorer'], ['send_message', '★ open the secure contact channel'],
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
      var out = [c(pad('PID', 7) + pad('NAME', 50) + 'STATUS', C.muted)];
      DATA.projects.forEach(function (p) {
        var col = p[2] === 'ACTIVE' ? C.green : C.blue;
        out.push({ html: esc(pad(p[0], 7)) + '<b>' + esc(pad(p[1], 50)) + '</b><span style="color:' + col + '">' + (p[2] === 'ACTIVE' ? '● ' : '✓ ') + p[2] + '</span>' });
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
      var info = [['', 'andrei@cloud'], ['', '------------'], ['OS', 'Cloud Native'], ['Uptime', '13+ years'],
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
      return [c(pad('NAME', 50) + pad('READY', 8) + pad('STATUS', 20) + 'RESTARTS', C.muted)].concat(pods.map(function (p) {
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
      return ['up 13+ years (this session: ' + Math.floor(s / 60) + 'm ' + (s % 60) + 's), load average: 0.42, 0.37, 0.31'];
    },
    echo: function (a) { return [a.join(' ')]; },
    pwd: function () { return ['/home/andrei']; },
    history: function () { return hist.map(function (h, i) { return pad(i + 1, 5) + h; }); },
    clear: function () { out.innerHTML = ''; return []; },
    exit: function () { close(); return []; }
  };
  cmds.ll = function () { return cmds.ls(['-la']); };
  cmds.hire = cmds.contact;
  cmds.experience = cmds.career = cmds.cv = function () {
    var out = [c('$ git log --author="andrei" --career', C.muted), ''];
    DATA.jobs.forEach(function (j, i) {
      out.push({ html: '<span style="color:' + C.yellow + '">commit ' + ('0000000' + ((j[0] + j[3]).split('').reduce(function (h, ch) { return (h * 31 + ch.charCodeAt(0)) >>> 0; }, 7)).toString(16)).slice(-7) + '</span>' + (i === 0 ? ' (<span style="color:' + C.blue + '">HEAD -> main</span>)' : '') });
      out.push({ html: 'Date:   ' + esc(j[0] + ' → ' + j[1]) });
      out.push({ html: '    <b>' + esc(j[2]) + '</b> <span style="color:' + C.green + '">@ ' + esc(j[3]) + '</span>' });
      out.push({ html: '    <span style="color:' + C.muted + '">' + esc(j[4]) + '</span>' });
      out.push('');
    });
    return out;
  };
  cmds.certs = function () {
    return [c('Certifications', C.blue), '  ✓ Microsoft OpenHack: Containers (2022)', '  ✓ ITIL Foundation — APMG-International (2015)',
      c('  coursework: AZ-900 Azure Fundamentals, MTA Networking & Security, CCNA ICND1, MS 70-640 AD', C.muted)];
  };
  cmds.education = cmds.edu = function () {
    return [c('Education — Alexandru Ioan Cuza University, Iași', C.blue), '  MSc, Accounting, Auditing & Expertise (2009–2011)', '  BSc, Accounting & IT Management (2005–2009)', '',
      c('Languages', C.blue), '  English — advanced · French — beginner', '',
      c('Before IT (2007–2013): warehouse manager, accountant, assistant manager, sales — logistics, accounting & team leadership.', C.muted)];
  };


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

  var hist = [], hIdx = 0, booted = false, busy = false;
  var inputRow = input.parentNode;

  function print(lines) {
    var last;
    lines.forEach(function (l) {
      var d = document.createElement('div');
      if (typeof l === 'object') d.innerHTML = l.html; else d.textContent = l === '' ? ' ' : l;
      out.appendChild(d); last = d;
    });
    body.scrollTop = body.scrollHeight;
    return last;
  }

  function run(raw) {
    var line = raw.trim();
    print([{ html: PROMPT + ' ' + esc(line) }]);
    if (!line) return;
    hist.push(line); hIdx = hist.length;
    var parts = line.split(/\s+/), name = parts[0].toLowerCase(), args = parts.slice(1);
    if (name.indexOf('./') === 0 && SECTIONS.indexOf(name.slice(2)) > -1) { print(cmds.cd([name.slice(2)])); return; }
    var fn = cmds[name];
    var res = fn ? fn(args) : [c(name + ': command not found. Type `help` (or `tech`) to see what I can do.', C.red)];
    if (res && typeof res.then === 'function') {
      busy = true; T.aborted = false; inputRow.style.visibility = 'hidden';
      res.catch(function (e) { print([c(String(e), C.red)]); }).then(function () {
        busy = false; inputRow.style.visibility = ''; input.focus(); body.scrollTop = body.scrollHeight;
      });
    } else if (res) print(res);
  }

  function complete() {
    var v = input.value, parts = v.split(' ');
    var pool = parts.length > 1
      ? (parts[0] === 'cat' ? Object.keys(FS) : parts[0] === 'cd' ? SECTIONS : parts[0] === 'open' ? ['github', 'linkedin', 'email'] : (T.subs[parts[0]] || []).filter(function (x) { return x.split(' ').length === parts.length - 1; }).map(function (x) { return x.split(' ').pop(); }))
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
    if (busy) { if (e.key === 'c' && e.ctrlKey) T.aborted = true; e.preventDefault(); return; }
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
    if (busy && overlay.style.display === 'flex' && e.key === 'c' && e.ctrlKey) { T.aborted = true; return; }
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
  T.cmds = cmds; T.print = print; T.c = c; T.esc = esc; T.pad = pad; T.C = C; T.PROMPT = PROMPT; T.FS = FS;
})();
