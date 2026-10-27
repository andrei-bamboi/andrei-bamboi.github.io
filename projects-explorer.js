// ./view_all_projects — a k9s-style interactive project explorer.
// Data comes from Andrei's real experience (LinkedIn). Edit PROJECTS to add/remove entries.
(function () {
  var GITHUB = 'https://github.com/andrei-bamboi';
  var PROJECTS = [
    { pid: 2301, name: 'cloudflare-zero-trust', title: 'Cloudflare Zero Trust', org: 'ZeroBounce', from: '2023-01', to: null, tags: ['edge', 'security'],
      stack: ['Cloudflare Access', 'Tunnels', 'Identity providers', 'App policies'],
      notes: ['Identity-based access to internal services instead of a traditional VPN.', 'Secure tunnels and per-application policies protect internal tools.'] },
    { pid: 2302, name: 'cloudflare-edge-workers', title: 'Edge logic with Cloudflare Workers', org: 'ZeroBounce', from: '2023-01', to: null, tags: ['edge'],
      stack: ['Cloudflare Workers', 'DNS', 'WAF', 'Caching'],
      notes: ['Workers run logic at the edge: offloading requests and transforming traffic.', 'Lower latency and better resilience closer to end users.', 'Organisation-wide Cloudflare admin: DNS, WAF, caching and edge security policies.'] },
    { pid: 2303, name: 'cicd-gitlab-jenkins', title: 'End-to-end CI/CD + config management', org: 'ZeroBounce', from: '2023-01', to: null, tags: ['cicd', 'iac'],
      stack: ['GitLab CI', 'Jenkins', 'Ansible'],
      notes: ['Automated end-to-end pipelines with GitLab CI and Jenkins.', 'Standardised configuration management with Ansible for repeatable, hands-off delivery.', 'Wired third-party services and APIs into pipelines and operational workflows.'] },
    { pid: 2304, name: 'hybrid-vmware-k8s', title: 'Hybrid VMware + Kubernetes platform', org: 'ZeroBounce', from: '2023-01', to: null, tags: ['k8s', 'infra'],
      stack: ['VMware', 'Kubernetes', 'Linux'],
      notes: ['High-availability cloud and on-prem infrastructure on VMware across hybrid environments.', 'Kubernetes provisioning, workload deployments, rolling upgrades and day-2 maintenance.'] },
    { pid: 2305, name: 'observability-stack', title: 'Observability across the estate', org: 'ZeroBounce', from: '2023-01', to: null, tags: ['obs'],
      stack: ['Grafana', 'Checkmk', 'Sentry'],
      notes: ['Centralised metrics, monitoring and alerting.', 'Proactive detection and resolution of anomalies.'] },
    { pid: 2205, name: 'gpu-k8s-ai-ml', title: 'GPU Kubernetes for AI/ML', org: 'Dydon AI', from: '2022-05', to: '2023-01', tags: ['k8s', 'cloud'],
      stack: ['Kubernetes', 'GPU passthrough', 'Hetzner', 'Ionos'],
      notes: ['GPU-accelerated clusters for high-demand AI/ML workloads.', 'GPU passthrough, resource scheduling and workload orchestration to maximise utilisation and training efficiency.'] },
    { pid: 2206, name: 'onprem-k8s-as-code', title: 'On-prem Kubernetes as code', org: 'Dydon AI', from: '2022-05', to: '2023-01', tags: ['k8s', 'iac'],
      stack: ['Kubernetes', 'Infrastructure as Code'],
      notes: ['Scalable on-prem clusters for core business operations.', 'IaC to enforce consistency, reliability and security compliance.'] },
    { pid: 2207, name: 'elk-observability', title: 'ELK + Prometheus observability', org: 'Dydon AI', from: '2022-05', to: '2023-01', tags: ['obs'],
      stack: ['Elasticsearch', 'Logstash', 'Kibana', 'Prometheus', 'Grafana'],
      notes: ['End-to-end logging, metrics and alerting in one place.'] },
    { pid: 2208, name: 'gpu-github-runners', title: 'Self-hosted GPU GitHub runners', org: 'Dydon AI', from: '2022-05', to: '2023-01', tags: ['cicd'],
      stack: ['GitHub Actions', 'Self-hosted runners', 'GPU'],
      notes: ['Provisioned and secured runners for GPU-dependent build and test workloads.', 'Faster pipelines and lower cloud costs.'] },
    { pid: 2111, name: 'aws-to-azure-migration', title: 'AWS → Azure migration · financial SaaS', org: 'Visma', from: '2021-11', to: '2022-05', tags: ['cloud', 'iac'],
      stack: ['AWS', 'Azure', 'Terraform'],
      notes: ['Led the end-to-end migration of a mission-critical financial SaaS.', 'Minimal downtime and full regulatory compliance.'] },
    { pid: 2112, name: 'azure-ai-landing-zone', title: 'Azure AI Landing Zone', org: 'Visma', from: '2021-11', to: '2022-05', tags: ['cloud', 'security', 'iac'],
      stack: ['Azure', 'Terraform', 'Networking', 'IAM'],
      notes: ['Secure, governed, scalable landing zone for AI/ML workloads.', 'Networking, IAM and compliance guardrails built in.'] },
    { pid: 2113, name: 'aks-github-runners', title: 'Self-hosted AKS GitHub runner platform', org: 'Visma', from: '2021-11', to: '2022-05', tags: ['k8s', 'cicd'],
      stack: ['AKS', 'GitHub Actions', 'Autoscaling'],
      notes: ['Centralised runner platform with dynamic autoscaling.', 'Faster CI/CD and better resource efficiency.'] },
    { pid: 2114, name: 'release-pipelines', title: 'Release pipelines', org: 'Visma', from: '2021-11', to: '2022-05', tags: ['cicd', 'iac'],
      stack: ['TeamCity', 'Octopus Deploy', 'Terraform'],
      notes: ['Streamlined release cycles across AWS and Azure environments.'] },
    { pid: 1808, name: 'bi-tool-microservices', title: 'BI tool → microservices', org: 'Endava', from: '2018-08', to: '2019-11', tags: ['k8s'],
      stack: ['Docker', 'Kubernetes'],
      notes: ['Containerised a complex VM-native BI visualisation tool into microservices with a custom Docker strategy.'] },
    { pid: 1809, name: 'openshift-java-cicd', title: 'CI/CD for Java/Spring on OpenShift', org: 'Endava', from: '2018-08', to: '2019-11', tags: ['cicd', 'k8s'],
      stack: ['GitLab CI', 'OpenShift', 'Java/Spring'],
      notes: ['Fully automated pipelines with GitLab CI and Kubernetes, increasing deployment frequency.', 'Standardised service configs for compliance and performance.'] },
    { pid: 1803, name: 'rancher-gitops-platform', title: 'Rancher/RKE GitOps platform', org: 'Levi9', from: '2018-03', to: '2018-08', tags: ['k8s', 'cicd', 'obs'],
      stack: ['Rancher/RKE', 'Helm', 'ArgoCD', 'GitHub Actions', 'Longhorn', 'Prometheus', 'Grafana'],
      notes: ['Built and scaled dev & prod microservice clusters.', 'GitOps delivery with GitHub Actions, Helm and ArgoCD; Longhorn for persistent storage.'] }
  ];
  var TAGS = [['all', 'all'], ['k8s', 'kubernetes'], ['cloud', 'cloud'], ['cicd', 'ci/cd'], ['iac', 'iac'], ['edge', 'edge'], ['security', 'security'], ['obs', 'observability']];

  var C = {
    bg: 'hsl(216 28% 7%)', card: 'hsl(215 21% 11%)', border: 'hsl(212 12% 21%)', sel: 'hsl(212 100% 67% / .16)',
    fg: 'hsl(0 0% 96%)', muted: 'hsl(212 9% 58%)', green: 'hsl(130 64% 53%)',
    blue: 'hsl(212 100% 67%)', red: 'hsl(0 84% 60%)', yellow: 'hsl(45 90% 60%)'
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function sp(t, col) { return '<span style="color:' + col + '">' + esc(t) + '</span>'; }
  function pad(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s + ' '.repeat(n - s.length); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function months(p) {
    var a = p.from.split('-'), now = new Date(), b = p.to ? p.to.split('-') : [now.getFullYear(), now.getMonth() + 1];
    return Math.max(1, (b[0] - a[0]) * 12 + (b[1] - a[1]));
  }
  function age(p) { var m = months(p); return m >= 12 ? Math.floor(m / 12) + 'y' + (m % 12 ? m % 12 + 'm' : '') : m + 'm'; }
  function running(p) { return !p.to; }

  // ---------- UI ----------
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:110;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.65);backdrop-filter:blur(3px)';
  ov.innerHTML =
    '<div role="dialog" aria-label="Project explorer" style="width:100%;max-width:980px;height:min(640px,90vh);display:flex;flex-direction:column;background:' + C.bg + ';border:1px solid ' + C.border + ';box-shadow:0 24px 70px rgba(0,0,0,.65);font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:12.5px;color:' + C.fg + ';position:relative;overflow:hidden">' +
      '<div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid ' + C.border + ';background:' + C.card + '">' +
        '<button data-x aria-label="Close" style="width:12px;height:12px;border-radius:50%;background:hsl(0 84% 60% / .8);border:0;cursor:pointer"></button>' +
        '<span style="width:12px;height:12px;border-radius:50%;background:hsl(45 90% 55% / .8)"></span>' +
        '<span style="width:12px;height:12px;border-radius:50%;background:hsl(130 64% 45% / .8)"></span>' +
        '<span style="margin-left:12px;font-size:12px;color:' + C.muted + ';letter-spacing:.1em">k9s — context: andrei@career — namespace: all</span>' +
      '</div>' +
      '<div data-head style="padding:10px 14px 6px;border-bottom:1px solid ' + C.border + ';white-space:pre;overflow:hidden;line-height:1.5"></div>' +
      '<div data-tabs style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px;border-bottom:1px solid ' + C.border + '"></div>' +
      '<div data-body style="flex:1;overflow:auto;padding:6px 0;line-height:1.7"></div>' +
      '<div data-foot style="padding:6px 14px;border-top:1px solid ' + C.border + ';background:' + C.card + ';font-size:11px;color:' + C.muted + ';display:flex;gap:14px;flex-wrap:wrap;align-items:center"></div>' +
      '<div style="pointer-events:none;position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.1) 2px,rgba(0,0,0,.1) 4px)"></div>' +
    '</div>';
  document.body.appendChild(ov);
  var head = ov.querySelector('[data-head]'), tabs = ov.querySelector('[data-tabs]'), body = ov.querySelector('[data-body]'), foot = ov.querySelector('[data-foot]');

  var state = { tag: 'all', filter: '', sel: 0, view: 'list', filtering: false, current: null };

  function list() {
    var f = state.filter.toLowerCase();
    return PROJECTS.filter(function (p) {
      if (state.tag !== 'all' && p.tags.indexOf(state.tag) < 0) return false;
      if (!f) return true;
      return (p.name + ' ' + p.title + ' ' + p.org + ' ' + p.stack.join(' ') + ' ' + p.tags.join(' ')).toLowerCase().indexOf(f) > -1;
    });
  }

  function renderHead() {
    var run = PROJECTS.filter(running).length, orgs = {};
    PROJECTS.forEach(function (p) { orgs[p.org] = 1; });
    var techs = {}; PROJECTS.forEach(function (p) { p.stack.forEach(function (t) { techs[t] = 1; }); });
    var logo = ['  ┌──┐  ┌──┐  ┌──┐', '  │▓▓│──│▓▓│──│▓▓│', '  └┬─┘  └┬─┘  └┬─┘', '   └──┬──┴──┬──┘  ', '    [ career ]     '];
    var info = [
      sp('Context: ', C.yellow) + 'andrei@career',
      sp('Cluster: ', C.yellow) + 'iasi-ro-remote',
      sp('Projects:', C.yellow) + ' ' + PROJECTS.length + ' total · ' + sp(run + ' running', C.green) + ' · ' + (PROJECTS.length - run) + ' completed',
      sp('Orgs:    ', C.yellow) + Object.keys(orgs).join(', '),
      sp('Tech:    ', C.yellow) + Object.keys(techs).length + ' distinct tools'
    ];
    head.innerHTML = info.map(function (l, i) { return pad('', 0) + l; }).map(function (l, i) {
      return '<div style="display:flex;justify-content:space-between;gap:16px"><span>' + l + '</span><span class="k9s-logo" style="color:' + C.blue + '">' + esc(logo[i]) + '</span></div>';
    }).join('');
    if (window.innerWidth < 640) Array.prototype.forEach.call(head.querySelectorAll('.k9s-logo'), function (e) { e.style.display = 'none'; });
  }

  function renderTabs() {
    tabs.innerHTML = '';
    TAGS.forEach(function (t, i) {
      var n = t[0] === 'all' ? PROJECTS.length : PROJECTS.filter(function (p) { return p.tags.indexOf(t[0]) > -1; }).length;
      var b = document.createElement('button');
      var on = state.tag === t[0];
      b.innerHTML = '<span style="opacity:.6">' + i + '</span> :' + esc(t[1]) + ' <span style="opacity:.6">(' + n + ')</span>';
      b.style.cssText = 'font:inherit;font-size:11px;padding:2px 8px;cursor:pointer;border:1px solid ' + (on ? C.green : C.border) + ';background:' + (on ? 'hsl(130 64% 53% / .12)' : 'transparent') + ';color:' + (on ? C.green : C.muted);
      b.onclick = function () { state.tag = t[0]; state.sel = 0; state.view = 'list'; render(); };
      tabs.appendChild(b);
    });
    if (state.filtering || state.filter) {
      var f = document.createElement('span');
      f.style.cssText = 'margin-left:auto;color:' + C.yellow;
      f.innerHTML = '/' + esc(state.filter) + (state.filtering ? '<span style="background:' + C.green + ';color:' + C.bg + '">&nbsp;</span>' : '');
      tabs.appendChild(f);
    }
  }

  function renderList() {
    var rows = list();
    if (state.sel >= rows.length) state.sel = Math.max(0, rows.length - 1);
    var narrow = window.innerWidth < 720;
    var h = '<div style="padding:0 14px;color:' + C.muted + ';white-space:pre">' +
      (narrow ? pad('PID', 6) + pad('NAME', 26) + 'STATUS' : pad('PID', 7) + pad('NAME', 28) + pad('ORG', 13) + pad('STATUS', 12) + pad('AGE', 7) + 'TAGS') + '</div>';
    if (!rows.length) h += '<div style="padding:8px 14px;color:' + C.muted + '">No resources found. Press Esc to clear the filter.</div>';
    rows.forEach(function (p, i) {
      var st = running(p) ? sp(pad('Running', 12), C.green) : sp(pad('Completed', 12), C.muted);
      var line = narrow
        ? esc(pad(p.pid, 6)) + esc(pad(p.name, 26)) + st
        : esc(pad(p.pid, 7)) + esc(pad(p.name, 28)) + sp(pad(p.org, 13), C.blue) + st + esc(pad(age(p), 7)) + sp(p.tags.join(','), C.muted);
      h += '<div data-i="' + i + '" style="padding:0 14px;white-space:pre;cursor:pointer;' + (i === state.sel ? 'background:' + C.sel + ';box-shadow:inset 2px 0 0 ' + C.blue : '') + '">' + line + '</div>';
    });
    body.innerHTML = h;
    Array.prototype.forEach.call(body.querySelectorAll('[data-i]'), function (el) {
      el.onclick = function () { state.sel = +el.getAttribute('data-i'); describe(rows[state.sel]); };
      el.onmouseenter = function () { if (state.sel !== +el.getAttribute('data-i')) { state.sel = +el.getAttribute('data-i'); renderList(); } };
    });
    var cur = body.querySelector('[data-i="' + state.sel + '"]');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
    foot.innerHTML = key('↑↓/jk', 'navigate') + key('enter', 'describe') + key('y', 'yaml') + key('/', 'filter') + key('0-7', 'tags') + key('esc', 'close') +
      '<a href="' + GITHUB + '" target="_blank" rel="noopener" style="margin-left:auto;color:' + C.blue + '">github.com/andrei-bamboi ↗</a>';
  }
  function key(k, label) { return '<span><span style="color:' + C.blue + '">&lt;' + esc(k) + '&gt;</span> ' + esc(label) + '</span>'; }

  async function describe(p) {
    if (!p) return;
    state.view = 'describe'; state.current = p;
    var token = state.token = {};
    body.innerHTML = '';
    var box = document.createElement('div'); box.style.cssText = 'padding:4px 14px'; body.appendChild(box);
    function ln(html) { var d = document.createElement('div'); d.innerHTML = html || '&nbsp;'; box.appendChild(d); return d; }
    var d0 = ln(sp('⠋', C.blue) + ' kubectl describe project/' + esc(p.name));
    for (var i = 0; i < 6; i++) { await sleep(45); if (state.token !== token) return; d0.innerHTML = sp('⠋⠙⠹⠸⠼⠴'[i], C.blue) + ' kubectl describe project/' + esc(p.name); }
    d0.innerHTML = sp('$', C.green) + ' kubectl describe project/' + esc(p.name);
    ln();
    var rows = [
      ['Name', esc(p.title)], ['Namespace', sp(p.org, C.blue)], ['PID', p.pid],
      ['Status', running(p) ? sp('● Running', C.green) : sp('✓ Completed', C.muted)],
      ['Period', esc(p.from + ' → ' + (p.to || 'present')) + sp('  (' + age(p) + ')', C.muted)],
      ['Labels', p.tags.map(function (t) { return sp('tag=' + t, C.yellow); }).join(', ')]
    ];
    for (var r = 0; r < rows.length; r++) { if (state.token !== token) return; ln(sp(pad(rows[r][0] + ':', 12), C.blue) + rows[r][1]); await sleep(25); }
    ln(); ln(sp('Containers (stack):', C.blue));
    p.stack.forEach(function (s) { ln('  ' + sp('▸', C.green) + ' ' + esc(s) + '  ' + sp('Ready', C.green)); });
    ln(); ln(sp('Events:', C.blue));
    ln(sp('  TYPE     REASON      MESSAGE', C.muted));
    for (var n = 0; n < p.notes.length; n++) {
      if (state.token !== token) return;
      ln('  ' + sp('Normal', C.green) + '   ' + pad(n === 0 ? 'Delivered' : 'Shipped', 11) + ' ' + esc(p.notes[n]));
      await sleep(60);
    }
    ln();
    foot.innerHTML = key('esc/←', 'back') + key('y', 'yaml') + key('j/k', 'next/prev project') +
      '<a href="#contact" data-ask style="margin-left:auto;color:' + C.green + '">ask me about this →</a>';
    foot.querySelector('[data-ask]').onclick = function (e) {
      e.preventDefault(); close();
      if (window.openSendMessage) window.openSendMessage(); else location.hash = 'contact';
    };
  }

  function yaml(p) {
    if (!p) return;
    state.view = 'yaml'; state.current = p; state.token = {};
    var K = function (k, ind) { return ' '.repeat(ind || 0) + sp(k + ':', C.blue); };
    var V = function (v) { return sp(v, C.green); };
    var lines = [
      K('apiVersion') + ' ' + V('career.andrei.dev/v1'), K('kind') + ' ' + V('Project'), K('metadata'),
      K('name', 2) + ' ' + V(p.name), K('namespace', 2) + ' ' + V(p.org.toLowerCase().replace(/\s+/g, '-')),
      K('labels', 2)
    ].concat(p.tags.map(function (t) { return '    ' + sp('tag/' + t + ':', C.blue) + ' ' + V('"true"'); })).concat([
      K('spec'), K('title', 2) + ' ' + V('"' + p.title + '"'), K('period', 2),
      K('from', 4) + ' ' + V(p.from), K('to', 4) + ' ' + V(p.to || 'null  # still running'),
      K('stack', 2)
    ]).concat(p.stack.map(function (s) { return '    - ' + V(s); })).concat([K('outcomes', 2)])
      .concat(p.notes.map(function (s) { return '    - ' + V('"' + s.replace(/"/g, '\\"') + '"'); }))
      .concat([K('status'), K('phase', 2) + ' ' + V(running(p) ? 'Running' : 'Succeeded'), K('age', 2) + ' ' + V(age(p))]);
    body.innerHTML = '<div style="padding:4px 14px;white-space:pre-wrap">' + sp('# kubectl get project/' + p.name + ' -o yaml', C.muted) + '\n' + lines.join('\n') + '</div>';
    foot.innerHTML = key('esc/←', 'back') + key('d', 'describe') + key('j/k', 'next/prev project');
  }

  function render() {
    renderHead(); renderTabs();
    if (state.view === 'list') renderList();
  }

  async function boot() {
    state.view = 'boot';
    renderHead(); renderTabs();
    body.innerHTML = '';
    var lines = ['Connecting to context andrei@career…', 'Loading 13 years of history from git log…', 'Indexing ' + PROJECTS.length + ' projects across ' + Object.keys(PROJECTS.reduce(function (o, p) { o[p.org] = 1; return o; }, {})).length + ' orgs…'];
    for (var i = 0; i < lines.length; i++) {
      var d = document.createElement('div'); d.style.padding = '0 14px'; body.appendChild(d);
      for (var f = 0; f < 5; f++) { if (state.view !== 'boot') return; d.innerHTML = sp('⠋⠙⠹⠸⠼'[f], C.blue) + ' ' + esc(lines[i]); await sleep(55); }
      d.innerHTML = sp('[ OK ]', C.green) + ' ' + esc(lines[i]);
    }
    await sleep(150);
    if (state.view !== 'boot') return;
    state.view = 'list'; render();
  }

  function open(pid) {
    ov.style.display = 'flex'; document.body.style.overflow = 'hidden';
    state.filter = ''; state.filtering = false; state.tag = 'all'; state.sel = 0;
    if (pid) {
      state.view = 'list'; render();
      var idx = list().map(function (p) { return p.pid; }).indexOf(+pid);
      if (idx > -1) { state.sel = idx; renderList(); describe(list()[idx]); return; }
    }
    boot();
  }
  function close() { state.view = 'closed'; state.token = {}; ov.style.display = 'none'; document.body.style.overflow = ''; }

  document.addEventListener('keydown', function (e) {
    if (ov.style.display !== 'flex') return;
    e.stopPropagation();
    var k = e.key, rows = list();
    if (state.filtering) {
      e.preventDefault();
      if (k === 'Enter') state.filtering = false;
      else if (k === 'Escape') { state.filtering = false; state.filter = ''; }
      else if (k === 'Backspace') state.filter = state.filter.slice(0, -1);
      else if (k.length === 1) { state.filter += k; state.sel = 0; }
      render(); return;
    }
    if (state.view === 'describe' || state.view === 'yaml') {
      if (k === 'Escape' || k === 'ArrowLeft' || k === 'q' || k === 'Backspace') { e.preventDefault(); state.view = 'list'; state.token = {}; render(); }
      else if (k === 'y') yaml(state.current);
      else if (k === 'd' || k === 'Enter') describe(state.current);
      else if (k === 'j' || k === 'ArrowDown' || k === 'k' || k === 'ArrowUp') {
        e.preventDefault();
        var i = rows.indexOf(state.current) + ((k === 'j' || k === 'ArrowDown') ? 1 : -1);
        if (i >= 0 && i < rows.length) { state.sel = i; (state.view === 'yaml' ? yaml : describe)(rows[i]); }
      }
      return;
    }
    if (k === 'Escape' || k === 'q') {
      e.preventDefault();
      if (state.filter) { state.filter = ''; render(); } else close();
    } else if (k === 'ArrowDown' || k === 'j') { e.preventDefault(); state.sel = Math.min(rows.length - 1, state.sel + 1); renderList(); }
    else if (k === 'ArrowUp' || k === 'k') { e.preventDefault(); state.sel = Math.max(0, state.sel - 1); renderList(); }
    else if (k === 'Enter' || k === 'd' || k === 'ArrowRight') { e.preventDefault(); describe(rows[state.sel]); }
    else if (k === 'y') yaml(rows[state.sel]);
    else if (k === '/') { e.preventDefault(); state.filtering = true; state.filter = ''; render(); }
    else if (/^[0-7]$/.test(k)) { state.tag = TAGS[+k][0]; state.sel = 0; render(); }
  }, true);
  ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) close(); });
  window.addEventListener('resize', function () { if (ov.style.display === 'flex' && state.view === 'list') render(); });

  // ---------- hooks ----------
  Array.prototype.forEach.call(document.querySelectorAll('a'), function (a) {
    var t = a.textContent.trim();
    if (/view_all_(projects|on_github)/.test(t)) {
      a.textContent = '> ./view_all_projects';
      a.setAttribute('href', '#projects');
      a.removeAttribute('target');
      a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(); }, true);
    }
  });
  // Project cards on the page open straight into "describe"
  var section = document.getElementById('projects');
  if (section) Array.prototype.forEach.call(section.querySelectorAll('.bg-card'), function (card) {
    var pidEl = card.querySelector('.w-14');
    if (!pidEl) return;
    card.style.cursor = 'pointer';
    card.title = 'Open in project explorer';
    card.addEventListener('click', function () { open(pidEl.textContent.trim()); });
  });

  window.openProjectExplorer = open;
  if (window.Term && window.Term.cmds) {
    var cmd = function (a) {
      var t = document.querySelector('[aria-label="Terminal"]');
      if (t) t.parentNode.style.display = 'none';
      document.body.style.overflow = '';
      setTimeout(function () { open(a && a[0]); }, 50);
      return ['Launching k9s…'];
    };
    window.Term.cmds.k9s = window.Term.cmds.explore = window.Term.cmds['./view_all_projects'] = window.Term.cmds.view_all_projects = cmd;
  }
})();
