const ENVIRONMENT_EVENT_DEFS = {
  strong_wind: {
    name: '強風',
    description: '掉落軌跡微偏',
    className: 'event-wind',
    duration: ENV_EVENT_DURATION
  },
  heavy_rain: {
    name: '暴雨',
    description: '蔬菜變滑',
    className: 'event-rain',
    duration: ENV_EVENT_DURATION
  },
  pest: {
    name: '蟲害',
    description: '部分蔬菜腐化加速',
    className: 'event-pest',
    duration: ENV_EVENT_DURATION
  },
  harvest: {
    name: '豐收',
    description: 'Combo 時間變長',
    className: 'event-harvest',
    duration: HARVEST_EVENT_DURATION
  }
};
const RANDOM_ENVIRONMENT_EVENT_IDS = ['harvest', 'strong_wind', 'heavy_rain', 'pest'];

function triggerEnvironmentEvent(id, now = performance.now()) {
  const def = ENVIRONMENT_EVENT_DEFS[id];
  if (!def) return;

  const existing = state.activeEnvironmentEvents.find((event) => event.id === id);
  if (existing) {
    existing.expiresAt = Math.max(existing.expiresAt, now + def.duration);
    return;
  }

  state.activeEnvironmentEvents.push({
    id,
    startedAt: now,
    expiresAt: now + def.duration
  });
}

function checkLevelEnvironmentEvents(fromLevel, toLevel) {
  if (fromLevel < ENV_EVENT_RANDOM_UNLOCK_LEVEL && toLevel >= ENV_EVENT_RANDOM_UNLOCK_LEVEL) {
    state.nextEnvironmentEventRollAt = 0;
  }
}

function rollRandomEnvironmentEvents(now) {
  if (state.playerLevel < ENV_EVENT_RANDOM_UNLOCK_LEVEL) {
    state.nextEnvironmentEventRollAt = 0;
    return;
  }

  if (!state.nextEnvironmentEventRollAt) {
    state.nextEnvironmentEventRollAt = now + ENV_EVENT_RANDOM_ROLL_INTERVAL;
    return;
  }

  if (now < state.nextEnvironmentEventRollAt) return;

  for (const id of RANDOM_ENVIRONMENT_EVENT_IDS) {
    if (isEnvironmentEventActive(id, now)) continue;
    if (Math.random() < ENV_EVENT_RANDOM_CHANCE) {
      triggerEnvironmentEvent(id, now);
    }
  }
  state.nextEnvironmentEventRollAt = now + ENV_EVENT_RANDOM_ROLL_INTERVAL;
}

function updateEnvironmentEvents(now = performance.now()) {
  if (state.environmentEventsPausedAt) return;
  state.activeEnvironmentEvents = state.activeEnvironmentEvents.filter((event) => now < event.expiresAt);
  rollRandomEnvironmentEvents(now);
}

function environmentEventNow(now = performance.now()) {
  return state.environmentEventsPausedAt || now;
}

function pauseEnvironmentEvents(now = performance.now()) {
  if (state.environmentEventsPausedAt) return;
  state.activeEnvironmentEvents = state.activeEnvironmentEvents.filter((event) => now < event.expiresAt);
  if (!state.activeEnvironmentEvents.length) return;
  state.environmentEventsPausedAt = now;
}

function resumeEnvironmentEvents(now = performance.now()) {
  if (!state.environmentEventsPausedAt) return;

  const pausedDuration = now - state.environmentEventsPausedAt;
  state.activeEnvironmentEvents.forEach((event) => {
    event.startedAt += pausedDuration;
    event.expiresAt += pausedDuration;
  });
  state.environmentEventsPausedAt = 0;
  updateEnvironmentEvents(now);
}

function isEnvironmentEventActive(id, now = performance.now()) {
  const eventNow = environmentEventNow(now);
  return state.activeEnvironmentEvents.some((event) => event.id === id && eventNow < event.expiresAt);
}

function environmentComboBonus(now = performance.now()) {
  return isEnvironmentEventActive('harvest', now) ? HARVEST_COMBO_BONUS : 0;
}

function harvestCorruptionRecovery(now = performance.now()) {
  return isEnvironmentEventActive('harvest', now)
    ? HARVEST_CORRUPTION_RECOVERY_MULTIPLIER
    : 0;
}

function windVelocityOffset(now = performance.now()) {
  if (!isEnvironmentEventActive('strong_wind', now)) return 0;
  return Math.sin(now * 0.0034) * STRONG_WIND_FORCE + (Math.random() - 0.5) * 1.1;
}

function windForceForBody(body, now = performance.now()) {
  if (!isEnvironmentEventActive('strong_wind', now)) return 0;
  const gust = Math.sin(now * 0.0034) + Math.sin(now * 0.008 + body.id) * 0.35;
  return gust * STRONG_WIND_BODY_FORCE;
}

function rainFrictionFor(baseFriction, now = performance.now()) {
  return isEnvironmentEventActive('heavy_rain', now)
    ? baseFriction * HEAVY_RAIN_FRICTION_MULTIPLIER
    : baseFriction;
}

function isPestAffected(body) {
  if (!body) return false;
  if (body.pestAffected === undefined) {
    body.pestAffected = Math.random() < PEST_AFFECT_CHANCE;
  }
  return body.pestAffected;
}

function pestCorruptionMultiplier(body, now = performance.now()) {
  return isEnvironmentEventActive('pest', now) && isPestAffected(body)
    ? PEST_CORRUPTION_MULTIPLIER
    : 1;
}

function activeEnvironmentEventLabels(now = performance.now()) {
  const eventNow = environmentEventNow(now);
  return state.activeEnvironmentEvents
    .filter((event) => eventNow < event.expiresAt)
    .map((event) => {
      const def = ENVIRONMENT_EVENT_DEFS[event.id];
      const remaining = Math.ceil((event.expiresAt - eventNow) / 1000);
      return `${def?.name || event.id} ${remaining}s`;
    });
}

function environmentEventClassList(now = performance.now()) {
  const eventNow = environmentEventNow(now);
  return state.activeEnvironmentEvents
    .filter((event) => eventNow < event.expiresAt)
    .map((event) => ENVIRONMENT_EVENT_DEFS[event.id]?.className)
    .filter(Boolean);
}
