// DevOps playground for the terminal — simulated, safe, and just for fun.
// Load after terminal.js. Every command here is fake output; nothing touches a real system.
(function () {
  var T = window.Term;
  if (!T || !T.cmds) return;
  var cmds = T.cmds, C = T.C, esc = T.esc, pad = T.pad, print = T.print;

  // ---------- helpers ----------
  function h(s) { return { html: s }; }
  function s(t, col) { return '<span style="color:' + col + '">' + esc(t) + '</span>'; }
  function c(t, col) { return h(s(t, col)); }
  function g(t) { return s(t, C.green); }
  function b(t) { return s(t, C.blue); }
  function m(t) { return s(t, C.muted); }
  function r(t) { return s(t, C.red); }
  function y(t) { return s(t, C.yellow); }
  function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function rnd(a, z) { return Math.floor(a + Math.random() * (z - a + 1)); }
  function hex(n) { var o = ''; while (o.length < n) o += Math.random().toString(16).slice(2); return o.slice(0, n); }
  function table(head, rows) {
    var w = head.map(function (_, i) { return Math.max.apply(null, [head[i].length].concat(rows.map(function (row) { return String(row[i].t || row[i]).length; }))) + 3; });
    return [c(head.map(function (x, i) { return pad(x, w[i]); }).join(''), C.muted)].concat(rows.map(function (row) {
      return h(row.map(function (cell, i) {
        var txt = cell.t != null ? cell.t : cell;
        return cell.col ? s(pad(txt, w[i]), cell.col) : esc(pad(txt, w[i]));
      }).join(''));
    }));
  }
  async function stream(lines, ms) {
    for (var i = 0; i < lines.length; i++) {
      if (T.aborted) { print([c('^C', C.muted)]); throw 'interrupted'; }
      print([lines[i]]);
      await sleep(typeof ms === 'function' ? ms() : ms);
    }
  }
  async function progress(label, ms) {
    var el = print([h('')]);
    for (var i = 0; i <= 20; i++) {
      if (T.aborted) { print([c('^C', C.muted)]); throw 'interrupted'; }
      el.innerHTML = esc(label) + ' [' + g('█'.repeat(i)) + m('░'.repeat(20 - i)) + '] ' + (i * 5) + '%';
      await sleep(ms / 20);
    }
  }
  async function spin(label, ms) {
    var fr = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏', el = print([h('')]), t0 = Date.now(), i = 0;
    while (Date.now() - t0 < ms) {
      if (T.aborted) { print([c('^C', C.muted)]); throw 'interrupted'; }
      el.innerHTML = b(fr[i++ % fr.length]) + ' ' + esc(label); await sleep(80);
    }
    el.innerHTML = g('✓') + ' ' + esc(label);
  }
  function wrap(fn) { return function (a) { return fn(a || []).catch(function (e) { if (e !== 'interrupted') throw e; }); }; }
  function usage(list) { return [c('usage:', C.muted)].concat(list.map(function (x) { return h('  ' + b(x)); })); }

  // ---------- shared cluster state ----------
  var pods = [
    ['portfolio-web-7f9c8d-x2k4p', 'web'], ['portfolio-web-7f9c8d-m8n2b', 'web'], ['portfolio-web-7f9c8d-p0q7r', 'web'],
    ['api-gateway-6d4b9-k3l5n', 'api'], ['api-gateway-6d4b9-w2e8t', 'api'],
    ['prometheus-server-0', 'mon'], ['grafana-5c8f7-z9y1x', 'mon'], ['argocd-server-7b9d-h4j6k', 'gitops'],
    ['coffee-maker-5b6d7-q9z1m', 'misc'], ['legacy-monolith-1a2b3-zzzzz', 'legacy']
  ].map(function (p) { return { name: p[0], app: p[1], status: p[1] === 'legacy' ? 'CrashLoopBackOff' : 'Running', restarts: p[1] === 'legacy' ? 42 : rnd(0, 2), age: rnd(2, 40) + 'd' }; });
  var replicas = { 'portfolio-web': 3, 'api-gateway': 2 };
  var nodes = ['ip-10-0-1-21', 'ip-10-0-2-37', 'ip-10-0-3-54', 'aks-pool1-0001', 'aks-pool1-0002'];

  // ---------- Kubernetes ----------
  var kubectl = wrap(async function (a) {
    var cmd = a.join(' ');
    if (/^get (pods|po)( -A| --all-namespaces)?$/.test(cmd) || cmd === 'get pods -o wide') {
      return print(table(['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE'], pods.map(function (p) {
        var ok = p.status === 'Running';
        return [p.name, ok ? '1/1' : '0/1', { t: p.status, col: ok ? C.green : p.status === 'Terminating' ? C.yellow : C.red }, p.restarts, p.age];
      })));
    }
    if (/^get (nodes|no)/.test(cmd)) return print(table(['NAME', 'STATUS', 'ROLES', 'AGE', 'VERSION'], nodes.map(function (n, i) {
      return [n, { t: 'Ready', col: C.green }, i === 0 ? 'control-plane' : '<none>', rnd(90, 400) + 'd', 'v1.31.' + rnd(1, 4)];
    })));
    if (/^get (svc|services)/.test(cmd)) return print(table(['NAME', 'TYPE', 'CLUSTER-IP', 'EXTERNAL-IP', 'PORT(S)'], [
      ['portfolio-web', 'ClusterIP', '10.96.12.40', '<none>', '80/TCP'], ['api-gateway', 'LoadBalancer', '10.96.88.3', 'a1b2c3.elb.amazonaws.com', '443:31443/TCP'],
      ['prometheus', 'ClusterIP', '10.96.0.90', '<none>', '9090/TCP'], ['grafana', 'ClusterIP', '10.96.0.91', '<none>', '3000/TCP']]));
    if (/^get (ns|namespaces)/.test(cmd)) return print(table(['NAME', 'STATUS', 'AGE'], ['default', 'kube-system', 'monitoring', 'argocd', 'istio-system', 'vault', 'production'].map(function (n) { return [n, { t: 'Active', col: C.green }, rnd(100, 600) + 'd']; })));
    if (/^get (deploy|deployments)/.test(cmd)) return print(table(['NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE'], Object.keys(replicas).map(function (k) { return [k, replicas[k] + '/' + replicas[k], replicas[k], replicas[k]]; }).concat([['legacy-monolith', '0/1', 1, 0]])));
    if (/^get hpa/.test(cmd)) return print(table(['NAME', 'TARGETS', 'MINPODS', 'MAXPODS', 'REPLICAS'], [['portfolio-web', 'cpu: 34%/70%', 3, 20, replicas['portfolio-web']], ['api-gateway', 'cpu: 51%/70%', 2, 30, replicas['api-gateway']]]));
    if (/^top (nodes|no)/.test(cmd)) return print(table(['NAME', 'CPU(cores)', 'CPU%', 'MEMORY(bytes)', 'MEMORY%'], nodes.map(function (n) { var cp = rnd(12, 68), mp = rnd(30, 75); return [n, Math.round(cp * 40) + 'm', { t: cp + '%', col: cp > 60 ? C.yellow : C.green }, Math.round(mp * 160) + 'Mi', mp + '%']; })));
    if (/^top (pods|po)/.test(cmd)) return print(table(['NAME', 'CPU(cores)', 'MEMORY(bytes)'], pods.filter(function (p) { return p.status === 'Running'; }).map(function (p) { return [p.name, rnd(2, 250) + 'm', rnd(40, 900) + 'Mi']; })));
    if (/^describe (pod|po) /.test(cmd)) {
      var pod = pods.filter(function (p) { return p.name.indexOf(a[2]) === 0; })[0];
      if (!pod) return print([c('Error from server (NotFound): pods "' + a[2] + '" not found', C.red)]);
      return print([h(b('Name:') + '         ' + esc(pod.name)), h(b('Namespace:') + '    production'), h(b('Node:') + '         ' + nodes[rnd(0, 4)] + '/10.0.' + rnd(1, 3) + '.' + rnd(10, 250)),
        h(b('Status:') + '       ' + (pod.status === 'Running' ? g(pod.status) : r(pod.status))), h(b('IP:') + '           10.244.' + rnd(0, 9) + '.' + rnd(2, 250)),
        h(b('Containers:')), '  ' + pod.app + ':', '    Image:    registry.gitlab.com/andrei/' + pod.app + ':' + hex(8),
        '    Limits:   cpu: 500m, memory: 512Mi', '    Liveness: http-get :8080/healthz delay=10s period=10s',
        h(b('Events:')), pod.status === 'Running' ? m('  Normal  Started  kubelet  Started container ' + pod.app)
          : r('  Warning BackOff  kubelet  Back-off restarting failed container (it was written in 2009, be gentle)')]);
    }
    if (/^logs /.test(cmd)) {
      var lp = pods.filter(function (p) { return p.name.indexOf(a[1]) === 0; })[0];
      if (!lp) return print([c('error: pod "' + a[1] + '" not found. Try: kubectl logs portfolio-web', C.red)]);
      var paths = ['/', '/about', '/projects', '/contact', '/healthz', '/metrics'], codes = [200, 200, 200, 200, 304, 200, 404];
      var lines = [];
      if (lp.app === 'legacy') lines = ['Starting LegacyMonolith v0.9-final-FINAL-2…', 'Connecting to db at 192.168.0.12…', r('FATAL: java.lang.OutOfMemoryError: Java heap space'), m('(this pod has been crashing since before Kubernetes was cool)')].map(function (x) { return typeof x === 'string' ? x : h(x); });
      else for (var i = 0; i < 14; i++) { var code = codes[rnd(0, codes.length - 1)]; lines.push(h(m(new Date().toISOString()) + ' ' + (code >= 400 ? y('' + code) : g('' + code)) + ' GET ' + esc(paths[rnd(0, 5)]) + ' ' + rnd(2, 48) + 'ms')); }
      return stream(lines, function () { return rnd(80, 260); });
    }
    if (/^rollout restart/.test(cmd)) {
      var dep = (a[2] || 'deploy/portfolio-web').replace(/^(deploy|deployment)\//, '');
      if (!replicas[dep]) return print([c('error: deployments "' + dep + '" not found', C.red)]);
      print(['deployment.apps/' + dep + ' restarted']);
      var n = replicas[dep];
      for (var k = 1; k <= n; k++) await stream([h('Waiting for deployment "' + dep + '" rollout to finish: ' + k + ' of ' + n + ' updated replicas are available...')], rnd(500, 900));
      pods.forEach(function (p) { if (p.app === (dep === 'portfolio-web' ? 'web' : 'api')) { p.name = p.name.replace(/-[a-z0-9]{5}$/, '-' + hex(5)); p.age = '4s'; p.restarts = 0; } });
      return print([h(g('deployment "' + dep + '" successfully rolled out'))]);
    }
    if (/^scale /.test(cmd)) {
      var mm = cmd.match(/scale (?:deploy(?:ment)?\/)?([\w-]+) --replicas[= ](\d+)/);
      if (!mm || !replicas[mm[1]]) return print(usage(['kubectl scale deploy/portfolio-web --replicas=5']));
      var want = Math.min(+mm[2], 50), app = mm[1] === 'portfolio-web' ? 'web' : 'api';
      replicas[mm[1]] = want;
      var cur = pods.filter(function (p) { return p.app === app; });
      while (cur.length < want) { var np = { name: mm[1] + '-7f9c8d-' + hex(5), app: app, status: 'Running', restarts: 0, age: '1s' }; pods.splice(pods.indexOf(cur[cur.length - 1]) + 1, 0, np); cur.push(np); }
      while (cur.length > want) { pods.splice(pods.indexOf(cur.pop()), 1); }
      return print(['deployment.apps/' + mm[1] + ' scaled', +mm[2] > 50 ? c('(capped at 50 — the cloud bill says hi)', C.muted) : '']);
    }
    if (/^apply -f/.test(cmd)) return stream(['deployment.apps/portfolio-web configured', 'service/portfolio-web unchanged', 'horizontalpodautoscaler.autoscaling/portfolio-web unchanged', 'networkpolicy.networking.k8s.io/default-deny unchanged'], 220);
    if (cmd === 'version') return print(['Client Version: v1.31.2', 'Kustomize Version: v5.4.2', 'Server Version: v1.31.1-eks']);
    if (cmd === 'cluster-info') return print([h('Kubernetes control plane is running at ' + b('https://k8s.prod.andreibamboi.dev')), h('CoreDNS is running at ' + b('https://k8s.prod.andreibamboi.dev/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy'))]);
    if (/^delete (pod|po) /.test(cmd)) return cmds.chaos([a[2]]);
    print(usage(['kubectl get pods|nodes|svc|ns|deploy|hpa', 'kubectl top nodes|pods', 'kubectl describe pod <name>', 'kubectl logs <pod>',
      'kubectl rollout restart deploy/portfolio-web', 'kubectl scale deploy/portfolio-web --replicas=5', 'kubectl delete pod <name>', 'kubectl apply -f k8s/', 'kubectl cluster-info']));
  });
  cmds.kubectl = kubectl; cmds.k = kubectl;
  T.subs.kubectl = T.subs.k = ['get', 'top', 'describe', 'logs', 'rollout', 'scale', 'apply', 'delete', 'version', 'cluster-info',
    'get pods', 'get nodes', 'get svc', 'get ns', 'get deploy', 'get hpa', 'top nodes', 'top pods', 'describe pod', 'rollout restart', 'delete pod', 'logs portfolio-web'];

  cmds.chaos = wrap(async function (a) {
    var alive = pods.filter(function (p) { return p.status === 'Running' && p.app !== 'misc'; });
    var victim = a[0] ? pods.filter(function (p) { return p.name.indexOf(a[0]) === 0; })[0] : alive[rnd(0, alive.length - 1)];
    if (!victim) return print([c('chaos: no such pod', C.red)]);
    await stream([h(y('🐒 chaos-monkey') + ' selected victim: ' + b(victim.name)), 'pod "' + victim.name + '" deleted'], 500);
    victim.status = 'Terminating';
    await stream([h(m('ReplicaSet controller noticed: desired=3, current=2')), h(m('Scheduling replacement pod…'))], 600);
    var nn = victim.name.replace(/-[a-z0-9]{5}$/, '-' + hex(5));
    await stream([h(esc(nn) + '   0/1   ' + y('ContainerCreating')), h(esc(nn) + '   0/1   ' + y('Running (readiness probe pending)')), h(esc(nn) + '   1/1   ' + g('Running'))], 700);
    victim.name = nn; victim.status = 'Running'; victim.age = '3s'; victim.restarts = 0;
    print([h(g('✓ Self-healed in ' + (rnd(18, 34) / 10) + 's.') + ' ' + m('Users noticed: nothing. That\'s the point.'))]);
  });

  cmds.helm = wrap(async function (a) {
    var cmd = a.join(' ');
    if (/^(list|ls)/.test(cmd)) return print(table(['NAME', 'NAMESPACE', 'REVISION', 'STATUS', 'CHART', 'APP VERSION'], [
      ['portfolio', 'production', 27, { t: 'deployed', col: C.green }, 'portfolio-1.8.3', '2.4.0'], ['kube-prometheus-stack', 'monitoring', 14, { t: 'deployed', col: C.green }, 'kube-prometheus-stack-65.1.0', 'v0.77.1'],
      ['argo-cd', 'argocd', 9, { t: 'deployed', col: C.green }, 'argo-cd-7.6.8', 'v2.12.4'], ['vault', 'vault', 6, { t: 'deployed', col: C.green }, 'vault-0.28.1', '1.17.2'],
      ['istio-base', 'istio-system', 4, { t: 'deployed', col: C.green }, 'base-1.23.2', '1.23.2']]));
    if (/^(upgrade|install)/.test(cmd)) {
      await spin('Rendering chart portfolio-1.8.4', 700);
      await stream(['Release "portfolio" has been upgraded. Happy Helming!', 'NAME: portfolio', 'NAMESPACE: production', h('STATUS: ' + g('deployed')), 'REVISION: 28'], 200);
      return;
    }
    if (/^rollback/.test(cmd)) return stream([h(g('Rollback was a success! Happy Helming!'))], 300);
    print(usage(['helm list -A', 'helm upgrade --install portfolio ./chart', 'helm rollback portfolio 26']));
  });
  T.subs.helm = ['list', 'upgrade', 'install', 'rollback'];

  // ---------- Containers ----------
  cmds.docker = wrap(async function (a) {
    var cmd = a.join(' ');
    if (/^ps/.test(cmd)) return print(table(['CONTAINER ID', 'IMAGE', 'STATUS', 'PORTS', 'NAMES'], [
      [hex(12), 'portfolio:2.4.0', { t: 'Up 3 days (healthy)', col: C.green }, '0.0.0.0:8080->8080/tcp', 'portfolio'],
      [hex(12), 'postgres:16-alpine', { t: 'Up 3 days (healthy)', col: C.green }, '5432/tcp', 'db'],
      [hex(12), 'redis:7-alpine', { t: 'Up 3 days', col: C.green }, '6379/tcp', 'cache'],
      [hex(12), 'traefik:v3.1', { t: 'Up 3 days', col: C.green }, '0.0.0.0:443->443/tcp', 'proxy']]));
    if (/^images/.test(cmd)) return print(table(['REPOSITORY', 'TAG', 'IMAGE ID', 'SIZE'], [
      ['portfolio', '2.4.0', hex(12), '18.2MB'], ['portfolio', 'latest', hex(12), '18.2MB'], ['postgres', '16-alpine', hex(12), '243MB'],
      ['redis', '7-alpine', hex(12), '41MB'], ['ubuntu', '12.04', hex(12), { t: '…please don\'t', col: C.muted }]]));
    if (/^build/.test(cmd)) {
      var steps = ['FROM node:22-alpine AS build', 'WORKDIR /app', 'COPY package*.json ./', 'RUN npm ci --omit=dev', 'COPY . .', 'RUN npm run build', 'FROM gcr.io/distroless/nodejs22', 'COPY --from=build /app/dist /app', 'USER nonroot'];
      print([h(b('[+] Building') + ' multi-stage, BuildKit enabled')]);
      for (var i = 0; i < steps.length; i++) await stream([h(m(' => [' + (i + 1) + '/' + steps.length + '] ') + esc(steps[i]) + (i === 3 || i === 5 ? '' : m('  CACHED')))], i === 3 || i === 5 ? 900 : 160);
      return stream([h(' => exporting to image  ' + g('done')), h(' => naming to ' + b('registry.gitlab.com/andrei/portfolio:' + hex(8))), h(g('Image size: 18.2MB') + m(' (distroless, non-root, 0 critical CVEs)'))], 250);
    }
    if (/^compose up/.test(cmd)) return stream([h(b('[+] Running 4/4')), h(' ✔ Network portfolio_default  ' + g('Created')), h(' ✔ Container db          ' + g('Healthy')), h(' ✔ Container cache       ' + g('Started')), h(' ✔ Container portfolio   ' + g('Started'))], 350);
    if (/^stats/.test(cmd)) return print(table(['NAME', 'CPU %', 'MEM USAGE / LIMIT', 'NET I/O'], [['portfolio', rnd(1, 9) + '.' + rnd(0, 9) + '%', '84MiB / 512MiB', '1.2GB / 3.4GB'], ['db', rnd(0, 4) + '.' + rnd(0, 9) + '%', '210MiB / 1GiB', '640MB / 410MB'], ['cache', '0.3%', '12MiB / 256MiB', '88MB / 91MB']]));
    print(usage(['docker ps', 'docker images', 'docker build -t portfolio .', 'docker compose up -d', 'docker stats']));
  });
  T.subs.docker = ['ps', 'images', 'build', 'compose', 'stats', 'compose up'];

  // ---------- Infrastructure as Code ----------
  cmds.terraform = cmds.tf = wrap(async function (a) {
    var sub = a[0];
    if (sub === 'init') return stream([h(b('Initializing the backend...')), h('Successfully configured the backend "' + b('s3') + '" (state locking via DynamoDB)'), h(b('Initializing provider plugins...')),
      '- Installing hashicorp/aws v5.72.1...', '- Installing hashicorp/azurerm v4.6.0...', '- Installing cloudflare/cloudflare v4.44.0...', '- Installing hashicorp/vault v4.4.0...', '', h(g('Terraform has been successfully initialized!'))], 220);
    if (sub === 'validate') return print([h(g('Success!') + ' The configuration is valid.')]);
    if (sub === 'fmt') return print(['modules/eks/main.tf', m('(1 file reformatted — someone used tabs again)')].map(function (x) { return typeof x === 'string' ? x : h(x); }));
    if (sub === 'plan') {
      await spin('Refreshing state... (214 resources)', 1200);
      return print([
        h('  ' + g('+') + ' resource "aws_eks_node_group" "spot_burst" {'), h('      ' + g('+') + ' instance_types = ["m7g.large", "m6g.large"]'), h('      ' + g('+') + ' capacity_type  = "SPOT"'), '    }',
        h('  ' + y('~') + ' resource "cloudflare_ruleset" "waf" {'), h('      ' + y('~') + ' rules = 12 ' + m('->') + ' 13'), '    }',
        h('  ' + g('+') + ' resource "collaboration" "you_and_andrei" {'), h('      ' + g('+') + ' status = "pending your message"'), '    }', '',
        h(b('Plan:') + ' 2 to add, 1 to change, 0 to destroy.'), c('Run `terraform apply` to make it so — or `contact` to apply the last one.', C.muted)]);
    }
    if (sub === 'apply') {
      print([h(b('Plan:') + ' 2 to add, 1 to change, 0 to destroy.'), h('Enter a value: ' + g('yes'))]);
      var res = [['aws_eks_node_group.spot_burst', 'Creating', 14], ['cloudflare_ruleset.waf', 'Modifying', 3], ['collaboration.you_and_andrei', 'Creating', 1]];
      for (var i = 0; i < res.length; i++) {
        await stream([h(b(res[i][0]) + ': ' + res[i][1] + '...')], 300);
        await sleep(res[i][2] * 60);
        print([h(b(res[i][0]) + ': ' + (res[i][1] === 'Creating' ? 'Creation' : 'Modifications') + ' complete after ' + res[i][2] + 's')]);
      }
      return print(['', h(g('Apply complete! Resources: 2 added, 1 changed, 0 destroyed.')), c('Next step for collaboration.you_and_andrei → run `contact`', C.muted)]);
    }
    if (sub === 'state' && a[1] === 'list') return print(['module.vpc.aws_vpc.main', 'module.vpc.aws_subnet.private[0]', 'module.vpc.aws_subnet.private[1]', 'module.vpc.aws_subnet.private[2]', 'module.eks.aws_eks_cluster.this', 'module.eks.aws_eks_node_group.default', 'module.aks.azurerm_kubernetes_cluster.this', 'cloudflare_record.apex', 'cloudflare_ruleset.waf', 'vault_kv_secret_v2.app', c('… 204 more', C.muted)]);
    if (sub === 'output') return print([h(b('cluster_endpoint') + ' = "https://k8s.prod.andreibamboi.dev"'), h(b('regions') + ' = ["eu-central-1", "eu-west-1", "westeurope"]'), h(b('db_password') + ' = ' + m('<sensitive>'))]);
    if (sub === 'destroy') return print([c('Error: Instance cannot be destroyed — lifecycle.prevent_destroy = true. (Learned that one the hard way.)', C.red)]);
    print(usage(['terraform init', 'terraform plan', 'terraform apply', 'terraform state list', 'terraform output', 'terraform validate | fmt | destroy']));
  });
  T.subs.terraform = T.subs.tf = ['init', 'plan', 'apply', 'validate', 'fmt', 'state', 'output', 'destroy', 'state list'];

  cmds['ansible-playbook'] = wrap(async function (a) {
    var hosts = ['web-01', 'web-02', 'db-01', 'bastion'];
    var tasks = [['Gathering Facts', 'ok'], ['common : update apt cache', 'ok'], ['common : harden sshd_config', 'ok'], ['users : ensure deploy user exists', 'ok'],
      ['docker : install docker-ce', 'ok'], ['node_exporter : deploy metrics exporter', 'changed'], ['checkmk : register agent', 'ok'], ['ufw : allow 22,443 only', 'ok']];
    print([h(b('PLAY [Configure fleet: ' + (a[0] || 'site.yml') + '] ') + m('*'.repeat(28)))]);
    var tally = {};
    hosts.forEach(function (x) { tally[x] = { ok: 0, changed: 0 }; });
    for (var i = 0; i < tasks.length; i++) {
      await stream(['', h(b('TASK [' + tasks[i][0] + '] ') + m('*'.repeat(10)))], 150);
      for (var j = 0; j < hosts.length; j++) {
        var st = tasks[i][1] === 'changed' && Math.random() > .3 ? 'changed' : 'ok';
        tally[hosts[j]][st]++; if (st === 'changed') tally[hosts[j]].ok++;
        await stream([h((st === 'ok' ? g('ok') : y('changed')) + ': [' + hosts[j] + ']')], 70);
      }
    }
    print(['', h(b('PLAY RECAP ') + m('*'.repeat(30)))].concat(hosts.map(function (x) {
      return h(pad(x, 12) + ': ' + g('ok=' + tally[x].ok) + '  ' + y('changed=' + tally[x].changed) + '  unreachable=0  ' + 'failed=0');
    })));
  });
  cmds.ansible = wrap(async function (a) {
    if (a.indexOf('ping') < 0) return print(usage(['ansible all -m ping', 'ansible-playbook site.yml']));
    var hosts = ['web-01', 'web-02', 'db-01', 'bastion'];
    return stream(hosts.map(function (x) { return h(g(x + ' | SUCCESS => {"ping": "pong"}')); }), 200);
  });
  T.subs.ansible = ['all'];
  T.subs['ansible-playbook'] = ['site.yml', 'hardening.yml'];

  // ---------- GitOps & CI/CD ----------
  cmds.argocd = wrap(async function (a) {
    var cmd = a.join(' ');
    if (/^app (list|ls)/.test(cmd)) return print(table(['NAME', 'CLUSTER', 'NAMESPACE', 'STATUS', 'HEALTH'], [
      ['portfolio', 'eks-prod-eu', 'production', { t: 'Synced', col: C.green }, { t: 'Healthy', col: C.green }],
      ['api-gateway', 'eks-prod-eu', 'production', { t: 'Synced', col: C.green }, { t: 'Healthy', col: C.green }],
      ['monitoring', 'eks-prod-eu', 'monitoring', { t: 'Synced', col: C.green }, { t: 'Healthy', col: C.green }],
      ['portfolio-dr', 'aks-dr-weu', 'production', { t: 'Synced', col: C.green }, { t: 'Healthy', col: C.green }],
      ['legacy-monolith', 'onprem-rke', 'legacy', { t: 'OutOfSync', col: C.yellow }, { t: 'Degraded', col: C.red }]]));
    if (/^app sync/.test(cmd)) {
      var app = a[2] || 'portfolio';
      await spin('Comparing desired state (git) with live state (' + app + ')', 900);
      return stream(['Deployment   production   ' + app + '   ' + 'configured', 'Service      production   ' + app + '   unchanged', 'HPA          production   ' + app + '   unchanged',
        h('Sync Status: ' + g('Synced') + ' to ' + b(hex(7))), h('Health:      ' + g('Healthy'))], 250);
    }
    print(usage(['argocd app list', 'argocd app sync portfolio']));
  });
  T.subs.argocd = ['app', 'app list', 'app sync'];

  async function pipeline(trigger) {
    var sha = hex(8), id = rnd(18000, 19999);
    print([h(m(trigger)), h(b('GitLab CI') + ' pipeline ' + b('#' + id) + ' for commit ' + y(sha) + ' on ' + g('main'))]);
    var stages = [['lint', ['hadolint', 'tflint', 'yamllint'], 500], ['test', ['unit-tests', 'integration-tests'], 900], ['security', ['trivy image scan', 'checkov IaC scan', 'gitleaks'], 800],
      ['build', ['docker build + push'], 900], ['deploy', ['argocd sync (staging)', 'smoke tests', 'argocd sync (production)'], 900]];
    for (var i = 0; i < stages.length; i++) {
      print([h(b('▸ stage: ' + stages[i][0]))]);
      for (var j = 0; j < stages[i][1].length; j++) {
        await spin(stages[i][1][j], stages[i][2] / stages[i][1].length + rnd(0, 200));
      }
    }
    print([h(g('✓ Pipeline #' + id + ' passed in ' + rnd(3, 5) + 'm ' + rnd(10, 59) + 's') + ' — ' + m('0 critical CVEs · coverage 87% · deployed to eks-prod-eu + aks-dr-weu'))]);
  }
  cmds.deploy = wrap(async function () {
    await pipeline('$ git push origin main');
    await stream([h(m('Canary: 10% → 50% → 100% traffic (Istio)')), h(m('Error rate 0.02% · p99 142ms — within SLO')), h(g('🚀 Shipped. Zero downtime.'))], 500);
  });
  cmds.git = wrap(async function (a) {
    var cmd = a.join(' ');
    if (/^push/.test(cmd)) return pipeline('Enumerating objects: 12, done.\nWriting objects: 100% (7/7), 1.21 KiB | 1.21 MiB/s, done.');
    if (/^log/.test(cmd)) return print([
      ['feat(eks): add spot node group for burst workloads', 2], ['fix(cloudflare): tighten WAF rule for /api', 5], ['chore(helm): bump kube-prometheus-stack to 65.1.0', 9],
      ['feat(vault): rotate DB creds every 24h', 14], ['docs: runbook for region failover', 21], ['fix: it was DNS. it is always DNS.', 30]
    ].map(function (x) { return h(y(hex(7)) + ' ' + esc(x[0]) + ' ' + m('(' + x[1] + ' hours ago)')); }));
    if (/^status/.test(cmd)) return print(['On branch main', 'Your branch is up to date with \'origin/main\'.', '', 'nothing to commit, working tree clean']);
    print(usage(['git status', 'git log', 'git push']));
  });
  T.subs.git = ['status', 'log', 'push'];
  cmds.pipeline = function () { return cmds.deploy(); };
  cmds.jenkins = wrap(async function (a) {
    var job = a[1] || a[0] || 'infra-nightly';
    print([h(b('Jenkins') + ' › ' + esc(job) + ' › #' + rnd(400, 900))]);
    var st = ['Checkout SCM', 'Terraform Plan', 'Approval gate', 'Terraform Apply', 'Ansible: patch fleet', 'Notify Slack'];
    for (var i = 0; i < st.length; i++) await spin('[Pipeline] stage { (' + st[i] + ') }', rnd(300, 650));
    print([h(g('Finished: SUCCESS'))]);
  });
  T.subs.jenkins = ['build'];

  // ---------- Clouds ----------
  cmds.aws = wrap(async function (a) {
    var cmd = a.join(' ');
    if (/^sts get-caller-identity/.test(cmd)) return print(['{', '    "UserId": "AROA' + hex(16).toUpperCase() + ':andrei",', '    "Account": "' + rnd(100000000000, 999999999999) + '",', '    "Arn": "arn:aws:sts::…:assumed-role/PlatformAdmin/andrei"', '}']);
    if (/^ec2 describe-instances/.test(cmd)) return print(table(['INSTANCE', 'TYPE', 'AZ', 'STATE', 'NAME'], [
      ['i-' + hex(17), 'm7g.large', 'eu-central-1a', { t: 'running', col: C.green }, 'eks-node'], ['i-' + hex(17), 'm7g.large', 'eu-central-1b', { t: 'running', col: C.green }, 'eks-node'],
      ['i-' + hex(17), 'm7g.large', 'eu-central-1c', { t: 'running', col: C.green }, 'eks-node'], ['i-' + hex(17), 't4g.micro', 'eu-central-1a', { t: 'running', col: C.green }, 'bastion'],
      ['i-' + hex(17), 'c5.4xlarge', 'eu-central-1a', { t: 'stopped', col: C.yellow }, 'someone-forgot-this']]));
    if (/^s3 ls/.test(cmd)) return print(['2021-03-14 09:12:44 andreibamboi-tfstate', '2021-03-14 09:13:02 andreibamboi-artifacts', '2022-07-01 18:40:19 andreibamboi-backups-eu', '2023-11-20 11:05:51 andreibamboi-cur-reports', '2024-02-02 08:00:00 andreibamboi-loki-chunks']);
    if (/^eks (list-clusters|ls)/.test(cmd)) return print(['{', '    "clusters": [', '        "eks-prod-eu",', '        "eks-prod-eu-west",', '        "eks-staging"', '    ]', '}']);
    if (/^ce|^cost/.test(cmd)) return cmds.cost();
    print(usage(['aws sts get-caller-identity', 'aws ec2 describe-instances', 'aws s3 ls', 'aws eks list-clusters', 'aws ce get-cost-and-usage']));
  });
  T.subs.aws = ['sts', 'ec2', 's3', 'eks', 'ce', 'sts get-caller-identity', 'ec2 describe-instances', 's3 ls', 'eks list-clusters', 'ce get-cost-and-usage'];

  cmds.az = wrap(async function (a) {
    var cmd = a.join(' ');
    if (/^account show/.test(cmd)) return print(['{', '  "name": "Platform-Production",', '  "state": "Enabled",', '  "tenantId": "' + hex(8) + '-' + hex(4) + '-' + hex(4) + '-' + hex(4) + '-' + hex(12) + '",', '  "user": { "name": "andrei@bamboi.dev", "type": "user" }', '}']);
    if (/^vm list/.test(cmd)) return print(table(['Name', 'ResourceGroup', 'Location', 'PowerState'], [['vm-jumpbox-01', 'rg-platform', 'westeurope', { t: 'VM running', col: C.green }], ['vm-build-agent-01', 'rg-ci', 'westeurope', { t: 'VM running', col: C.green }], ['vm-build-agent-02', 'rg-ci', 'westeurope', { t: 'VM deallocated', col: C.muted }]]));
    if (/^aks list/.test(cmd)) return print(table(['Name', 'Location', 'K8sVersion', 'ProvisioningState'], [['aks-dr-weu', 'westeurope', '1.31.1', { t: 'Succeeded', col: C.green }], ['aks-dev-neu', 'northeurope', '1.30.5', { t: 'Succeeded', col: C.green }]]));
    print(usage(['az account show', 'az vm list -o table', 'az aks list -o table']));
  });
  T.subs.az = ['account', 'vm', 'aks', 'account show', 'vm list', 'aks list'];

  cmds.govc = cmds.vsphere = wrap(async function (a) {
    var cmd = a.join(' ');
    if (/^ls/.test(cmd) || !cmd) return print(['/DC-Iasi/vm/rke-cp-01', '/DC-Iasi/vm/rke-cp-02', '/DC-Iasi/vm/rke-cp-03', '/DC-Iasi/vm/rke-worker-01', '/DC-Iasi/vm/rke-worker-02', '/DC-Iasi/vm/checkmk-01', '/DC-Iasi/vm/legacy-monolith (please do not reboot)']);
    if (/^host\.info|^hosts/.test(cmd)) return print(table(['HOST', 'CPU USAGE', 'MEM USAGE', 'VMs', 'STATE'], [['esxi-01.dc', '38%', '61%', 14, { t: 'connected', col: C.green }], ['esxi-02.dc', '42%', '58%', 13, { t: 'connected', col: C.green }], ['esxi-03.dc', '12%', '22%', 4, { t: 'maintenance', col: C.yellow }]]));
    if (/^vm\.info/.test(cmd)) return print([h(b('Name:') + '            rke-worker-01'), h(b('Guest OS:') + '        Ubuntu Linux (64-bit)'), h(b('CPU:') + '             8 vCPU'), h(b('Memory:') + '          32768MB'), h(b('Power state:') + '     ' + g('poweredOn')), h(b('vMotion count:') + '   ' + rnd(3, 30) + ' (it gets around)')]);
    print(usage(['govc ls', 'govc hosts', 'govc vm.info rke-worker-01']));
  });
  T.subs.govc = T.subs.vsphere = ['ls', 'hosts', 'vm.info'];

  cmds.rancher = wrap(async function () {
    return print(table(['CURRENT', 'NAME', 'PROVIDER', 'NODES', 'STATE'], [['*', 'onprem-rke', 'rke2', 5, { t: 'active', col: C.green }], ['', 'eks-prod-eu', 'eks (imported)', 6, { t: 'active', col: C.green }], ['', 'aks-dr-weu', 'aks (imported)', 3, { t: 'active', col: C.green }]]));
  });

  // ---------- Observability ----------
  cmds.grafana = cmds.dashboard = wrap(async function () {
    var spark = '▁▂▃▄▅▆▇█', series = { rps: [], cpu: [], p99: [] };
    for (var i = 0; i < 40; i++) { series.rps.push(rnd(2, 6)); series.cpu.push(rnd(1, 4)); series.p99.push(rnd(1, 3)); }
    var el = print([h('')]);
    for (var t = 0; t < 30; t++) {
      if (T.aborted) { print([c('^C', C.muted)]); return; }
      series.rps.push(Math.max(0, Math.min(7, series.rps[series.rps.length - 1] + rnd(-1, 1)))); series.rps.shift();
      series.cpu.push(Math.max(0, Math.min(7, series.cpu[series.cpu.length - 1] + rnd(-1, 1)))); series.cpu.shift();
      series.p99.push(Math.max(0, Math.min(7, series.p99[series.p99.length - 1] + rnd(-1, 1)))); series.p99.shift();
      var line = function (arr) { return arr.map(function (v) { return spark[v]; }).join(''); };
      var rps = 1800 + series.rps[39] * 160, cpu = 20 + series.cpu[39] * 8, p99 = 90 + series.p99[39] * 18;
      el.innerHTML = [
        b('┌─ Grafana › Production Overview ─────────────── ') + m('live · ' + new Date().toLocaleTimeString()),
        b('│ ') + pad('Requests/s', 14) + g(line(series.rps)) + '  ' + rps,
        b('│ ') + pad('CPU (cluster)', 14) + g(line(series.cpu)) + '  ' + cpu + '%',
        b('│ ') + pad('p99 latency', 14) + (p99 > 190 ? y(line(series.p99)) : g(line(series.p99))) + '  ' + p99 + 'ms',
        b('│ ') + pad('Error rate', 14) + g('0.0' + rnd(1, 4) + '%') + '   ' + pad('Uptime (30d)', 14) + g('99.99%'),
        b('│ ') + pad('Pods ready', 14) + g(pods.filter(function (p) { return p.status === 'Running'; }).length + '/' + pods.length) + '     ' + pad('Alerts firing', 14) + y('1') + m(' (legacy-monolith, as usual)'),
        b('└' + '─'.repeat(62)) + ' ' + m('Ctrl+C to exit')
      ].join('\n');
      body().scrollTop = 1e9;
      await sleep(400);
    }
  });
  function body() { return document.querySelector('[data-body]'); }

  cmds.promql = cmds.prometheus = wrap(async function (a) {
    var q = a.join(' ').replace(/^['"]|['"]$/g, '') || 'up';
    if (q === 'up') return print([c('# PromQL: up', C.muted)].concat(['kubernetes-apiservers', 'node-exporter', 'kube-state-metrics', 'portfolio-web', 'api-gateway', 'cloudflare-exporter', 'legacy-monolith'].map(function (j) {
      var up = j === 'legacy-monolith' ? 0 : 1; return h('up{job="' + b(j) + '"}  ' + (up ? g('1') : r('0')));
    })));
    if (/rate|http/.test(q)) return print([c('# PromQL: ' + q, C.muted), h('{service="portfolio-web"}  ' + g(String(rnd(1500, 2400)))), h('{service="api-gateway"}    ' + g(String(rnd(600, 1100))))]);
    print([c('# PromQL: ' + q, C.muted), 'No data. Try: promql up   or   promql \'sum(rate(http_requests_total[5m]))\'']);
  });
  cmds.alerts = function () {
    return table(['ALERT', 'SEVERITY', 'STATE', 'SINCE'], [
      ['KubePodCrashLooping (legacy-monolith)', { t: 'warning', col: C.yellow }, { t: 'firing', col: C.red }, '2019-04-01'],
      ['CertificateExpiringSoon', { t: 'info', col: C.blue }, { t: 'resolved', col: C.green }, 'cert-manager renewed it'],
      ['HighErrorBudgetBurn', { t: 'critical', col: C.red }, { t: 'inactive', col: C.green }, '—']]);
  };
  cmds.checkmk = cmds.cmk = function () {
    return [c('Checkmk — site "infra"', C.blue)].concat(table(['HOST', 'STATE', 'SERVICES', 'DETAIL'], [
      ['esxi-01.dc', { t: 'UP', col: C.green }, '48 OK', 'CPU 38%, datastore 61%'], ['esxi-02.dc', { t: 'UP', col: C.green }, '47 OK', 'CPU 42%, datastore 58%'],
      ['fw-edge-01', { t: 'UP', col: C.green }, '22 OK', 'WAN 312 Mbit/s'], ['nas-backup-01', { t: 'UP', col: C.green }, '30 OK · 1 WARN', 'Disk 81% (WARN at 80%)'],
      ['legacy-app-01', { t: 'UP', col: C.yellow }, '12 OK · 2 CRIT', 'JVM heap 99%']]));
  };
  cmds.slo = cmds.sla = function () {
    var used = rnd(18, 42);
    return [c('SLO report — portfolio-web (rolling 30 days)', C.blue), '',
      h(pad('Availability target', 22) + g('99.99%') + m('  → error budget 4m 19s / month')),
      h(pad('Achieved', 22) + g('99.995%')),
      h(pad('Error budget used', 22) + '[' + g('█'.repeat(Math.round(used / 5))) + m('░'.repeat(20 - Math.round(used / 5))) + '] ' + used + '%'),
      h(pad('Latency (p99 < 300ms)', 22) + g('99.7% of requests')), '', c('Budget healthy → feature releases allowed. 🚀', C.green)];
  };

  // ---------- Security ----------
  cmds.vault = wrap(async function (a) {
    var cmd = a.join(' ');
    if (/^status/.test(cmd) || !cmd) return print(table(['Key', 'Value'], [['Seal Type', 'awskms'], ['Sealed', { t: 'false', col: C.green }], ['Total Shares', 5], ['Threshold', 3], ['Version', '1.17.2'], ['HA Enabled', { t: 'true', col: C.green }], ['HA Mode', 'active']]));
    if (/^kv get/.test(cmd)) return print([h(b('====== Data ======')), 'Key           Value', 'db_password   ' + '•'.repeat(24), 'api_key       ' + '•'.repeat(32), '', c('Nice try. Secrets stay secret — that\'s literally the job.', C.yellow)]);
    if (/^login/.test(cmd)) return stream([h(m('Authenticating via OIDC…')), h(g('Success! You are now authenticated.') + ' token_ttl=1h policies=["readonly-portfolio"]')], 500);
    print(usage(['vault status', 'vault login -method=oidc', 'vault kv get secret/portfolio']));
  });
  T.subs.vault = ['status', 'login', 'kv', 'kv get'];
  cmds.istioctl = function (a) {
    if (a[0] === 'proxy-status') return table(['NAME', 'CDS', 'LDS', 'EDS', 'RDS', 'ISTIOD'], pods.filter(function (p) { return p.app === 'web' || p.app === 'api'; }).map(function (p) { return [p.name + '.production', { t: 'SYNCED', col: C.green }, { t: 'SYNCED', col: C.green }, { t: 'SYNCED', col: C.green }, { t: 'SYNCED', col: C.green }, 'istiod-6c9d-' + hex(5)]; }));
    if (a[0] === 'analyze') return [h(g('✔ No validation issues found when analyzing namespace: production.')), c('mTLS: STRICT across all workloads', C.muted)];
    return usage(['istioctl proxy-status', 'istioctl analyze']);
  };
  T.subs.istioctl = ['proxy-status', 'analyze'];
  cmds.opa = function () {
    return [c('$ opa eval -d policy.rego "data.k8s.admission.deny"', C.muted), '[', '  "container \'debug\' must not run as root",', '  "image \'nginx:latest\' must use a pinned digest"', ']', c('2 violations — admission blocked before it reached the cluster. ✋', C.yellow)];
  };
  cmds.trivy = wrap(async function () {
    await spin('Scanning registry.gitlab.com/andrei/portfolio:2.4.0 (distroless)', 1200);
    print(table(['SEVERITY', 'COUNT'], [[{ t: 'CRITICAL', col: C.red }, 0], [{ t: 'HIGH', col: C.yellow }, 0], [{ t: 'MEDIUM', col: C.blue }, 1], ['LOW', 2]]).concat([c('✓ Gate passed (no CRITICAL/HIGH)', C.green)]));
  });

  // ---------- Network / Edge ----------
  cmds.dig = function (a) {
    var d = a[0] || 'andreibamboi.dev';
    return [c('; <<>> DiG 9.18 <<>> ' + d, C.muted), ';; ANSWER SECTION:', h(esc(d) + '.   300   IN   A   ' + b('104.21.' + rnd(1, 99) + '.' + rnd(1, 250))), h(esc(d) + '.   300   IN   A   ' + b('172.67.' + rnd(1, 199) + '.' + rnd(1, 250))),
      c(';; Proxied through Cloudflare · Query time: ' + rnd(8, 24) + ' msec', C.muted), c(';; (it\'s not DNS. there\'s no way it\'s DNS. …it was DNS.)', C.muted)];
  };
  cmds.curl = function (a) {
    var url = a.filter(function (x) { return x[0] !== '-'; })[0] || 'https://andreibamboi.dev';
    if (/localhost:9090|prometheus/.test(url)) return cmds.promql(['up']);
    return [h(g('HTTP/2 200')), 'date: ' + new Date().toUTCString(), 'content-type: text/html; charset=utf-8', h(b('server: cloudflare')), 'cf-ray: ' + hex(16) + '-OTP', 'cf-cache-status: HIT',
      'strict-transport-security: max-age=31536000; includeSubDomains; preload', 'content-security-policy: default-src \'self\'', 'x-served-by: ' + url.replace(/^https?:\/\//, '') + ' via eks-prod-eu'];
  };
  cmds.cloudflare = cmds.cf = function () {
    return [c('Cloudflare — andreibamboi.dev (last 24h)', C.blue)].concat(table(['METRIC', 'VALUE'], [
      ['Requests', (rnd(180, 260) / 10) + 'k'], ['Cache hit ratio', { t: rnd(88, 96) + '%', col: C.green }], ['Threats blocked (WAF)', { t: String(rnd(120, 900)), col: C.yellow }],
      ['Bot score < 30', rnd(4, 9) + '%'], ['TLS', 'TLS 1.3 · HTTP/3'], ['DDoS mitigated', { t: 'yes, quietly', col: C.green }]]));
  };
  cmds.ping = wrap(async function (a) {
    var host = a[0] || 'andreibamboi.dev', ip = '104.21.' + rnd(1, 99) + '.' + rnd(1, 250), times = [];
    print(['PING ' + host + ' (' + ip + '): 56 data bytes']);
    for (var i = 0; i < 5; i++) {
      if (T.aborted) break;
      var t = (rnd(70, 260) / 10); times.push(t);
      print(['64 bytes from ' + ip + ': icmp_seq=' + i + ' ttl=57 time=' + t + ' ms']);
      await sleep(650);
    }
    var avg = (times.reduce(function (x, y2) { return x + y2; }, 0) / times.length).toFixed(1);
    print(['', '--- ' + host + ' ping statistics ---', times.length + ' packets transmitted, ' + times.length + ' received, 0% packet loss', 'round-trip min/avg/max = ' + Math.min.apply(null, times) + '/' + avg + '/' + Math.max.apply(null, times) + ' ms']);
  });
  cmds.ssh = wrap(async function (a) {
    var host = a[0] || 'prod';
    await stream([h(m('Connecting to ' + host + ' via bastion.andreibamboi.dev…')), h(m('Verifying hardware key (FIDO2)…'))], 600);
    print([c('Permission denied (publickey). Access to production goes through the pipeline, not through SSH. 🙂', C.yellow), c('Try `deploy` instead.', C.muted)]);
  });

  // ---------- Linux ----------
  cmds.uname = function (a) { return [a[0] === '-a' ? 'Linux andrei-cloud 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux' : 'Linux']; };
  cmds.free = function () { return table(['', 'total', 'used', 'free', 'buff/cache', 'available'], [['Mem:', '62Gi', '18Gi', '9.1Gi', '35Gi', '43Gi'], ['Swap:', '0B', '0B', '0B', '', '']]); };
  cmds.df = function () { return table(['Filesystem', 'Size', 'Used', 'Avail', 'Use%', 'Mounted on'], [['/dev/nvme0n1p1', '200G', '61G', '139G', { t: '31%', col: C.green }, '/'], ['/dev/nvme1n1', '1.0T', '412G', '612G', { t: '41%', col: C.green }, '/var/lib/containerd'], ['tmpfs', '32G', '0', '32G', '0%', '/dev/shm'], ['nas:/backups', '20T', '16T', '4.0T', { t: '81%', col: C.yellow }, '/mnt/backups']]); };
  cmds.ps = function () { return table(['PID', 'USER', '%CPU', '%MEM', 'COMMAND'], [[1, 'root', '0.0', '0.1', '/sbin/init'], [812, 'root', '2.1', '1.4', '/usr/bin/containerd'], [1024, 'root', '3.4', '2.2', '/usr/bin/kubelet --config=/var/lib/kubelet/config.yaml'], [2048, 'nobody', '0.6', '0.4', '/bin/node_exporter'], [4096, 'andrei', '0.1', '0.1', '-bash'], [8080, 'andrei', '99.9', '0.0', 'coffee --strong --no-sugar']]); };
  cmds.top = cmds.htop = wrap(async function () {
    var el = print([h('')]);
    for (var t = 0; t < 15; t++) {
      if (T.aborted) { print([c('^C', C.muted)]); return; }
      var cpus = [rnd(5, 70), rnd(5, 70), rnd(5, 70), rnd(5, 70)];
      el.innerHTML = cpus.map(function (v, i) { var n = Math.round(v / 5); return b(String(i)) + '[' + g('|'.repeat(n)) + ' '.repeat(20 - n) + pad(v + '%', 5) + ']'; }).join('\n') +
        '\n' + b('Mem') + '[' + g('|'.repeat(6)) + ' '.repeat(14) + '18G/62G]   ' + m('Tasks: ' + rnd(180, 220) + ', load average: 0.' + rnd(20, 80) + ' 0.' + rnd(20, 60) + ' 0.' + rnd(20, 50)) +
        '\n\n' + m(pad('PID', 7) + pad('USER', 9) + pad('CPU%', 7) + 'COMMAND') +
        '\n' + pad('8080', 7) + pad('andrei', 9) + pad('99.9', 7) + 'coffee --strong' +
        '\n' + pad('1024', 7) + pad('root', 9) + pad(rnd(1, 9) + '.' + rnd(0, 9), 7) + 'kubelet' +
        '\n' + pad('812', 7) + pad('root', 9) + pad(rnd(1, 5) + '.' + rnd(0, 9), 7) + 'containerd' +
        '\n' + pad('2048', 7) + pad('nobody', 9) + pad('0.' + rnd(1, 9), 7) + 'node_exporter' +
        '\n' + m('Ctrl+C to quit');
      body().scrollTop = 1e9;
      await sleep(500);
    }
  });
  cmds.systemctl = function (a) {
    var unit = a[1] || 'portfolio';
    return [h(g('●') + ' ' + esc(unit) + '.service - ' + esc(unit) + ' (managed by Ansible)'), '     Loaded: loaded (/etc/systemd/system/' + unit + '.service; enabled)', h('     Active: ' + g('active (running)') + ' since ' + new Date(Date.now() - 864e5 * 3).toDateString() + '; 3 days ago'),
      '   Main PID: 4242', '      Tasks: 11 (limit: 76800)', '     Memory: 84.2M', '        CPU: 3min 12.551s'];
  };
  T.subs.systemctl = ['status'];
  cmds.journalctl = function (a) { return cmds.kubectl(['logs', 'portfolio-web']); };
  cmds.python3 = cmds.python = function () { return ['Python 3.12.6 (main) [GCC 13.2.0] on linux', c('>>> import antigravity — nah. Try `cost` to see a real Python job\'s output.', C.muted)]; };
  cmds.bash = function () { return [c('You\'re already in bash. It\'s bash all the way down. 🐢', C.muted)]; };
  cmds.vim = cmds.vi = cmds.nano = function () { return [c('Editors are disabled in this demo. (And yes, I know how to exit vim: :wq)', C.muted)]; };

  // ---------- FinOps / ops stories ----------
  cmds.cost = cmds.finops = wrap(async function () {
    await spin('python3 cost_optimizer.py --accounts all --lookback 30d', 1100);
    print([c('Cloud cost report — last 30 days', C.blue)].concat(table(['ACTION', 'RESOURCES', 'MONTHLY SAVINGS'], [
      ['Rightsize over-provisioned pods', '214 workloads', { t: '-$8,420', col: C.green }], ['Move stateless to Spot / Graviton', '3 node groups', { t: '-$6,950', col: C.green }],
      ['Delete orphaned EBS volumes & snapshots', '1,312', { t: '-$2,180', col: C.green }], ['S3 Intelligent-Tiering', '41 buckets', { t: '-$1,330', col: C.green }],
      ['Stop "someone-forgot-this" c5.4xlarge', '1', { t: '-$497', col: C.green }]])).concat(['', h(b('Total: ') + g('−40% cloud spend') + m(' · performance impact: none'))]));
  });
  cmds.incident = cmds.oncall = wrap(async function () {
    await stream([
      h(r('🔔 PAGE') + ' 03:12 · HighLatency — api-gateway p99 > 800ms (eu-central-1)'),
      h(m('03:13') + ' Ack’d. Checking Grafana…'),
      h(m('03:14') + ' Spike correlates with node ' + b('ip-10-0-2-37') + ' — disk pressure on containerd'),
      h(m('03:15') + ' kubectl cordon ip-10-0-2-37 && kubectl drain ip-10-0-2-37 --ignore-daemonsets'),
      h(m('03:16') + ' Pods rescheduled across AZs · HPA scaled api-gateway 2 → 4'),
      h(m('03:18') + ' p99 back to ' + g('142ms') + ' · error budget burn: 0.4%'),
      h(m('03:25') + ' Root cause: log rotation misconfig · fix merged as MR !' + rnd(400, 900) + ' (Ansible role)'),
      h(g('✓ Resolved in 13 min.') + ' Postmortem: blameless, written, action items assigned.')
    ], 650);
  });
  cmds.failover = wrap(async function () {
    await stream([h(y('⚠ Simulating loss of region eu-central-1…'))], 600);
    await spin('Cloudflare health checks marking origin eks-prod-eu unhealthy', 900);
    await spin('Shifting traffic to eks-prod-eu-west + aks-dr-weu', 1000);
    await spin('Promoting read replica to primary (RPO < 5s)', 900);
    print([h(g('✓ Failover complete.') + ' RTO ' + rnd(41, 58) + 's · data loss: none · users: blissfully unaware'), c('Multi-cloud isn\'t a buzzword when it saves your weekend.', C.muted)]);
  });
  cmds.certs = function () { return [c('Ask me about my certifications — 5 and counting. → run `contact`', C.muted)]; };

  // ---------- help for the tech playground ----------
  cmds.tech = cmds.devops = function () {
    var groups = [
      ['Kubernetes', ['kubectl get pods|nodes|svc|hpa', 'kubectl top nodes', 'kubectl logs portfolio-web', 'kubectl rollout restart deploy/portfolio-web', 'kubectl scale deploy/portfolio-web --replicas=5', 'chaos', 'helm list']],
      ['IaC & config', ['terraform init|plan|apply', 'terraform state list', 'ansible-playbook site.yml', 'ansible all -m ping']],
      ['CI/CD & GitOps', ['deploy', 'git log | git push', 'argocd app list | app sync portfolio', 'jenkins build']],
      ['Clouds', ['aws sts get-caller-identity', 'aws ec2 describe-instances', 'az vm list', 'az aks list', 'govc ls | govc hosts', 'rancher']],
      ['Observability', ['grafana', 'promql up', 'alerts', 'checkmk', 'slo']],
      ['Security & edge', ['vault status', 'istioctl proxy-status', 'opa', 'trivy', 'cloudflare', 'dig | curl -I | ping andreibamboi.dev']],
      ['Linux', ['top', 'ps', 'df -h', 'free -h', 'uname -a', 'systemctl status portfolio', 'docker ps | build | compose up']],
      ['Stories', ['incident', 'failover', 'cost']]
    ];
    var outL = [c('DevOps playground — everything here is simulated, nothing touches real infra.', C.green), ''];
    groups.forEach(function (gr) {
      outL.push(c('[' + gr[0] + ']', C.blue));
      outL.push(h('  ' + gr[1].map(function (x) { return g(x); }).join(m('  ·  '))));
    });
    outL.push(''); outL.push(c('Long-running commands can be stopped with Ctrl+C. Tab completes subcommands too.', C.muted));
    return outL;
  };
})();
