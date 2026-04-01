window.CAFE_ANALYTICS = window.CAFE_ANALYTICS || {
  goatcounterUrl: 'https://ststs811.goatcounter.com/count',
};

(function initHiddenAnalytics() {
  const config = window.CAFE_ANALYTICS || {};
  const goatcounterUrl = (config.goatcounterUrl || '').trim();

  if (!goatcounterUrl || goatcounterUrl.includes('YOUR-CODE') || location.protocol === 'file:') {
    return;
  }

  window.goatcounter = window.goatcounter || {};

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = goatcounterUrl;
  document.head.appendChild(script);
})();
