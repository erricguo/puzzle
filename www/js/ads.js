const ADMOB_CONFIG = {
  androidRewardAdId: 'ca-app-pub-3940256099942544/5224354917',
  isTesting: true,
  prepareTimeoutMs: 20000,
  showTimeoutMs: 90000
};

const adsState = {
  initialized: false,
  initializing: null,
  pluginLoading: null
};

function getAdMobPlugin() {
  return window.Capacitor?.Plugins?.AdMob || window.capacitorStripe?.AdMob || null;
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout])
    .finally(() => window.clearTimeout(timeoutId));
}

async function addAdMobListener(AdMob, eventName, listener) {
  if (typeof AdMob.addListener !== 'function') return null;
  try {
    return await AdMob.addListener(eventName, listener);
  } catch (error) {
    console.warn(`AdMob listener setup failed: ${eventName}`, error);
    return null;
  }
}

function removeAdMobListeners(handles) {
  handles.forEach((handle) => {
    try {
      handle?.remove?.();
    } catch (error) {
      console.warn('AdMob listener cleanup failed', error);
    }
  });
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

  const handles = [];
  stopMusic();
  handles.push(await addAdMobListener(AdMob, 'onRewardedVideoAdLoaded', (info) => {
    console.info('Reward ad loaded', info);
  }));
  handles.push(await addAdMobListener(AdMob, 'onRewardedVideoAdFailedToLoad', (error) => {
    console.warn('Reward ad failed to load', error);
  }));
  handles.push(await addAdMobListener(AdMob, 'onRewardedVideoAdFailedToShow', (error) => {
    console.warn('Reward ad failed to show', error);
  }));

  try {
    await withTimeout(AdMob.prepareRewardVideoAd({
      adId: ADMOB_CONFIG.androidRewardAdId,
      isTesting: ADMOB_CONFIG.isTesting,
      immersiveMode: true
    }), ADMOB_CONFIG.prepareTimeoutMs, '廣告載入逾時，請確認手機網路或稍後再試');

    const reward = await withTimeout(new Promise((resolve, reject) => {
      let finished = false;
      const finish = (result, error = null) => {
        if (finished) return;
        finished = true;
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };

      Promise.all([
        addAdMobListener(AdMob, 'onRewardedVideoAdReward', (rewardItem) => finish(rewardItem || true)),
        addAdMobListener(AdMob, 'onRewardedVideoAdDismissed', () => finish(false)),
        addAdMobListener(AdMob, 'onRewardedVideoAdFailedToShow', (error) => {
          finish(false, new Error(error?.message || '廣告顯示失敗'));
        })
      ])
        .then((showHandles) => {
          handles.push(...showHandles);
          return AdMob.showRewardVideoAd();
        })
        .then((rewardItem) => finish(rewardItem || true))
        .catch((error) => finish(false, error));
    }), ADMOB_CONFIG.showTimeoutMs, '廣告顯示逾時，請稍後再試');

    return Boolean(reward);
  } finally {
    removeAdMobListeners(handles);
    startMusic();
  }
}

window.VeggieMergeAds = {
  showRewardedRefreshAd
};
