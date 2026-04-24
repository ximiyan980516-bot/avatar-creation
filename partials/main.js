/* ============================================================
   主交互脚本：方案切换 + 半屏唤醒 + 多种唤醒交互 + 归位飞行
   ============================================================ */

// ======= 数据：方案描述 =======
const EFFECTS = [
  { id: 1,  title: '呼吸光圈',    desc: '蓝色光圈 2s 缓慢呼吸，最克制' },
  { id: 2,  title: '双层水波',    desc: '两圈错开扩散，"有动静"' },
  { id: 3,  title: '探头招呼',    desc: '探头摇摆 + 头顶声波，像在打招呼' },
  { id: 4,  title: '比心轻拍',    desc: '头像旁轻轻冒爱心，俏皮一拍' },
  { id: 5,  title: '星粒环绕',    desc: '三色粒子绕行，二次元拉满' },
  { id: 6,  title: '流光描边',    desc: '彩色描边旋转，VIP 高级感' },
  { id: 7,  title: '睡眠 ZZZ',    desc: '"它在睡，叫醒它"，强联动' },
  { id: 8,  title: '情绪冒泡',    desc: '爱心从头像飘出，有性格' },
  { id: 9,  title: '未读挂件',    desc: '小标签可挂运营文案，可点击' },
  { id: 10, title: '全息扫光',    desc: '高光从左滑到右，"加载中"' },
];

const WAKES = [
  { id: 1, title: '温柔睁眼',  desc: '呼吸 → 闪光 → 睁眼，自然朴素' },
  { id: 2, title: '蓄能爆发',  desc: '粒子从四周聚拢到角色身上' },
  { id: 3, title: '光柱降临',  desc: '从天而降的暖色圣光柱' },
  { id: 4, title: '涟漪共鸣',  desc: '脚下水波扩散 + 缓缓抬头' },
  { id: 5, title: '3·2·1 倒数', desc: '强游戏感的倒计时唤醒' },
];

const TRIGGERS = [
  { id: 'press', title: '长按蓄力',   desc: '按住 1.2 秒，经典仪式感' },
  { id: 'tap',   title: '连击 3 下',  desc: '像敲窗，轻快有节奏' },
  { id: 'slide', title: '滑动解锁',   desc: 'iPhone 式横滑，推开一扇窗' },
  { id: 'shake', title: '摇一摇',     desc: '晃动手机，复古又亲密' },
  { id: 'voice', title: '按住说话',   desc: '呼喊 QQ 秀的名字，最有对话感' },
  { id: 'click', title: '单击唤醒',   desc: '最轻量，点一下即可' },
];

const RETURNS = [
  { id: 1, title: '直线收缩',     desc: '最简洁，弧度短直接缩到顶' },
  { id: 2, title: '弧线弹跳',     desc: '带弧度+弹性，活泼有节奏' },
  { id: 3, title: '化作星粒',     desc: '虚化模糊收束，魔法感强' },
  { id: 4, title: '跳进画框',     desc: '拟人小跳，先蹲再起' },
  { id: 5, title: '渐隐 + 弹出',   desc: '飞行体淡出 + 头像位置弹出' },
];

// ======= 文案库：对话感强、有仪式感的文案
//   规则：
//   1. 所有文案不含 emoji（部分环境/字体下会出现乱码方框）
//   2. 规避"她/他"等性别指代，统一以「QQ 秀」「形象」等中性词替代 =======
const GREETINGS = [
  'Hi，飞翔的企鹅',
  '嘿，飞翔的企鹅',
  '晚上好，飞翔的企鹅',
  '你好呀，飞翔的企鹅',
];
const TITLES_SLEEPING = [
  '唤醒 QQ 秀，让头像变成有灵魂的形象',
  '你的头像，其实可以是一个有灵魂的 QQ 秀',
  '把 QQ 秀唤醒，静态头像变成会呼吸的形象',
  '叫醒 QQ 秀，让头像真正"活"起来',
];
const SUBTITLES_BY_TRIGGER = {
  press: '长按下方按钮，把 QQ 秀从梦里轻轻抱出来',
  tap:   '轻点 3 下，像敲敲那扇小窗',
  slide: '从左滑到右，推开 QQ 秀的那扇窗',
  shake: '晃一晃手机，QQ 秀会听见',
  voice: '按住说话，喊一声 QQ 秀的名字',
  click: '点一下，QQ 秀就来了',
};
const SPEECHES = [
  'Hi，初次见面',
  '你好呀',
  '诶嘿，你来啦',
  '嘿，我在这',
  '今天也要开心鸭',
];

// ======= effect 9「未读挂件」可轮播的小文案
//   规则：尽量 2-3 个字，避免与"她/他"绑定，覆盖几种情绪/场景
//   - 互动召唤：戳一下 / 来抱抱
//   - 情绪表达：想见你 / 想你了 / 在等你
//   - 实用利益：新消息
//   - 时段问候：晚安啦
//   - 撒娇互动：陪陪我 =======
const PILL_TEXTS = [
  '想见你',
  '来抱抱',
  '戳一下',
  '在等你',
  '想你了',
  '新消息',
  '陪陪我',
  '晚安啦',
];

// ======= 选项渲染器 =======
function renderOpts(containerId, list, currentId, onPick) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = list.map(item => `
    <div class="opt ${item.id === currentId ? 'active' : ''}" data-id="${item.id}">
      <div class="opt-title"><span class="idx">${String(typeof item.id === 'number' ? item.id : item.title).padStart(2,'0')}</span>${item.title}</div>
      <div class="opt-desc">${item.desc}</div>
    </div>
  `).join('');
  wrap.querySelectorAll('.opt').forEach(el => {
    el.addEventListener('click', () => {
      wrap.querySelectorAll('.opt').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      const raw = el.dataset.id;
      const v = isNaN(parseInt(raw, 10)) ? raw : parseInt(raw, 10);
      onPick(v);
    });
  });
}

// ======= 状态 =======
const state = {
  effect: 1,
  wake: 1,
  trigger: 'press',
  return: 1,
  awake: false,
  pressing: false,
};

// ======= DOM =======
const meAvatar    = document.getElementById('meAvatar');
const meAvatarImg = document.getElementById('meAvatarImg');
const sheet       = document.getElementById('sheet');
const sheetMask   = document.getElementById('sheetMask');
const sheetGreeting = document.getElementById('sheetGreeting');
const sheetTitle    = document.getElementById('sheetTitle');
const sheetSubtitle = document.getElementById('sheetSubtitle');
const stageArea   = document.getElementById('stageArea');
const body        = document.getElementById('body');
// 身体里的"睁眼态"APNG（粉色女生从沉睡到活过来）——需要在每次唤醒时重放
const bodyOpenImg = body.querySelector('.img-open');
const BODY_OPEN_SRC = 'assets/avatar/pink-awake.png';
const speech      = document.getElementById('speech');
/* 气泡里真正承载文字 + contenteditable 的节点；
   单独拆出来是为了让 ▶ 播放按钮能和文字并排、又不会被 contenteditable 影响 */
const speechText  = document.getElementById('speechText');
const flyBody     = document.getElementById('flyBody');

// 6 种触发控件
const pressBtn      = document.getElementById('pressBtn');
const pressProgress = document.getElementById('pressProgress');
const pressBtnText  = document.getElementById('pressBtnText');
const tapBtn        = document.getElementById('tapBtn');
const tapBtnText    = document.getElementById('tapBtnText');
const slideTrack    = document.getElementById('slideTrack');
const slideFill     = document.getElementById('slideFill');
const slideThumb    = document.getElementById('slideThumb');
const shakeBtn      = document.getElementById('shakeBtn');
const shakeBtnText  = document.getElementById('shakeBtnText');
const voiceBtn      = document.getElementById('voiceBtn');
const voiceBtnText  = document.getElementById('voiceBtnText');
const clickBtn      = document.getElementById('clickBtn');
const clickBtnText  = document.getElementById('clickBtnText');

// 保存按钮
const saveRow       = document.getElementById('saveRow');
const saveBtn       = document.getElementById('saveBtn');
const saveCancelBtn = document.getElementById('saveCancelBtn');

// 关闭按钮
const sheetCloseBtn = document.getElementById('sheetCloseBtn');

// ======= 初始化方案选项 =======
renderOpts('effectOpts', EFFECTS, state.effect, (id) => {
  state.effect = id;
  meAvatar.dataset.effect = id;
  syncPillRotator();
});
renderOpts('wakeOpts', WAKES, state.wake, (id) => {
  state.wake = id;
  sheet.dataset.wake = id;
});
renderOpts('triggerOpts', TRIGGERS, state.trigger, (id) => {
  state.trigger = id;
  sheet.dataset.trigger = id;
  // 同步更新半屏内的提示副标题（只在未唤醒时覆盖）
  if (!state.awake && sheet.classList.contains('show')) {
    sheetSubtitle.textContent = SUBTITLES_BY_TRIGGER[id] || '';
    replayReveal();
  }
});
renderOpts('returnOpts', RETURNS, state.return, (id) => {
  state.return = id;
  flyBody.dataset.return = id;
});

// ======= effect 9「未读挂件」文案轮播
//   - 仅当当前 effect=9 时启动一个 setInterval，每 2.4s 切一条
//   - 切到其他 effect 时立即停止，避免无意义计时器 =======
const pillEl = meAvatar.querySelector('.fx-outer .pill');
let pillTimer = null;
let pillIdx = 0;
function nextPillText() {
  pillIdx = (pillIdx + 1) % PILL_TEXTS.length;
  // 加一段微动画：fade-out -> 换文字 -> fade-in
  pillEl.style.transition = 'opacity .25s ease, transform .25s ease';
  pillEl.style.opacity = '0';
  pillEl.style.transform = 'translateY(-3px) scale(.92)';
  setTimeout(() => {
    pillEl.textContent = PILL_TEXTS[pillIdx];
    pillEl.style.opacity = '1';
    pillEl.style.transform = '';
  }, 260);
}
function syncPillRotator() {
  // effect 9 才转，其它 effect 停止
  if (pillTimer) { clearInterval(pillTimer); pillTimer = null; }
  if (state.effect === 9) {
    // 立刻随机一条作为初始文案，然后定时轮换
    pillIdx = Math.floor(Math.random() * PILL_TEXTS.length);
    pillEl.textContent = PILL_TEXTS[pillIdx];
    pillTimer = setInterval(nextPillText, 2400);
  }
}
syncPillRotator();

// ======= 随机挑选问候 & 标题，让每次打开都有仪式感 =======
function refreshHeadline() {
  const g = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  const t = TITLES_SLEEPING[Math.floor(Math.random() * TITLES_SLEEPING.length)];
  // 直接用 textContent，避免任何 emoji/特殊字符渲染问题
  sheetGreeting.textContent = g;
  sheetTitle.textContent = t;
  sheetSubtitle.textContent = SUBTITLES_BY_TRIGGER[state.trigger] || '';
}

// ======= 文案逐句浮现：重播动画 =======
function replayReveal() {
  sheet.classList.remove('reveal');
  // 强制回流后再加 class，确保动画重放
  void sheet.offsetWidth;
  sheet.classList.add('reveal');
}

// ======= 打开/关闭半屏 =======
function openSheet() {
  // 若当前已唤醒，先完整复位（像第一次一样）
  resetToSleeping({ closeAfter: false });
  refreshHeadline();
  sheetMask.classList.add('show');
  sheet.classList.add('show');
  replayReveal();
}
function closeSheet() {
  sheet.classList.remove('show');
  sheet.classList.remove('reveal');
  sheetMask.classList.remove('show');
}

meAvatar.addEventListener('click', openSheet);
sheetMask.addEventListener('click', closeSheet);
sheetCloseBtn.addEventListener('click', closeSheet);
document.getElementById('openSheetBtn').addEventListener('click', openSheet);

// ======= T1 · 长按蓄力 =======
const PRESS_DURATION = 1200; // ms
let pressStart = 0;
let pressRAF = null;

function startPress(e) {
  if (state.awake || state.trigger !== 'press') return;
  e && e.preventDefault();
  state.pressing = true;
  sheet.classList.add('pressing');
  pressStart = performance.now();
  pressBtnText.textContent = '正在唤醒…';
  cancelAnimationFrame(pressRAF);
  const tick = () => {
    if (!state.pressing) return;
    const ratio = Math.min(1, (performance.now() - pressStart) / PRESS_DURATION);
    pressProgress.style.width = (ratio * 100) + '%';
    if (ratio >= 1) {
      onWakeSuccess();
    } else {
      pressRAF = requestAnimationFrame(tick);
    }
  };
  pressRAF = requestAnimationFrame(tick);
}
function cancelPress() {
  if (!state.pressing || state.awake) return;
  state.pressing = false;
  sheet.classList.remove('pressing');
  cancelAnimationFrame(pressRAF);
  let w = parseFloat(pressProgress.style.width) || 0;
  pressBtnText.textContent = '再按久一点点～';
  const dec = setInterval(() => {
    w -= 6;
    if (w <= 0) { w = 0; clearInterval(dec); pressBtnText.textContent = '长按唤醒'; }
    pressProgress.style.width = w + '%';
  }, 16);
}
pressBtn.addEventListener('mousedown', startPress);
pressBtn.addEventListener('touchstart', startPress, { passive: false });
['mouseup','mouseleave','touchend','touchcancel'].forEach(ev => {
  pressBtn.addEventListener(ev, cancelPress);
});

// ======= T2 · 连击 3 下 =======
let tapCount = 0;
let tapResetTimer = null;
tapBtn.addEventListener('click', () => {
  if (state.awake || state.trigger !== 'tap') return;
  tapCount = Math.min(3, tapCount + 1);
  tapBtn.dataset.hits = tapCount;
  tapBtn.classList.remove('hit'); void tapBtn.offsetWidth; tapBtn.classList.add('hit');
  clearTimeout(tapResetTimer);
  if (tapCount >= 3) {
    tapBtnText.textContent = '听见你啦～';
    setTimeout(() => onWakeSuccess(), 200);
  } else {
    tapBtnText.textContent = tapCount === 1 ? '再两下~' : '再一下就好~';
    tapResetTimer = setTimeout(() => {
      tapCount = 0;
      tapBtn.dataset.hits = 0;
      tapBtnText.textContent = '点我 3 下，叫醒 QQ 秀';
    }, 1500);
  }
});

// ======= T3 · 滑动解锁 =======
(function initSlide() {
  let dragging = false;
  let startX = 0;
  let maxDx = 0;

  function getTrackMax() {
    return slideTrack.clientWidth - slideThumb.offsetWidth - 8;
  }
  function onDown(e) {
    if (state.awake || state.trigger !== 'slide') return;
    dragging = true;
    slideTrack.classList.remove('returning');
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    maxDx = getTrackMax();
    e.preventDefault();
  }
  function onMove(e) {
    if (!dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    let dx = x - startX;
    dx = Math.max(0, Math.min(maxDx, dx));
    slideThumb.style.left = (4 + dx) + 'px';
    slideFill.style.width = (4 + dx + slideThumb.offsetWidth) + 'px';
    if (dx >= maxDx - 2) {
      dragging = false;
      slideTrack.classList.add('done');
      onWakeSuccess();
    }
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    // 未达终点 → 回弹
    slideTrack.classList.add('returning');
    slideThumb.style.left = '4px';
    slideFill.style.width = '0';
  }
  slideThumb.addEventListener('mousedown', onDown);
  slideThumb.addEventListener('touchstart', onDown, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchend', onUp);
})();

// ======= T4 · 摇一摇（原型用点击模拟） =======
shakeBtn.addEventListener('click', () => {
  if (state.awake || state.trigger !== 'shake') return;
  shakeBtn.classList.remove('shaking'); void shakeBtn.offsetWidth; shakeBtn.classList.add('shaking');
  shakeBtnText.textContent = '摇到啦～';
  setTimeout(() => onWakeSuccess(), 520);
});

// ======= T5 · 按住说话 =======
let voiceTimer = null;
function voiceStart(e) {
  if (state.awake || state.trigger !== 'voice') return;
  e && e.preventDefault();
  voiceBtn.classList.add('recording');
  voiceBtnText.textContent = '正在聆听';
  // 1.1s 后成功（原型）
  voiceTimer = setTimeout(() => {
    voiceBtn.classList.remove('recording');
    onWakeSuccess();
  }, 1100);
}
function voiceEnd() {
  if (voiceTimer) {
    // 松手过早：重置
    clearTimeout(voiceTimer); voiceTimer = null;
    if (!state.awake) {
      voiceBtn.classList.remove('recording');
      voiceBtnText.textContent = '再多说一会儿~';
      setTimeout(() => {
        if (!state.awake) voiceBtnText.textContent = '按住说「嘿，起床啦」';
      }, 1200);
    }
  }
}
voiceBtn.addEventListener('mousedown', voiceStart);
voiceBtn.addEventListener('touchstart', voiceStart, { passive: false });
['mouseup','mouseleave','touchend','touchcancel'].forEach(ev => {
  voiceBtn.addEventListener(ev, voiceEnd);
});

// ======= T6 · 单击唤醒（最轻量）=======
clickBtn.addEventListener('click', () => {
  if (state.awake || state.trigger !== 'click') return;
  // 视觉反馈：按钮加一个一次性 ring 涟漪类，文字短暂改为"已唤醒～"
  clickBtn.classList.remove('clicked'); void clickBtn.offsetWidth; clickBtn.classList.add('clicked');
  clickBtnText.textContent = '已收到，正在唤醒…';
  setTimeout(() => onWakeSuccess(), 220);
});

// ======= 唤醒成功（所有交互方式汇聚到这） =======
function onWakeSuccess() {
  if (state.awake) return;
  state.pressing = false;
  state.awake = true;
  sheet.classList.remove('pressing');
  cancelAnimationFrame(pressRAF);
  pressProgress.style.width = '100%';
  pressBtn.classList.add('done');
  pressBtnText.textContent = '已唤醒';

  // 让所有触发方式（不只 press）都能看到 W2/W3/W4 的"过程动效"
  // 通过临时加 .pressing 类，触发 [data-wake].pressing 选择器一次
  if (state.wake === 2 || state.wake === 3 || state.wake === 4) {
    sheet.classList.add('pressing');
    void sheet.offsetWidth;
  }

  // W5：先走 3·2·1 倒计时，倒计时完成后再进入睁眼
  if (state.wake === 5) {
    sheetSubtitle.textContent = '倒数三下，QQ 秀就出场啦！';
    sheet.classList.remove('counting');
    void sheet.offsetWidth;
    sheet.classList.add('counting');
    setTimeout(() => {
      sheet.classList.remove('counting');
      doAwakeReveal();
    }, 1800);
    return;
  }

  doAwakeReveal();
}

function doAwakeReveal() {
  // 闪光 + 睁眼
  body.classList.add('flashing');
  setTimeout(() => {
    body.classList.add('awake');
    body.classList.remove('flashing');
    // APNG 只会在 src 首次加载时从第 0 帧播放；这里用时间戳 query
    // 强制浏览器重新解码，让"从沉睡到活过来"的 5 秒动画每次都从头播。
    // loop=1（见文件本身的 acTL 改写），播完会定格在最后一帧（已睁眼）。
    if (bodyOpenImg) bodyOpenImg.src = BODY_OPEN_SRC + '?t=' + Date.now();
  }, 380);

  // 显示台词：优先用用户保存的 Slogan，否则随机
  const savedSlogan = (localStorage.getItem('qqxiu_slogan') || '').trim();
  const text = savedSlogan || SPEECHES[Math.floor(Math.random() * SPEECHES.length)];
  speechText.textContent = text;
  stageArea.classList.add('awake');

  // 更新文案（半屏顶部切换为"已唤醒"的对话感）
  // 生成结果这一屏：只保留标题一行，去掉副标题（用户要求"去掉第二行字"），
  // 让放大到 1.5 倍的 APNG 形象有更多垂直呼吸空间，视觉焦点更聚焦。
  sheetGreeting.textContent = 'QQ 秀醒啦';
  sheetTitle.textContent = '你的 QQ 秀已苏醒';
  sheetSubtitle.textContent = '';
  // 用 is-hidden 彻底隐藏，避免 subtitle 的 min-height:16px + margin-top:4px
  // 空占 20px 留白。后续点"开启 QQ 秀"/"再看看"写入新文案时会移除这个类。
  sheetSubtitle.classList.add('is-hidden');
  replayReveal();

  // 显示保存按钮（替换掉底部的唤醒控件）
  setTimeout(() => {
    sheet.classList.add('awoken');
  }, 500);
}

// ======= 保存按钮 → 开始归位 =======
saveBtn.addEventListener('click', () => {
  if (!state.awake) return;
  // 保存动效：按钮先抖一下
  saveBtn.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(.94)' },
      { transform: 'scale(1.04)' },
      { transform: 'scale(1)' },
    ],
    { duration: 320, easing: 'cubic-bezier(.3,1.6,.4,1)' }
  );
  sheetSubtitle.classList.remove('is-hidden');
  sheetSubtitle.textContent = '好啦，这就送 QQ 秀回消息列表顶部~';
  setTimeout(triggerReturn, 260);
});

// "再看看" → 留在半屏里继续欣赏（不归位、不关闭）
saveCancelBtn.addEventListener('click', () => {
  sheetSubtitle.classList.remove('is-hidden');
  sheetSubtitle.textContent = '再看看 QQ 秀~ 准备好了随时点「开启 QQ 秀」';
});

// ======= 归位飞行 =======
function triggerReturn() {
  const phone = document.getElementById('phone');
  const phoneRect = phone.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();

  // 提前把顶部头像切换成"圆角方形全身像"的尺寸/形状，
  // 这样飞行体的终点才能精准落到最终形态上，避免落位后"跳一下"。
  meAvatar.classList.add('returned');
  // 强制回流，读取新尺寸
  void meAvatar.offsetWidth;
  const targetRect = meAvatar.getBoundingClientRect();

  const startX = bodyRect.left - phoneRect.left + bodyRect.width / 2;
  const startY = bodyRect.top  - phoneRect.top  + bodyRect.height / 2;
  const endX   = targetRect.left - phoneRect.left + targetRect.width / 2;
  const endY   = targetRect.top  - phoneRect.top  + targetRect.height / 2;
  const startW = bodyRect.width;
  const startH = bodyRect.height;
  const endW   = targetRect.width;
  const endH   = targetRect.height;

  flyBody.style.left = startX + 'px';
  flyBody.style.top  = startY + 'px';
  flyBody.style.width = startW + 'px';
  flyBody.style.height = startH + 'px';
  flyBody.style.transform = 'translate(-50%, -50%)';
  flyBody.style.setProperty('--end-x', endX + 'px');
  flyBody.style.setProperty('--end-y', endY + 'px');
  flyBody.style.setProperty('--end-w', endW + 'px');
  flyBody.style.setProperty('--end-h', endH + 'px');
  flyBody.style.opacity = '1';
  flyBody.dataset.return = state.return;

  sheet.classList.remove('show');
  sheetMask.classList.remove('show');

  body.style.visibility = 'hidden';

  void flyBody.offsetWidth;
  flyBody.classList.add('animate');

  flyBody.addEventListener('animationend', onFlyEnd, { once: true });
}

function onFlyEnd() {
  // 归位后入口头像固定用粉色头像（已经是"那个形象"的定妆照，
  // 不需要在导航栏里再播一次醒来动画）
  meAvatarImg.src = 'assets/avatar/pink-portrait.png';

  // returned 状态已在 triggerReturn 里加好，这里只处理归位特效
  meAvatar.classList.remove('pop-in', 'r3-land');
  void meAvatar.offsetWidth;
  if (state.return === 5) {
    meAvatar.classList.add('pop-in');
  } else if (state.return === 3) {
    meAvatar.classList.add('r3-land');
  }

  flyBody.classList.remove('animate');
  flyBody.style.opacity = '0';
  body.style.visibility = '';
}

// ======= 复位到「熟睡态」的统一方法 =======
function resetToSleeping({ closeAfter = true } = {}) {
  state.awake = false;
  state.pressing = false;
  body.classList.remove('awake', 'flashing');
  stageArea.classList.remove('awake');
  sheet.classList.remove('counting', 'pressing', 'awoken');
  // 清除唤醒成功屏临时隐藏副标题的标记，让 refreshHeadline 写入的
  // 触发器默认副标题可以正常显示。
  sheetSubtitle.classList.remove('is-hidden');

  // 各触发控件复位
  pressBtn.classList.remove('done');
  pressBtnText.textContent = '长按唤醒';
  pressProgress.style.width = '0%';

  tapCount = 0;
  tapBtn.dataset.hits = 0;
  tapBtn.classList.remove('hit');
  tapBtnText.textContent = '点我 3 下，叫醒 QQ 秀';

  slideTrack.classList.remove('done', 'returning');
  slideThumb.style.left = '4px';
  slideFill.style.width = '0';

  shakeBtn.classList.remove('shaking');
  shakeBtnText.textContent = '摇一摇手机，悄悄唤醒';

  voiceBtn.classList.remove('recording');
  voiceBtnText.textContent = '按住说「嘿，起床啦」';
  if (voiceTimer) { clearTimeout(voiceTimer); voiceTimer = null; }

  clickBtn.classList.remove('clicked');
  clickBtnText.textContent = '点一下，唤醒 QQ 秀';

  flyBody.classList.remove('animate');
  flyBody.style.opacity = '0';

  if (closeAfter) closeSheet();
}

// ======= 重置整个流程（把顶部头像也换回静态入口） =======
document.getElementById('resetBtn').addEventListener('click', () => {
  meAvatarImg.src = 'assets/avatar/pink-portrait.png';
  meAvatar.classList.remove('pop-in', 'r3-land', 'returned');
  resetToSleeping({ closeAfter: true });
});

// ============================================================
// Slogan 气泡：可编辑文案 + 切换音色 + 播放语音（接 tts-server）
// ============================================================
//
// 设计要点：
// 1. 文案与音色用 localStorage 持久化，刷新后仍是用户的"我的 Slogan"。
// 2. 工具条 hover 气泡时浮现；编辑/选音色时常驻（避免消失）。
// 3. TTS 接口默认走本机 tts_server.py（http://localhost:8766/tts），
//    失败时回退到同源 /tts（Vercel 部署路径）。播放期间按钮显示 loading。
// 4. 编辑：contenteditable + 回车保存 + Esc 取消 + 失焦保存；
//    粘贴时去掉富文本、限制最长 30 字。
// ============================================================

const SLOGAN_KEY = 'qqxiu_slogan';
const VOICE_KEY  = 'qqxiu_voice';
const VOICE_LABELS = {
  'zh-CN-XiaoxiaoNeural': '晓晓',
  'zh-CN-XiaoyiNeural':   '晓伊',
  'zh-CN-YunxiNeural':    '云希',
  'zh-CN-YunyangNeural':  '云扬',
  'zh-CN-YunjianNeural':  '云健',
};
// TTS 服务地址候选：本地优先，Vercel 兜底
const TTS_ENDPOINTS = [
  'http://localhost:8766/tts',
  '/tts',
];
const SLOGAN_MAX_LEN = 30;

const speechWrap     = document.getElementById('speechWrap');
const speechTools    = document.getElementById('speechTools');
const speechEditBtn  = document.getElementById('speechEditBtn');
const speechVoiceBtn = document.getElementById('speechVoiceBtn');
const speechVoiceMenu= document.getElementById('speechVoiceMenu');
const speechVoiceLabel = document.getElementById('speechVoiceLabel');
const speechPlayBtn  = document.getElementById('speechPlayBtn');

// ---- 当前音色（从 localStorage 读，没有则默认晓晓） ----
let currentVoice = localStorage.getItem(VOICE_KEY) || 'zh-CN-XiaoxiaoNeural';
function refreshVoiceUI() {
  speechVoiceLabel.textContent = VOICE_LABELS[currentVoice] || '音色';
  speechVoiceMenu.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', b.dataset.voice === currentVoice);
  });
}
refreshVoiceUI();

// ---- 编辑：进入 / 保存 / 取消 ----
// 说明：contenteditable 挂在 `.speech-text` 上（文字 span），而不是气泡外壳，
// 这样气泡内部的 ▶ 按钮不会被当成可编辑内容，点按钮也不会进入编辑态。
// 编辑高亮的 `.editing` class 仍然加在 .speech 外壳上（控制整个气泡外观）。
function enterEditMode() {
  speech.classList.add('editing');
  speechText.contentEditable = 'true';
  speechText.focus();
  // 选中全部文字，方便直接覆盖
  const range = document.createRange();
  range.selectNodeContents(speechText);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
function exitEditMode(save) {
  if (!speech.classList.contains('editing')) return;
  speech.classList.remove('editing');
  speechText.contentEditable = 'false';
  if (save) {
    let text = (speechText.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length > SLOGAN_MAX_LEN) text = text.slice(0, SLOGAN_MAX_LEN);
    if (!text) text = 'Hi，初次见面~'; // 空内容兜底
    speechText.textContent = text;
    localStorage.setItem(SLOGAN_KEY, text);
  } else {
    // 取消：还原为存档值
    const saved = localStorage.getItem(SLOGAN_KEY);
    if (saved) speechText.textContent = saved;
  }
}
speechEditBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  enterEditMode();
});
// 直接点击气泡文字也进入编辑（点 ▶ 按钮不触发，由按钮自身 stopPropagation 接管）
speechText.addEventListener('click', () => {
  if (speech.classList.contains('editing')) return;
  enterEditMode();
});
speechText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    speechText.blur(); // 触发 blur → 保存
  } else if (e.key === 'Escape') {
    e.preventDefault();
    exitEditMode(false);
    speechText.blur();
  }
});
speechText.addEventListener('blur', () => exitEditMode(true));
// 粘贴时去掉富文本格式，限长
speechText.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text') || '';
  const clean = text.replace(/\s+/g, ' ').slice(0, SLOGAN_MAX_LEN);
  document.execCommand('insertText', false, clean);
});

// ---- 音色下拉 ----
speechVoiceBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  speechWrap.classList.toggle('voice-open');
});
speechVoiceMenu.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-voice]');
  if (!btn) return;
  e.stopPropagation();
  currentVoice = btn.dataset.voice;
  localStorage.setItem(VOICE_KEY, currentVoice);
  refreshVoiceUI();
  speechWrap.classList.remove('voice-open');
  // 切换音色后立即试听
  playSlogan();
});
// 点别处关掉下拉
document.addEventListener('click', (e) => {
  if (!speechWrap.contains(e.target)) {
    speechWrap.classList.remove('voice-open');
  }
});

// ---- 播放 TTS ----
let currentAudio = null;

async function fetchTTS(text, voice) {
  // 依次尝试候选地址，第一个成功的返回
  let lastErr = null;
  for (const base of TTS_ENDPOINTS) {
    try {
      const url = `${base}?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (!blob || blob.size < 200) throw new Error('empty audio');
      return URL.createObjectURL(blob);
    } catch (err) {
      lastErr = err;
      // 继续下一个
    }
  }
  throw lastErr || new Error('no tts endpoint reachable');
}

async function playSlogan() {
  const text = (speechText.textContent || '').trim();
  if (!text) return;
  // 已有音频在播 → 停掉重播
  if (currentAudio) {
    try { currentAudio.pause(); } catch (e) {}
    currentAudio = null;
  }
  speechPlayBtn.classList.add('loading');
  speechPlayBtn.classList.remove('playing');
  try {
    const objectUrl = await fetchTTS(text, currentVoice);
    const audio = new Audio(objectUrl);
    currentAudio = audio;
    audio.addEventListener('playing', () => {
      speechPlayBtn.classList.remove('loading');
      speechPlayBtn.classList.add('playing');
    });
    audio.addEventListener('ended', () => {
      speechPlayBtn.classList.remove('loading', 'playing');
      URL.revokeObjectURL(objectUrl);
      currentAudio = null;
    });
    audio.addEventListener('error', () => {
      speechPlayBtn.classList.remove('loading', 'playing');
      URL.revokeObjectURL(objectUrl);
      currentAudio = null;
      showSpeechToast('浏览器拦截了音频播放，先和页面交互一下再试', 'warn');
    });
    await audio.play();
  } catch (err) {
    speechPlayBtn.classList.remove('loading', 'playing');
    console.error('[TTS]', err);
    // 区分两种常见失败
    const isHttps = location.protocol === 'https:';
    if (isHttps) {
      showSpeechToast('https 页面无法访问 http://localhost，请改用 http 访问或把页面部署到同域 /tts', 'error');
    } else {
      showSpeechToast(
        '本地 TTS 服务未启动，请先运行：python3 tts_server.py',
        'error',
        6000
      );
    }
  }
}

// 简易 toast：挂在气泡下方，不打断操作
function showSpeechToast(msg, level = 'info', ttl = 4200) {
  let toast = document.getElementById('speechToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'speechToast';
    toast.className = 'speech-toast';
    speechWrap.appendChild(toast);
  }
  toast.textContent = msg;
  toast.dataset.level = level;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), ttl);
}
speechPlayBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  playSlogan();
});
