(function () {
  'use strict';

  function init() {
    var el = document.getElementById('quiz-widget') || document.querySelector('[data-quiz-id]');
    if (!el) return;

    var quizId = el.getAttribute('data-quiz-id');
    var brandId = el.getAttribute('data-brand-id') || '';
    var appUrl = 'https://nitaiecompro-nine.vercel.app';

    if (!quizId) {
      el.innerHTML = '<p style="color:#ef4444;font-size:14px">Quiz widget: missing data-quiz-id attribute</p>';
      return;
    }

    var src = appUrl + '/quiz/embed/' + quizId + '?brand_id=' + encodeURIComponent(brandId);

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%;max-width:580px;margin:0 auto;';

    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style.cssText = 'width:100%;min-height:640px;border:none;border-radius:20px;box-shadow:0 4px 32px rgba(0,0,0,0.10);display:block;';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.title = 'Product Quiz';

    // Auto-resize iframe based on content
    window.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'quiz-resize' && e.data.height) {
        iframe.style.minHeight = e.data.height + 'px';
      }
    });

    wrapper.appendChild(iframe);
    el.innerHTML = '';
    el.appendChild(wrapper);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
