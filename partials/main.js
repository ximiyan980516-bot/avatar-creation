/* ============================================================
   主交互脚本：方案切换 + 半屏唤醒 + 多种唤醒交互 + 归位飞行
   ============================================================ */

// ======= 数据：方案描述 =======
// 每个数组前 N 项为\"推荐方案\"——按用户指定顺序排列，title 前缀 🌟 作为视觉标记。
// 注意：id 保持不变（CSS/JS 里大量 [data-effect=\"3\"]、state.return===5 这类绑定都
// 依赖 id，不能因为展示顺序调整而改动）。只调整数组元素顺序 + 在推荐项 title 前
// 加 🌟，渲染器 renderOpts() 会按新顺序从上到下铺到选项面板里。
// 默认选中项：统一为各分类列表的第一项（即第一个 🌟 推荐项），让 demo 一打开
// 就落在我们最想展示的方案上。见下方 state 初始化。
const EFFECTS = [
  // —— 推荐：睡眠ZZZ → 呼吸光圈 → 头像抖动 ——
  { id: 7,  title: '🌟 睡眠 ZZZ',  desc: '"它在睡，叫醒它"，强联动' },
  { id: 1,  title: '🌟 呼吸光圈',  desc: '蓝色光圈 2s 缓慢呼吸，最克制' },
  { id: 3,  title: '🌟 头像抖动',  desc: '左右快速抖动 + 右上角漫画声波，像在喊话' },
  // —— 以下按原顺序保留 ——
  { id: 2,  title: '双层水波',    desc: '两圈错开扩散，"有动静"' },
  { id: 4,  title: '比心轻拍',    desc: '头像旁轻轻冒爱心，俏皮一拍' },
  { id: 5,  title: '星粒环绕',    desc: '三色粒子绕行，二次元拉满' },
  { id: 6,  title: '流光描边',    desc: '彩色描边旋转，VIP 高级感' },
  { id: 8,  title: '情绪冒泡',    desc: '爱心从头像飘出，有性格' },
  { id: 9,  title: '未读挂件',    desc: '小标签可挂运营文案，可点击' },
  { id: 10, title: '全息扫光',    desc: '高光从左滑到右，"加载中"' },
];

const WAKES = [
  // —— 推荐：温柔睁眼 → 蓄能爆发 → 3·2·1 倒数 ——
  { id: 1, title: '🌟 温柔睁眼',    desc: '呼吸 → 闪光 → 睁眼，自然朴素' },
  { id: 2, title: '🌟 蓄能爆发',    desc: '粒子从四周聚拢到角色身上' },
  { id: 5, title: '🌟 3·2·1 倒数', desc: '强游戏感的倒计时唤醒' },
  // —— 以下按原顺序保留 ——
  { id: 3, title: '光柱降临',     desc: '从天而降的暖色圣光柱' },
  { id: 4, title: '涟漪共鸣',     desc: '脚下水波扩散 + 缓缓抬头' },
];

const TRIGGERS = [
  // —— 推荐：单击唤醒 → 长按蓄力 ——
  { id: 'click', title: '🌟 单击唤醒',  desc: '最轻量，点一下即可' },
  { id: 'press', title: '🌟 长按蓄力',  desc: '按住 1.2 秒，经典仪式感' },
  // —— 以下按原顺序保留 ——
  { id: 'tap',   title: '连击 3 下',   desc: '像敲窗，轻快有节奏' },
  { id: 'slide', title: '滑动解锁',    desc: 'iPhone 式横滑，推开一扇窗' },
  { id: 'shake', title: '摇一摇',      desc: '晃动手机，复古又亲密' },
  { id: 'voice', title: '按住说话',    desc: '呼喊 QQ 秀的名字，最有对话感' },
];

const RETURNS = [
  // —— 推荐：直线收缩 → 化作星粒 → 渐隐+弹出 ——
  { id: 1, title: '🌟 直线收缩',   desc: '最简洁，弧度短直接缩到顶' },
  { id: 3, title: '🌟 化作星粒',   desc: '虚化模糊收束，魔法感强' },
  { id: 5, title: '🌟 渐隐 + 弹出', desc: '飞行体淡出 + 头像位置弹出' },
  // —— 以下按原顺序保留 ——
  { id: 2, title: '弧线弹跳',     desc: '带弧度+弹性，活泼有节奏' },
  { id: 4, title: '跳进画框',     desc: '拟人小跳，先蹲再起' },
];

// 语音编辑交互方案（Slogan 气泡点 ✎ 后的编辑路径）
// A：就地小弹出——contenteditable 在气泡上直接改，音色是气泡下方的小菜单
// B：全屏编辑页——独立一页，上文案 textarea，下音色卡片列表
// 唯一区别在 "speechEditBtn 被点击后走哪条路径"，其它（最终存档到 localStorage、
// TTS 调用、角色 slogan 显示）两个方案共享。
const SPEECH_EDITS = [
  { id: 'A', title: '🌟 A · 就地编辑（现状）',  desc: '文案在气泡内直接改，音色悬浮小菜单，每条可试听' },
  { id: 'B', title: 'B · 全屏编辑页',          desc: '点 ✎ 打开独立页：上文案框，下音色大列表，每条可试听' },
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
// 默认值 = 各分类列表的第一项（与 EFFECTS/WAKES/TRIGGERS/RETURNS/SPEECH_EDITS
// 数组的首元素对齐）。如果以后调整数组顺序，记得把这里的默认 id 同步。
const state = {
  effect: 7,              // EFFECTS[0] = 睡眠 ZZZ
  wake: 1,                // WAKES[0]   = 温柔睁眼
  trigger: 'click',       // TRIGGERS[0]= 单击唤醒
  return: 1,              // RETURNS[0] = 直线收缩
  speechEdit: 'A',        // SPEECH_EDITS[0] = 就地编辑（A）
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
// 语音编辑方案 —— 由 speechEditBtn 的点击处理分发到具体路径
renderOpts('speechEditOpts', SPEECH_EDITS, state.speechEdit, (id) => {
  state.speechEdit = id;
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
  // ======= 唤醒总时序（以 APNG 第一帧开始为 t=0）=======
  //   APNG 总长 ≈ 5.1s / 80 帧，loop=1 播完定格在最后一帧（acTL 已改）。
  //   关键节点（用户反馈"文字时机再前 ~2s"，整体把爆发 + 文字提前 2s）：
  //     t=0.00s  .flashing 开始（白光 0.55s）
  //     t=0.38s  .body.awake → img-open 显形并开始播 APNG
  //     t=2.10s  .body.burst → 水波纹双圈从角色身位往外扩散（~1.3s）
  //                           + 角色 scale 回弹（0.7s）
  //     t=2.70s  .sheet.reveal（延迟触发）→ title 行带模糊+上浮飘入
  //              title 的 CSS delay 0.75s → 真正出现 ≈ t=3.45s，
  //              文字浮出时 APNG 还在播，用户能同时看到角色动 + 字出
  //     t=5.60s  .sheet.awoken → 底部切换为保存按钮（仍保持原节奏，
  //              让用户看完整段动画再做保存决定）
  // ====================================================

  // t=0：闪光铺底 + 立刻隐藏底部唤醒按钮
  // 用户反馈：唤醒后唤醒按钮（长按/语音/摇/单击那组）就该消失。之前只有
  // .sheet.awoken 在 t=5.6s 才会收它们，中间 5 秒多按钮一直挂在画面上，
  // 感觉"按钮没反应"。加 .waking 这个过渡类让 CSS 立刻隐藏 trigger；
  // .save-row 仍在 .awoken 阶段才浮出（见 resetToSleeping 清理）。
  sheet.classList.add('waking');
  // 同步加 .awakening：CSS 用它把 .sheet-head 的 margin-top 从 -8px
  // 切到 32px。之前这件事挂在 stage-area.awake 上（5500ms 才加），
  // 导致文案 2700ms 飘入时还在旧位置，3 秒后整块往下跳 40px——用户
  // 反馈「文案先从上方出现，再跳变回正确位置」就是这个 bug。现在
  // 在 doAwakeReveal 起始就把位置定好，飘入直接落在最终位置上。
  sheet.classList.add('awakening');
  body.classList.add('flashing');
  setTimeout(() => {
    // t≈0.38s：切到 awake，APNG 起播
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
  // 注意：这里只写入文本，不切 stageArea.awake —— 气泡的显形门控
  // 现在由 CSS 的 `.stage-area.awake .speech-wrap` 独占，切换时机
  // 被推迟到下面 5500ms 的定时器里（APNG 播完之后），这样用户会先
  // 看完整段"从沉睡到活过来"的 5s 动画，再看到气泡从角色肩边浮出。

  // —— 先把旧文案藏起来，再改写 —— //
  // 进入此函数时 sheet 通常仍带着上一轮 openSheet 里 replayReveal 留下的
  // .reveal 类，三行的 forwards 动画已经停留在 opacity:1。如果此时直接替换
  // textContent，用户会看到【旧文案瞬间变新文案 → 2.3s 后 replayReveal 先
  // remove('reveal') 让基础规则把它再归零 → 再重新飘入】这样"出现→消失→
  // 又出现"的 bug。
  //
  // 做法：在改文本之前 remove('reveal')，让 `.sheet-head > * { opacity:0 }`
  // 的基础规则立刻生效 —— 三行瞬间归零（视觉上旧文案就此消失）。此刻用户
  // 的注意力在闪光和动图放大上，感知不到文案淡出。之后 4.7s 再调
  // replayReveal() 重新触发飘入，从用户视角只剩一次"文字浮现"。
  sheet.classList.remove('reveal');

  // 更新文案（半屏顶部切换为"已唤醒"的对话感）
  // 生成结果这一屏：
  //   greeting（22px 大标题） = "你的 QQ 秀已苏醒"
  //   title（14px 第二行）   = "点「开启 QQ 秀」，把它留在消息列表顶部"
  //   subtitle（12px 第三行） = 隐藏（用户要求去掉第三行辅助说明）
  // 注意：.greeting 才是视觉上的大标题（fs:22 fw:700），.title 是次标题，
  // .subtitle 才是最小的辅助说明——不是按源码顺序理解的"第二行"。
  sheetGreeting.textContent = '你的 QQ 秀已苏醒';
  sheetTitle.textContent = '点「开启 QQ 秀」，把它留在消息列表顶部';
  sheetSubtitle.textContent = '';
  // 用 is-hidden 彻底隐藏 subtitle，避免 min-height:16px + margin-top:4px
  // 空占 20px 留白。后续点"开启 QQ 秀"/"再看看"写入新文案时会移除这个类。
  sheetSubtitle.classList.add('is-hidden');

  // t≈3.1s：APNG 播到接近尾声时触发水波纹双圈爆发 —— 粉色/蓝色描边一圈追
  // 一圈往外扩散（参考入口的 halo-ring / effects.css 里的 fx2-ripple 风格），
  // 与角色的 scale 回弹叠加，像"从身位炸开一圈圈光"。保持 1.4s 后再撤类，
  // 让 ::before 那一圈（delay 0.22s，1.1s 动画）也能完整走完。
  // 用户反馈："形象生成后的蓝色光晕时机再后推 1s"——原触发在 2100ms（APNG
  // 播到一半就爆），形象刚变出来就被光晕抢戏。后移到 3100ms，让角色先完成
  // 大部分睁眼/入场动作，观众看清"她已经醒了"之后，再配合一圈蓝色水波纹
  // 作为情绪点缀；此时 replayReveal（2700ms）已先飘入文案，顺序变成
  // 文案→光晕→切按钮（5600ms），节奏更清晰。光晕持续 1.4s，4.5s 左右结束，
  // 仍早于 awoken 切按钮，互不冲突。 */
  setTimeout(() => {
    body.classList.add('burst');
    setTimeout(() => body.classList.remove('burst'), 1400);
  }, 3100);

  // t≈2.7s：比之前提前约 2s 让文案飘入（title CSS delay 0.75s →
  // 真正可见约 t=3.45s）。APNG 还在播，但用户此时能同时感知到
  // "角色在动 + 文字浮出 + 水波纹还在外扩"，整体信息密度更紧凑，
  // 不再等 APNG 完整播完才出字。
  setTimeout(() => {
    replayReveal();
  }, 2700);

  // t≈5.5s：APNG（总长 5.1s，t=0.38s 起播 → t≈5.48s 播完定格）
  // 播放完成的瞬间，让 slogan 气泡从角色肩边浮出。这是"唤醒完成"
  // 的收尾动作，紧接其后的 5.6s awoken 切保存按钮，形成
  //   角色定格 → 气泡登场 → 底部切按钮
  // 一气呵成的 100ms 收束节拍。
  //
  // handle 记到 state 上，如果在 5.5s 之内用户按了顶部 resetBtn
  // 或别的路径提前走 resetToSleeping，我们能取消这个延时，避免
  // 气泡在"已经回到 sleeping 态"后突然冒出来。
  state.speechRevealTimer = setTimeout(() => {
    state.speechRevealTimer = null;
    // 再加一道闸：如果已经被 resetToSleeping 清掉 awake，就不显气泡
    if (!state.awake) return;
    stageArea.classList.add('awake');
  }, 5500);

  // t≈5.6s：动画完全落地后再把底部切到保存按钮，给用户一个明显的
  // "动画结束、可以操作了"信号，避免在爆发/出字过程里误触。
  setTimeout(() => {
    sheet.classList.add('awoken');
  }, 5600);
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

// ======= 抓取 APNG 当前定格帧 → DataURL =======
// 用户反馈："点击开启 QQ 秀，应该是动图最后一帧回到左上角，而不是静态头像"。
// 问题背景：
//   - 半屏里的 .img-open 是 APNG（loop=1），播完定格在最后一帧——视觉上"醒着"的样子；
//   - 但归位时 #flyBody 里一直用的是 pink-portrait.png（静态闭眼圆头像），
//     落位后又把 meAvatarImg.src 也设成这张，相当于"醒了一下又睡回去"。
// 解决思路：
//   在触发归位飞行的瞬间（此时 .img-open 在屏上显示的就是 APNG 的最后一帧），
//   用 <canvas> 把它当前画面画下来，导出 PNG dataURL。<img drawImage> 拿到的
//   就是"当前帧"，即定格那一帧。然后把这张真正的末帧静态图喂给：
//     1) 飞行体 #flyBody 里的 <img>  —— 飞的一路就是醒着形象；
//     2) navbar 的 meAvatarImg        —— 落位后头像也是醒着形象。
//   这样不需要额外素材文件，也不用担心 APNG 换 src 被重置到第 1 帧的副作用。
//
// 失败兜底：canvas 抓取可能因为图片尚未 complete / 跨域污染而失败——
// 此时返回 null，调用方会退回到原来的 pink-awake.png 或 pink-portrait.png。
// 本项目 APNG 和页面同源，不会踩 tainted canvas。
let cachedAwakeFrameDataURL = null;
function captureAwakeLastFrameDataURL() {
  if (cachedAwakeFrameDataURL) return cachedAwakeFrameDataURL;
  try {
    if (!bodyOpenImg || !bodyOpenImg.complete || !bodyOpenImg.naturalWidth) {
      return null;
    }
    const w = bodyOpenImg.naturalWidth;
    const h = bodyOpenImg.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bodyOpenImg, 0, 0, w, h);
    cachedAwakeFrameDataURL = canvas.toDataURL('image/png');
    return cachedAwakeFrameDataURL;
  } catch (err) {
    // 任何异常都不让它阻断归位流程
    console.warn('[awake-frame] capture failed, falling back', err);
    return null;
  }
}

// ======= 归位飞行 =======
function triggerReturn() {
  const phone = document.getElementById('phone');
  const phoneRect = phone.getBoundingClientRect();
  const bodyRect = body.getBoundingClientRect();

  // 飞行体的 <img> 默认是 pink-portrait.png（闭眼圆头像），但此刻半屏里的
  // APNG 已经播完定格在"醒着的最后一帧"。把那一帧抓下来塞给飞行体，让
  // 归位过程看到的就是醒着的形象。
  const awakeFrame = captureAwakeLastFrameDataURL();
  if (awakeFrame) {
    const flyImg = flyBody.querySelector('img');
    if (flyImg) flyImg.src = awakeFrame;
  }

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
  // 归位后入口头像应当显示"APNG 最后一帧"（= 醒着的粉色形象），而不是
  // 闭眼的静态圆头像。优先用 triggerReturn 里抓到的定格帧 dataURL；如果
  // 抓取失败（比如 bodyOpenImg 还没加载完），退回 pink-portrait.png 保
  // 底——至少不会报错，视觉上回到最初状态。
  const awakeFrame = captureAwakeLastFrameDataURL();
  meAvatarImg.src = awakeFrame || 'assets/avatar/pink-portrait.png';

  // 落位瞬间才加 .landed —— 配合 common.css 里
  // .navbar .me-avatar.returned.landed > img { transform: scale(1.5) }
  // 让归位后的全身形象放大到 1.5 倍。
  // 为什么不把 scale 直接写在 .returned > img 上：triggerReturn() 在飞行
  // 开始前就加了 .returned（提前锁定 44×54 终点几何），如果那时就带 1.5x，
  // navbar 里原本的闭眼静态圆头像会在飞行还没开始的瞬间先膨胀一下（用户
  // 此前反馈："归位时静态头像也会变大"）。把放大推迟到这里，就与飞行体
  // keyframe 终点的 scale(1.5) 同帧对齐：飞行体 opacity → 0 的那一刻，
  // navbar 里的图刚好被放大到 1.5x，无跳变。
  meAvatar.classList.add('landed');

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
  // 取消可能仍在倒计时的"APNG 播完后再显气泡"定时器。没取消的话，
  // 用户在 5.5s 之内触发重置，气泡会在 sleeping 态下突然冒出。
  if (state.speechRevealTimer) {
    clearTimeout(state.speechRevealTimer);
    state.speechRevealTimer = null;
  }
  body.classList.remove('awake', 'flashing', 'burst');
  stageArea.classList.remove('awake');
  sheet.classList.remove('counting', 'pressing', 'awoken', 'waking', 'awakening');
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
  meAvatar.classList.remove('pop-in', 'r3-land', 'returned', 'landed');
  // 清掉"醒着末帧"dataURL 缓存：虽然 APNG 内容不变、重抓也是同一张图，
  // 但清掉能保证下次归位时一定是"这一次播完的帧"，语义更干净。
  cachedAwakeFrameDataURL = null;
  // 若用户当前在方案 B 的编辑页里，重置流程也应把它关掉（=视作取消），
  // 避免重置后页面背景回到 sleeping 态、但编辑页还悬在上面这种"穿模"。
  if (editPage && editPage.classList.contains('show')) {
    closeEditPage(false);
  }
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
  // 方案 A：沿用就地 contenteditable；方案 B：打开全屏编辑页
  if (state.speechEdit === 'B') {
    openEditPage();
  } else {
    enterEditMode();
  }
});
// 直接点击气泡文字也进入编辑（点 ▶ 按钮不触发，由按钮自身 stopPropagation 接管）
// 同样按当前 speechEdit 分发——方案 B 下点文字会打开编辑页。
speechText.addEventListener('click', () => {
  if (speech.classList.contains('editing')) return;
  if (state.speechEdit === 'B') {
    openEditPage();
  } else {
    enterEditMode();
  }
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
  // 先看看点的是不是"▶ 试听"那个小圆钮（.vm-preview[data-preview]）
  // 若是：只试听该音色，不切换 currentVoice、不关菜单，用户可以连续听几条再决定
  const previewEl = e.target.closest('[data-preview]');
  if (previewEl) {
    e.stopPropagation();
    const btn = previewEl.closest('button[data-voice]');
    if (!btn) return;
    previewTTSInMenu(btn.dataset.voice, previewEl);
    return;
  }
  // 否则按老行为：点选文字区 → 切音色 + 关菜单 + 试听新音色
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

// ============================================================
//  语音编辑方案 A/B 共享：「纯试听」TTS
//  说明：
//  · 方案 A 的音色菜单每一行右侧 ▶ 小圆钮
//  · 方案 B 的编辑页每个音色卡片左侧 ▶ 大圆钮
//  两者都需要"只听不切换"的能力——用户未决定前，应该能反复预听不同音色，
//  最终决策后再点选/保存。因此 previewTTS 不触碰 currentVoice/LocalStorage，
//  只临时用 fetchTTS 拉该音色的音频试播；并维护 previewAudio 独立于主播放器
//  currentAudio，避免互相打断造成状态混乱。
//  previewTTSOn(el, voice)：
//    - 传入某个 ▶ 按钮 DOM（可以是 .vm-preview 也可以是 .ep-voice-play）
//    - 播放期间把 el.classList.add('playing')，结束/失败时移除；
//      同时清除任何其他带 'playing' 的 preview 元素，保证\"同一时刻
//      只有一个试听钮在播\"。
// ============================================================
let previewAudio = null;
let previewPlayingEl = null;
function clearPreviewPlayingUI() {
  if (previewPlayingEl) {
    previewPlayingEl.classList.remove('playing');
    previewPlayingEl = null;
  }
}
async function previewTTSOn(el, voice) {
  // 再点一次同一个按钮 = 停止试听（常见交互心智）
  if (previewAudio && previewPlayingEl === el) {
    try { previewAudio.pause(); } catch (e) {}
    previewAudio = null;
    clearPreviewPlayingUI();
    return;
  }
  // 切换到另一个按钮：先停旧的再播新的
  if (previewAudio) {
    try { previewAudio.pause(); } catch (e) {}
    previewAudio = null;
  }
  clearPreviewPlayingUI();

  // 试听文本优先用当前 Slogan（气泡里写什么就听什么，最贴合真实效果）；
  // 若为空则退回一句通用问候。长度同样做 SLOGAN_MAX_LEN 截断，避免奇怪长文。
  let text = (speechText.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) text = '你好呀，这是试听';
  if (text.length > SLOGAN_MAX_LEN) text = text.slice(0, SLOGAN_MAX_LEN);

  el.classList.add('playing');
  previewPlayingEl = el;
  try {
    const url = await fetchTTS(text, voice);
    const audio = new Audio(url);
    previewAudio = audio;
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url);
      if (previewAudio === audio) {
        previewAudio = null;
        clearPreviewPlayingUI();
      }
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      if (previewAudio === audio) {
        previewAudio = null;
        clearPreviewPlayingUI();
      }
    });
    await audio.play();
  } catch (err) {
    console.error('[TTS preview]', err);
    clearPreviewPlayingUI();
    previewAudio = null;
    // 复用原有 toast 提示，避免两套错误文案分叉
    const isHttps = location.protocol === 'https:';
    if (isHttps) {
      showSpeechToast('https 页面无法访问 http://localhost，请改用 http 访问或把页面部署到同域 /tts', 'error');
    } else {
      showSpeechToast('本地 TTS 服务未启动，请先运行：python3 tts_server.py', 'error', 6000);
    }
  }
}
// 薄封装：给气泡音色菜单的 ▶ 用；逻辑完全复用 previewTTSOn
function previewTTSInMenu(voice, previewEl) {
  previewTTSOn(previewEl, voice);
}

// ============================================================
//  方案 B：全屏编辑页 —— 打开 / 渲染 / 保存 / 取消
//  · openEditPage()：从当前气泡文案 + currentVoice 读取值，填充页面；滑入可见
//  · closeEditPage(save)：save=true 写回 speechText/SLOGAN_KEY、切 currentVoice；
//                         save=false 放弃，不改动任何状态
//  · renderEpVoiceList()：根据 VOICE_LABELS 列表生成卡片；每张卡片结构：
//      [▶ 试听]  [名称(粗)+描述(灰)]  [单选指示器]
//    ▶ 复用 previewTTSOn；整行点击 = 选中该音色（页内临时态，保存后才落盘）
// ============================================================
const editPage     = document.getElementById('editPage');
const epTextarea   = document.getElementById('epTextarea');
const epCount      = document.getElementById('epCount');
const epCancelBtn  = document.getElementById('epCancelBtn');
const epSaveBtn    = document.getElementById('epSaveBtn');
const epVoiceList  = document.getElementById('epVoiceList');

// 与气泡菜单一致的 5 个音色（顺序/描述都对齐，维护时从此处改动）
const VOICE_ROWS = [
  { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', desc: '温柔女声' },
  { id: 'zh-CN-XiaoyiNeural',   name: '晓伊', desc: '活泼女声' },
  { id: 'zh-CN-YunxiNeural',    name: '云希', desc: '阳光男声' },
  { id: 'zh-CN-YunyangNeural',  name: '云扬', desc: '沉稳男声' },
  { id: 'zh-CN-YunjianNeural',  name: '云健', desc: '磁性男声' },
];
// 编辑页内\"临时\"选中的音色——进入页面时 = currentVoice；保存时才写回；
// 这样用户可以在试听几个后点\"取消\"放弃本次变更。
let epSelectedVoice = null;

function renderEpVoiceList() {
  epVoiceList.innerHTML = VOICE_ROWS.map(v => `
    <div class="ep-voice-item ${v.id === epSelectedVoice ? 'active' : ''}" data-voice="${v.id}">
      <button class="ep-voice-play" type="button" data-preview aria-label="试听 ${v.name}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <div class="ep-voice-meta">
        <div class="ep-voice-name">${v.name}</div>
        <div class="ep-voice-desc">${v.desc}</div>
      </div>
      <div class="ep-voice-radio"></div>
    </div>
  `).join('');
}
// 事件委托在 epVoiceList 上，区分\"▶ 试听\"（stopPropagation）和\"整行选中\"
epVoiceList.addEventListener('click', (e) => {
  const playBtn = e.target.closest('[data-preview]');
  if (playBtn) {
    e.stopPropagation();
    const row = playBtn.closest('.ep-voice-item');
    if (row) previewTTSOn(playBtn, row.dataset.voice);
    return;
  }
  const row = e.target.closest('.ep-voice-item');
  if (!row) return;
  epSelectedVoice = row.dataset.voice;
  // 仅更新视觉高亮；currentVoice 要等用户点"保存"才真正切换
  epVoiceList.querySelectorAll('.ep-voice-item').forEach(el => {
    el.classList.toggle('active', el === row);
  });
});

function openEditPage() {
  // 先把\"气泡里现在显示的文案 + 当前音色\"同步进编辑页
  epTextarea.value = (speechText.textContent || '').trim();
  epCount.textContent = epTextarea.value.length;
  epSelectedVoice = currentVoice;
  renderEpVoiceList();
  editPage.classList.add('show');
  editPage.setAttribute('aria-hidden', 'false');
  // 聚焦到文案框，配合 textarea 焦点高亮更清楚\"可以改\"
  setTimeout(() => { try { epTextarea.focus(); } catch (e) {} }, 250);
}
function closeEditPage(save) {
  // 关闭前先停掉任何仍在试听的音频，避免页面关掉后音还在响
  if (previewAudio) {
    try { previewAudio.pause(); } catch (e) {}
    previewAudio = null;
  }
  clearPreviewPlayingUI();

  if (save) {
    let text = (epTextarea.value || '').replace(/\s+/g, ' ').trim();
    if (text.length > SLOGAN_MAX_LEN) text = text.slice(0, SLOGAN_MAX_LEN);
    if (!text) text = 'Hi，初次见面~';
    speechText.textContent = text;
    localStorage.setItem(SLOGAN_KEY, text);
    if (epSelectedVoice && epSelectedVoice !== currentVoice) {
      currentVoice = epSelectedVoice;
      localStorage.setItem(VOICE_KEY, currentVoice);
      refreshVoiceUI();
    }
  }
  editPage.classList.remove('show');
  editPage.setAttribute('aria-hidden', 'true');
}
// textarea 实时字数
epTextarea.addEventListener('input', () => {
  let v = epTextarea.value;
  if (v.length > SLOGAN_MAX_LEN) {
    v = v.slice(0, SLOGAN_MAX_LEN);
    epTextarea.value = v;
  }
  epCount.textContent = v.length;
});
epCancelBtn.addEventListener('click', () => closeEditPage(false));
epSaveBtn.addEventListener('click',   () => closeEditPage(true));
// 点击上半屏的遮罩（.edit-page::before 区域）= 取消。
// 遮罩是伪元素，点击命中会冒泡到 .edit-page 本身，且 e.target === editPage；
// 而点到 header/body 内部的真实子节点时 e.target 是它们，不会触发关闭。
editPage.addEventListener('click', (e) => {
  if (e.target === editPage) closeEditPage(false);
});
// Esc 快速取消（桌面端预览便利）
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editPage.classList.contains('show')) {
    closeEditPage(false);
  }
});
