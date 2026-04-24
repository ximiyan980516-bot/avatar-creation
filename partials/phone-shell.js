/* 注入消息列表内容 */
(async function () {
  const listArea = document.getElementById('listArea');
  if (!listArea) return;
  try {
    const html = await fetch('partials/chat-rows.html').then(r => r.text());
    listArea.insertAdjacentHTML('beforeend', html);
  } catch (e) {
    console.warn('Failed to load chat rows', e);
  }
})();
