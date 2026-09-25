(() => {
  'use strict';
  const demos = {
    equipment: { label: '設備会社', name: '澄川設備' },
    'real-estate': { label: '不動産会社', name: '間と庭不動産' },
    legal: { label: '行政書士事務所', name: '紙と道 行政書士事務所' },
    tax: { label: '税理士事務所', name: '青庭会計室' }
  };
  const key = new URLSearchParams(window.location.search).get('demo');
  if (!Object.prototype.hasOwnProperty.call(demos, key)) return;
  const panel = document.getElementById('demoInquiry');
  if (!panel) return;
  const demo = demos[key];
  const message = document.getElementById('demoInquiryMessage');
  document.getElementById('demoInquiryTitle').textContent = `${demo.label}のデモをご覧になった方へ`;
  message.textContent = `${demo.label}のデモ「${demo.name}」を見ました。\nこのデモを参考に、ホームページ制作について相談したいです。\n\n業種：\nいまの状況：\n相談したいこと：`;
  document.getElementById('demoInquiryBack').href = `demos/${key}/`;
  panel.hidden = false;
  document.getElementById('copyDemoMessage').addEventListener('click', async () => {
    const status = document.getElementById('demoInquiryStatus');
    try {
      await navigator.clipboard.writeText(message.textContent);
      status.textContent = '相談文をコピーしました。LINE・フォームに貼り付けて、分かる範囲でご記入ください。';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(message);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = '相談文を選択しました。端末のコピー操作を使ってください。';
    }
  });
})();
