const ADMOB_CONFIG = {
  androidRewardAdId: 'ca-app-pub-3940256099942544/5224354917',
  isTesting: true
};

const adsState = {
  initialized: false,
  initializing: null,
  pluginLoading: null
};

function getAdMobPlugin() {
  return window.Capacitor?.Plugins?.AdMob || window.capacitorStripe?.AdMob || null;
}

function loadAdMobPluginBundle() {
  if (getAdMobPlugin()) return Promise.resolve();
  if (!window.capacitorExports) {
    return Promise.reject(new Error('Capacitor runtime is not available.'));
  }
  if (adsState.pluginLoading) return adsState.pluginLoading;

  adsState.pluginLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'vendor/admob/plugin.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load AdMob plugin bundle.'));
    document.head.appendChild(script);
  });

  return adsState.pluginLoading;
}

async function ensureAdMob() {
  if (adsState.initialized) return getAdMobPlugin();
  if (adsState.initializing) return adsState.initializing;

  adsState.initializing = (async () => {
    await loadAdMobPluginBundle();
    const AdMob = getAdMobPlugin();
    if (!AdMob) {
      throw new Error('AdMob plugin is not available. Build and run through Capacitor Android.');
    }

    await AdMob.initialize({
      initializeForTesting: ADMOB_CONFIG.isTesting
    });
    adsState.initialized = true;
    return AdMob;
  })();

  try {
    return await adsState.initializing;
  } finally {
    adsState.initializing = null;
  }
}

async function showRewardedRefreshAd() {
  const AdMob = await ensureAdMob();
  await AdMob.prepareRewardVideoAd({
    adId: ADMOB_CONFIG.androidRewardAdId,
    isTesting: ADMOB_CONFIG.isTesting,
    immersiveMode: true
  });
  const reward = await AdMob.showRewardVideoAd();
  return Boolean(reward);
}

window.VeggieMergeAds = {
  showRewardedRefreshAd
};
