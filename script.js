/* 华人社区 · FiveM 技术站 —— 交互与特效 */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var body = document.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 设置（存本机） ---------- */
  var DEF = { fx: 1, aurora: 1, scan: 1, cur: 1, reveal: 1, ticker: 1, lite: 0 };
  var KEY = 'hrc_site_cfg';
  var cfg = {};
  try { cfg = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { cfg = Object.assign({}, DEF); }
  if (reduce) cfg.lite = 1;

  function apply() {
    body.classList.toggle('nofx', !cfg.fx || !!cfg.lite);
    body.classList.toggle('noaurora', !cfg.aurora || !!cfg.lite);
    body.classList.toggle('noscan', !cfg.scan);
    body.classList.toggle('nocur', !cfg.cur || !!cfg.lite || !window.matchMedia('(hover:hover)').matches);
    body.classList.toggle('noreveal', !cfg.reveal || !!cfg.lite);
    $('#ticker').style.display = cfg.ticker ? '' : 'none';
    $$('.sheet .sw').forEach(function (b) {
      var k = b.id.replace('sw', '');
      var v = k === 'Lite' ? !!cfg.lite : !!cfg[k.toLowerCase()];
      b.classList.toggle('on', v);
      b.setAttribute('aria-pressed', v ? 'true' : 'false');
    });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} }

  /* ---------- 开场 loading ---------- */
  var boot = $('#boot'), p = 0;
  var bar = $('#bootBar'), pct = $('#bootPct');
  var timer = setInterval(function () {
    p += Math.random() * 18 + 8;
    if (p >= 100) { p = 100; clearInterval(timer); setTimeout(kick, 320); }
    bar.style.width = p + '%'; pct.textContent = Math.floor(p) + '%';
  }, 130);
  function kick() {
    boot.classList.add('off');
    body.classList.remove('loading');
    setTimeout(function () { if (boot.parentNode) boot.parentNode.removeChild(boot); }, 800);
    reveal(); countUp();
  }
  setTimeout(function () { if (boot.parentNode) kick(); }, 3500);

  /* ---------- 标题逐字动画 ---------- */
  $$('[data-split]').forEach(function (el) {
    var t = el.textContent, i = 0;
    el.textContent = '';
    el.setAttribute('aria-label', t);
    Array.prototype.forEach.call(t, function (ch) {
      var s = document.createElement('span');
      s.className = 'ch'; s.textContent = ch; s.setAttribute('aria-hidden', 'true');
      s.style.animationDelay = (0.9 + i++ * 0.11) + 's';
      el.appendChild(s);
    });
  });

  /* ---------- 滚动：导航 / 进度 / 回顶 / 当前时间 ---------- */
  var nav = $('#nav'), prog = $('#prog i'), totop = $('#totop'), ticking = false;
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('stuck', y > 10);
    prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    totop.classList.toggle('on', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  function clock() {
    var d = new Date();
    var z = function (n) { return (n < 10 ? '0' : '') + n; };
    $('#clock').textContent = z(d.getHours()) + ':' + z(d.getMinutes());
  }
  clock(); setInterval(clock, 20000);

  /* ---------- 渐入 ---------- */
  var io = null;
  function reveal() {
    if (io) return;
    if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(function (e) { e.classList.add('in'); }); return; }
    io = new IntersectionObserver(function (list) {
      list.forEach(function (en) {
        if (en.isIntersecting) {
          var d = en.target.dataset.delay || 0;
          setTimeout(function () { en.target.classList.add('in'); }, d);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach(function (e) { io.observe(e); });
  }
  if (!body.classList.contains('loading')) reveal();

  /* ---------- 数字滚动 ---------- */
  function countUp() {
    $$('[data-c]').forEach(function (el) {
      var t = +el.dataset.c, cur = 0, step = Math.max(1, Math.ceil(t / 28));
      var run = function () {
        cur += step;
        if (cur >= t) { cur = t; el.textContent = t; return; }
        el.textContent = cur; requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    });
  }

  /* ---------- 3D 倾斜 ---------- */
  if (window.matchMedia('(hover:hover)').matches) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(800px) rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 9).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- 光标光追 ---------- */
  var glow = $('#curGlow'), dot = $('#curDot'), mx = -99, my = -99, gx = -99, gy = -99, seen = false;
  window.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; glow.style.opacity = 1; dot.style.opacity = 1; }
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    var hot = e.target.closest && e.target.closest('a,button,details,summary');
    dot.classList.toggle('hot', !!hot);
  }, { passive: true });
  (function loop() {
    gx += (mx - gx) * .12; gy += (my - gy) * .12;
    glow.style.left = gx + 'px'; glow.style.top = gy + 'px';
    requestAnimationFrame(loop);
  })();

  /* ---------- 粒子背景 ---------- */
  var cv = $('#fx'), ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), ps = [], raf = 0;
  function size() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(70, Math.max(26, Math.floor(W * H / 16000)));
    ps = Array.from({ length: n }, function () { return mk(); });
  }
  function mk() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .32, vy: (Math.random() - .5) * .32,
      r: Math.random() * 1.6 + .6, a: Math.random() * .5 + .25,
      c: Math.random() < .35 ? '123,92,255' : (Math.random() < .3 ? '255,47,109' : '0,229,255')
    };
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
      if (seen && cfg.cur) {
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140 && d2 > 1) { var f = (140 - Math.sqrt(d2)) / 140 * .5; p.x += dx / Math.sqrt(d2) * f * 2.2; p.y += dy / Math.sqrt(d2) * f * 2.2; }
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3);
      ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')'; ctx.fill();
      for (var j = i + 1; j < ps.length; j++) {
        var q = ps[j], ddx = p.x - q.x, ddy = p.y - q.y, dd = ddx * ddx + ddy * ddy;
        if (dd < 150 * 150) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(0,229,255,' + (1 - Math.sqrt(dd) / 150) * .16 + ')';
          ctx.lineWidth = .6; ctx.stroke();
        }
      }
    }
    if (cfg.fx && !cfg.lite) raf = requestAnimationFrame(frame);
  }
  function startFx() {
    cancelAnimationFrame(raf);
    if (cfg.fx && !cfg.lite && !reduce) { size(); frame(); }
    else ctx.clearRect(0, 0, W, H);
  }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 220); }, { passive: true });

  /* ---------- toast ---------- */
  var toast = $('#toast'), tt;
  function show(msg) {
    toast.textContent = msg; toast.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('on'); }, 2200);
  }
  window.__hrcToast = show;

  /* ---------- 复制 ---------- */
  function copy(txt, btn, okMsg) {
    var done = function () { show(okMsg || ('已复制：' + txt)); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = 0;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { show('请手动复制：' + txt); }
      document.body.removeChild(ta);
    }
  }
  $('#copyBtn').addEventListener('click', function () {
    copy(this.dataset.num, this, '群号已复制：' + this.dataset.num + '，去 QQ 粘贴搜索');
  });
  $$('.cp').forEach(function (b) {
    b.addEventListener('click', function () {
      var tip = $('#' + b.dataset.tip), old = tip.textContent;
      copy(b.dataset.copy, b);
      tip.textContent = '✓ 已复制';
      setTimeout(function () { tip.textContent = old; }, 2000);
    });
  });

  /* ---------- 抽屉菜单 ---------- */
  var drawer = $('#drawer'), mask = $('#mask');
  function closeDrawer() { drawer.classList.remove('on'); mask.classList.remove('on'); }
  $('#burger').addEventListener('click', function () { drawer.classList.add('on'); mask.classList.add('on'); });
  $('#dwClose').addEventListener('click', closeDrawer);
  mask.addEventListener('click', closeDrawer);
  $$('#drawer a').forEach(function (a) { a.addEventListener('click', closeDrawer); });

  /* ---------- 公告条关闭 ---------- */
  $('#tkClose').addEventListener('click', function () {
    $('#ticker').style.display = 'none'; cfg.ticker = 0; save(); syncSw();
  });
  function syncSw() { apply(); }

  /* ---------- 设置面板 ---------- */
  var sheet = $('#sheet'), mask2 = $('#mask2');
  function closeSheet() { sheet.classList.remove('on'); mask2.classList.remove('on'); }
  $('#fabSet').addEventListener('click', function () { sheet.classList.add('on'); mask2.classList.add('on'); });
  $('#shClose').addEventListener('click', closeSheet);
  mask2.addEventListener('click', closeSheet);
  var map = { swFx: 'fx', swAurora: 'aurora', swScan: 'scan', swCur: 'cur', swReveal: 'reveal', swTicker: 'ticker', swLite: 'lite' };
  Object.keys(map).forEach(function (id) {
    $('#' + id).addEventListener('click', function () {
      var k = map[id];
      cfg[k] = !cfg[k];
      if (k === 'lite' && cfg.lite) cfg.fx = 1;
      if (k === 'fx' && cfg.fx) cfg.lite = 0;
      save(); apply(); startFx();
      if (cfg.reveal && k !== 'reveal' || k === 'reveal') { /* keep */ }
      if (cfg.reveal) reveal();
    });
  });
  $('#resetSet').addEventListener('click', function () {
    cfg = Object.assign({}, DEF); if (reduce) cfg.lite = 1;
    save(); apply(); startFx(); reveal(); show('已恢复默认设置');
  });

  /* ---------- 退出站点 ---------- */
  var em = $('#exitModal');
  function closeExit() { em.classList.remove('on'); }
  $('#exitSite').addEventListener('click', function () { closeSheet(); em.classList.add('on'); });
  $('#exitNo').addEventListener('click', closeExit);
  em.addEventListener('click', function (e) { if (e.target === em) closeExit(); });
  $('#exitYes').addEventListener('click', function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    cfg = Object.assign({}, DEF); if (reduce) cfg.lite = 1;
    apply(); startFx(); closeExit();
    show('已退出站点并清空本机设置');
    setTimeout(function () {
      window.scrollTo({ top: 0, behavior: cfg.lite ? 'auto' : 'smooth' });
    }, 200);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeExit(); closeSheet(); closeDrawer(); }
  });

  /* ---------- 加群按钮：手机优先唤起 QQ ---------- */
  function isMobile() { return /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent); }
  $$('#joinBtn,#joinBtn2,.dw-qq').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!isMobile()) return;
      e.preventDefault();
      var url = this.href;
      show('正在唤起 QQ…没反应请点「复制群号」');
      var t = setTimeout(function () { window.open(url, '_blank'); }, 1200);
      window.location.href = 'mqqopensdkapi://bizAgent/qm/qr?url=' + encodeURIComponent(url);
      setTimeout(function () { clearTimeout(t); }, 1500);
    });
  });

  /* ---------- 启动 ---------- */
  apply(); startFx();
})();

/* ================= 社区：登录 / 发帖 / 评论 / 个人主页 =================
   数据全部存在本机浏览器的 localStorage 里，不上传任何服务器。
   全站不设屏蔽词，只拦空内容、超长内容。违法/人身攻击/广告由管理员删除。 */
(function () {
  var K = 'hrsq_community_v1';
  var DB = { users: [], posts: [], me: null };
  try { DB = JSON.parse(localStorage.getItem(K)) || DB; } catch (e) {}
  if (!DB.users) DB.users = []; if (!DB.posts) DB.posts = [];
  var save = function () { try { localStorage.setItem(K, JSON.stringify(DB)); } catch (e) {} };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var avColor = function (u) { return (u && u.color) || '#00e5ff'; };
  var avatar = function (u) { return '<span class="av" style="background:' + avColor(u) + '">' + esc((u ? u.name : '?').slice(0, 1).toUpperCase()) + '</span>'; };
  var toast = function (m) { var t = $('#toast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('on'); }, 2200); };
  if (!$('#postList')) return;

  var catFilter = 'all', sortMode = 'new', editingId = null;

  function closeModals() { document.querySelectorAll('.modal').forEach(function (m) { m.classList.remove('on'); }); }
  document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeModals); });
  document.querySelectorAll('.modal').forEach(function (m) { m.addEventListener('click', function (e) { if (e.target === m) closeModals(); }); });

  function switchTab(t) {
    document.querySelectorAll('#authModal .ct').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    $('#tabLogin').style.display = t === 'login' ? '' : 'none';
    $('#tabReg').style.display = t === 'reg' ? '' : 'none';
  }
  function openAuth() { switchTab('login'); $('#lErr').textContent = ''; $('#rErr').textContent = ''; $('#authModal').classList.add('on'); }
  $('#userBtn').addEventListener('click', openAuth);
  $('#meLogin').addEventListener('click', openAuth);
  document.querySelectorAll('#authModal .ct').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.dataset.tab); }); });

  $('#doReg').addEventListener('click', function () {
    var n = $('#rUser').value.trim(), p = $('#rPass').value, p2 = $('#rPass2').value, e = $('#rErr');
    if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return e.textContent = '用户名要 3-12 位，只能用字母、数字、下划线';
    if (DB.users.some(function (u) { return u.name.toLowerCase() === n.toLowerCase(); })) return e.textContent = '这个名字已经有人用了';
    if (p.length < 6) return e.textContent = '密码至少 6 位';
    if (p !== p2) return e.textContent = '两次密码不一样';
    DB.users.push({ name: n, pass: p, bio: '', tags: [], color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'), at: Date.now() });
    DB.me = n; save(); closeModals(); refresh(); toast('注册成功，欢迎进社区，' + n);
  });
  $('#doLogin').addEventListener('click', function () {
    var n = $('#lUser').value.trim(), p = $('#lPass').value, e = $('#lErr');
    var u = DB.users.filter(function (x) { return x.name.toLowerCase() === n.toLowerCase(); })[0];
    if (!u || u.pass !== p) return e.textContent = '用户名或密码不对';
    DB.me = u.name; save(); closeModals(); refresh(); toast('欢迎回来，' + u.name);
  });
  function logout() { DB.me = null; save(); refresh(); toast('已退出登录'); }
  $('#logoutBtn').addEventListener('click', logout);
  function me() { return DB.users.filter(function (x) { return x.name === DB.me; })[0] || null; }

  $('#newPost').addEventListener('click', function () {
    if (!me()) return openAuth();
    editingId = null; $('#postTitle2').textContent = '写文章';
    $('#pTitle').value = ''; $('#pBody').value = ''; $('#pCat').value = '闲聊'; $('#pErr').textContent = '';
    $('#postModal').classList.add('on');
  });
  $('#doPost').addEventListener('click', function () {
    var u = me(); if (!u) return openAuth();
    var t = $('#pTitle').value.trim(), b = $('#pBody').value.trim(), c = $('#pCat').value, e = $('#pErr');
    if (!t) return e.textContent = '标题不能为空';
    if (t.length > 40 || b.length > 5000) return e.textContent = '标题最多 40 字，正文最多 5000 字';
    if (editingId) {
      var p = DB.posts.filter(function (x) { return x.id === editingId; })[0];
      if (p) { p.title = t; p.body = b; p.cat = c; }
      toast('已修改');
    } else {
      DB.posts.unshift({ id: Date.now(), by: u.name, cat: c, title: t, body: b, at: Date.now(), likes: [], cmts: [] });
      toast(c === 'show' ? '已发布到社区展示' : '发布成功');
    }
    save(); closeModals(); refresh();
  });

  function like(id) {
    var p = DB.posts.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    if (!me()) return openAuth();
    var i = p.likes.indexOf(DB.me);
    if (i >= 0) p.likes.splice(i, 1); else p.likes.push(DB.me);
    save(); refresh();
  }
  function addCmt(id, inp) {
    if (!inp) return;
    if (!me()) return openAuth();
    var p = DB.posts.filter(function (x) { return x.id === id; })[0];
    var v = inp.value.trim(); if (!p || !v) return;
    if (v.length > 1000) return toast('评论最多 1000 字');
    p.cmts.push({ by: DB.me, at: Date.now(), text: v }); inp.value = ''; save(); refresh(); toast('评论已发布');
  }
  function delPost(id) {
    var p = DB.posts.filter(function (x) { return x.id === id; })[0]; if (!p || p.by !== DB.me) return toast('只能删自己发的');
    if (!confirm('删除这篇文章和它下面的评论？')) return;
    DB.posts = DB.posts.filter(function (x) { return x.id !== id; }); save(); closeModals(); refresh(); toast('已删除');
  }
  function delCmt(id, i) {
    var p = DB.posts.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var c = p.cmts[i]; if (!c || c.by !== DB.me) return toast('只能删自己的评论');
    p.cmts.splice(i, 1); save(); refresh();
  }
  function editPost(id) {
    var p = DB.posts.filter(function (x) { return x.id === id; })[0]; if (!p || p.by !== DB.me) return;
    editingId = id; $('#postTitle2').textContent = '修改文章';
    $('#pTitle').value = p.title; $('#pBody').value = p.body; $('#pCat').value = p.cat; $('#pErr').textContent = '';
    $('#postModal').classList.add('on');
  }

  function time(ts) {
    var d = new Date(ts), n = new Date();
    var s = function (x) { return String(x).padStart(2, '0'); };
    return (d.toDateString() === n.toDateString() ? '今天 ' : (d.getMonth() + 1) + '月' + d.getDate() + '日 ') + s(d.getHours()) + ':' + s(d.getMinutes());
  }
  function userOf(name) { return DB.users.filter(function (u) { return u.name === name; })[0] || { name: name, color: '#8892a8' }; }
  function postHTML(p, withCmt) {
    var u = userOf(p.by), liked = DB.me && p.likes.indexOf(DB.me) >= 0, own = DB.me === p.by;
    var h = '<article class="post"><div class="pm"><span class="pcat">' + esc(p.cat === 'show' ? '社区展示' : p.cat) + '</span>' +
      '<span class="pf" data-user="' + esc(p.by) + '">' + avatar(u) + esc(p.by) + '</span><span>· ' + time(p.at) + '</span>' +
      (own ? '<span style="margin-left:auto;display:flex;gap:12px"><button data-act="edit" data-id="' + p.id + '">改</button><button data-act="del" data-id="' + p.id + '">删</button></span>' : '') +
      '</div><h4 data-act="open" data-id="' + p.id + '">' + esc(p.title) + '</h4><div class="pb">' + esc(p.body.length > 220 ? p.body.slice(0, 220) + '…' : p.body) + '</div>' +
      '<div class="pact"><button class="like' + (liked ? ' liked' : '') + '" data-act="like" data-id="' + p.id + '">' + (liked ? '❤' : '♡') + ' ' + p.likes.length + '</button>' +
      '<button data-act="open" data-id="' + p.id + '">💬 ' + p.cmts.length + '</button></div>';
    if (withCmt) {
      h += '<div>';
      p.cmts.forEach(function (c, i) {
        var cu = userOf(c.by);
        h += '<div class="cmt"><div class="ch"><span class="pf" data-user="' + esc(c.by) + '">' + avatar(cu) + esc(c.by) + '</span><span>· ' + time(c.at) + '</span>' +
          (c.by === DB.me ? '<button data-act="delc" data-id="' + p.id + '" data-i="' + i + '" style="margin-left:auto;background:none;border:none;color:#8892a8;cursor:pointer">删</button>' : '') + '</div>' +
          '<div class="cb">' + esc(c.text) + '</div></div>';
      });
      h += '<div class="cbox"><input placeholder="' + (me() ? '说点什么，回车发送' : '登录后才能评论') + '" data-cmt="' + p.id + '"><button data-act="send" data-id="' + p.id + '">发送</button></div></div>';
    }
    return h + '</article>';
  }
  function listHTML(arr, empty) {
    var h = arr.slice(0, 80).map(function (p) { return postHTML(p, false); }).join('');
    if (arr.length > 80) h += '<p class="none">只显示最新 80 篇，用分类筛选看更多</p>';
    return h || '<p class="none">' + empty + '</p>';
  }
  function refresh() {
    var u = me();
    $('#userBtn').textContent = u ? u.name + ' ▾' : '登录 / 注册';
    $('#meGuest').style.display = u ? 'none' : '';
    $('#meBox').style.display = u ? '' : 'none';
    if (u) {
      $('#meAvatar').textContent = u.name.slice(0, 1).toUpperCase(); $('#meAvatar').style.background = avColor(u);
      $('#meName').textContent = u.name; $('#meBio').textContent = u.bio || '这个人很懒，什么都没写。';
      $('#meTags').innerHTML = (u.tags || []).map(function (t) { return '<span class="tagx">' + esc(t) + '</span>'; }).join('') || '<span style="color:var(--mut);font-size:12px">还没填标签</span>';
      var my = DB.posts.filter(function (p) { return p.by === u.name; });
      $('#stPost').textContent = my.length;
      $('#stCmt').textContent = DB.posts.reduce(function (a, p) { return a + p.cmts.filter(function (c) { return c.by === u.name; }).length; }, 0);
      $('#stLike').textContent = DB.posts.reduce(function (a, p) { return a + p.likes.length; }, 0);
      $('#stDay').textContent = Math.max(1, Math.ceil((Date.now() - (u.at || Date.now())) / 86400000));
      $('#myList').innerHTML = my.length ? my.map(function (p) { return postHTML(p, false); }).join('') : '<p class="none">还没发过，去讨论区写第一篇</p>';
      $('#eName').value = u.name; $('#eBio').value = u.bio || ''; $('#eTags').value = (u.tags || []).join(', '); $('#eColor').value = avColor(u);
    }
    var arr = DB.posts.slice();
    if (catFilter !== 'all') arr = arr.filter(function (p) { return p.cat === catFilter; });
    arr.sort(function (a, b) { return sortMode === 'hot' ? (b.likes.length + b.cmts.length) - (a.likes.length + a.cmts.length) : b.id - a.id; });
    $('#postList').innerHTML = listHTML(arr, catFilter === 'all' ? '还没有人发帖，来抢第一条' : '这个分类还没有帖子');
    $('#showList').innerHTML = DB.posts.filter(function (p) { return p.cat === 'show'; }).map(function (p) {
      var ou = userOf(p.by);
      return '<article class="card" style="padding:18px"><div class="pm"><span class="pf" data-user="' + esc(p.by) + '">' + avatar(ou) + esc(p.by) + '</span><span>· ' + time(p.at) + '</span></div>' +
        '<h4 style="margin:8px 0 6px;cursor:pointer" data-act="open" data-id="' + p.id + '">' + esc(p.title) + '</h4>' +
        '<div class="pb">' + esc(p.body.length > 90 ? p.body.slice(0, 90) + '…' : p.body) + '</div>' +
        '<div class="pact"><button class="like' + (DB.me && p.likes.indexOf(DB.me) >= 0 ? ' liked' : '') + '" data-act="like" data-id="' + p.id + '">♡ ' + p.likes.length + '</button><button data-act="open" data-id="' + p.id + '">💬 ' + p.cmts.length + '</button></div></article>';
    }).join('') || '<p class="none">还没有作品，发文章时选「社区展示」就会出现在这里</p>';
    if (window.revealAll) window.revealAll();
  }

  document.addEventListener('click', function (e) {
    var uel = e.target.closest('[data-user]');
    if (uel) { toast('正在看 ' + uel.dataset.user + ' 的主页 → 下面「个人展示」'); location.href = '#me'; return; }
    var b = e.target.closest('[data-act]'); if (!b) return;
    var id = +b.dataset.id, act = b.dataset.act;
    if (act === 'like') like(id);
    else if (act === 'del') delPost(id);
    else if (act === 'edit') editPost(id);
    else if (act === 'delc') delCmt(id, +b.dataset.i);
    else if (act === 'send') addCmt(id, document.querySelector('[data-cmt="' + id + '"]'));
    else if (act === 'open') openPost(id);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var inp = e.target.closest('[data-cmt]'); if (inp) addCmt(+inp.dataset.cmt, inp);
  });
  $('#cats').addEventListener('click', function (e) {
    var b = e.target.closest('.ct'); if (!b) return;
    catFilter = b.dataset.c;
    document.querySelectorAll('#cats .ct').forEach(function (x) { x.classList.toggle('on', x === b); });
    refresh();
  });
  $('#sortSel').addEventListener('change', function () { sortMode = this.value; refresh(); });

  function openPost(id) {
    var p = DB.posts.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var host = $('#postList');
    host.innerHTML = postHTML(p, true);
    var back = document.createElement('button');
    back.className = 'btn g sm'; back.textContent = '← 返回列表'; back.style.marginBottom = '10px';
    back.onclick = refresh;
    host.insertBefore(back, host.firstChild);
    host.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (window.revealAll) window.revealAll();
  }

  $('#editMe').addEventListener('click', function () { $('#meEdit').style.display = ''; this.style.display = 'none'; });
  $('#cancelMe').addEventListener('click', function () { $('#meEdit').style.display = 'none'; $('#editMe').style.display = ''; });
  $('#saveMe').addEventListener('click', function () {
    var u = me(); if (!u) return;
    var n = $('#eName').value.trim();
    if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return toast('昵称要 3-12 位字母数字下划线');
    if (DB.users.some(function (x) { return x.name.toLowerCase() === n.toLowerCase() && x.name !== u.name; })) return toast('这个名字已经有人用了');
    u.name = n; u.bio = $('#eBio').value.trim();
    u.tags = $('#eTags').value.split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 6);
    u.color = $('#eColor').value; DB.me = n; save(); $('#meEdit').style.display = 'none'; $('#editMe').style.display = ''; refresh(); toast('资料已保存');
  });

  if (!DB.posts.length) {
    DB.posts.push({ id: 1, by: '群主', cat: '资源', title: '欢迎来到华人社区讨论区', body: '这里没有屏蔽词，聊什么都行。\n\n发帖和评论需要先注册，账号只存在你自己手机上。\n\n技术问题发「技术求助」，找人开荒发「组队」，自己的服务器和作品发「社区展示」。', at: Date.now() - 3600000, likes: [], cmts: [] });
    save();
  }
  refresh();
})();
