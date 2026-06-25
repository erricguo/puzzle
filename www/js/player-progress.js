const PLAYER_PROGRESS_TABLE = 'vegetable_player_progress';

function normalizeTalentIds(ids) {
  const validIds = new Set(TALENT_DEFS.map((talent) => talent.id));
  return [...new Set((Array.isArray(ids) ? ids : [])
    .filter((id) => typeof id === 'string' && validIds.has(id)))];
}

function normalizeProgressInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function normalizeAudioSettings(settings = {}) {
  return {
    soundEnabled: settings.soundEnabled !== false,
    musicVolume: clamp(Number(settings.musicVolume ?? 0.7), 0, 1),
    sfxVolume: clamp(Number(settings.sfxVolume ?? 0.85), 0, 1),
    hapticsEnabled: settings.hapticsEnabled !== false
  };
}

function currentAudioSettings() {
  return normalizeAudioSettings({
    soundEnabled: audioState.enabled,
    musicVolume: audioState.musicVolume,
    sfxVolume: audioState.sfxVolume,
    hapticsEnabled: hapticsState.enabled
  });
}

function normalizeDailyMissionPayload(payload) {
  if (!payload || typeof payload !== 'object') return {};
  return {
    date: typeof payload.date === 'string' ? payload.date : '',
    adRefreshUsed: payload.adRefreshUsed === true,
    missions: Array.isArray(payload.missions)
      ? payload.missions
        .filter((mission) => mission && typeof mission.id === 'string')
        .map((mission) => ({
          id: mission.id,
          progress: normalizeProgressInteger(mission.progress),
          completed: mission.completed === true,
          rewardClaimed: mission.rewardClaimed === true
        }))
      : []
  };
}

function mergeDailyMissionPayloads(localPayload, remotePayload) {
  const local = normalizeDailyMissionPayload(localPayload);
  const remote = normalizeDailyMissionPayload(remotePayload);
  if (!remote.date) return local;
  if (!local.date) return remote;
  if (remote.date > local.date) return remote;
  if (local.date > remote.date) return local;

  const missionMap = new Map();
  [...local.missions, ...remote.missions].forEach((mission) => {
    const existing = missionMap.get(mission.id);
    missionMap.set(mission.id, existing
      ? {
        id: mission.id,
        progress: Math.max(existing.progress, mission.progress),
        completed: existing.completed || mission.completed,
        rewardClaimed: existing.rewardClaimed || mission.rewardClaimed
      }
      : mission);
  });

  return {
    date: local.date,
    adRefreshUsed: local.adRefreshUsed || remote.adRefreshUsed,
    missions: [...missionMap.values()]
  };
}

function normalizeLeaderboardRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map(normalizeLeaderboardRow)
    .filter((row) => row.score > 0 && row.best_combo > 0)
    .slice(0, LEADERBOARD_LIMIT);
}

function mergeLeaderboardRows(localRows, remoteRows) {
  const rowMap = new Map();
  [...normalizeLeaderboardRows(localRows), ...normalizeLeaderboardRows(remoteRows)].forEach((row) => {
    const key = row.id || row.local_id || `${row.player_id}:${row.score}:${row.best_combo}:${row.board_type}:${row.created_at}`;
    rowMap.set(key, row);
  });
  return [...rowMap.values()]
    .sort((a, b) => b.score - a.score || b.best_combo - a.best_combo || a.created_at.localeCompare(b.created_at))
    .slice(0, LEADERBOARD_LIMIT);
}

function saveLocalProgress() {
  localStorage.setItem('veggieMergeCoins', String(state.coins));
  localStorage.setItem('veggieMergeOwnedTalents', JSON.stringify(state.ownedTalents));
  localStorage.setItem('veggieMergeReviveTickets', String(state.reviveTickets));
  localStorage.setItem('veggieMergeBombs', String(state.bombs));
  localStorage.setItem('veggieMergeDailyMissions', JSON.stringify(state.dailyMissionState));
  localStorage.setItem('veggieMergeSoundEnabled', String(audioState.enabled));
  localStorage.setItem('veggieMergeMusicVolume', String(audioState.musicVolume));
  localStorage.setItem('veggieMergeSfxVolume', String(audioState.sfxVolume));
  localStorage.setItem('veggieMergeHapticsEnabled', String(hapticsState.enabled));
  localStorage.setItem('veggieMergeLocalLeaderboard', JSON.stringify(leaderboardState.localRows));
  localStorage.setItem('veggieMergeGuestPlayerId', leaderboardState.guestPlayerId);
  localStorage.setItem('veggieMergeGuestPlayerName', leaderboardState.guestPlayerName);
}

async function persistPlayerProgressToSupabase() {
  const client = leaderboardState.client;
  const user = leaderboardState.user;
  if (!client || !user) return false;

  const { error } = await client
    .from(PLAYER_PROGRESS_TABLE)
    .upsert({
      user_id: user.id,
      coins: Math.max(0, Math.floor(state.coins)),
      owned_talents: normalizeTalentIds(state.ownedTalents),
      revive_tickets: normalizeProgressInteger(state.reviveTickets),
      bombs: normalizeProgressInteger(state.bombs),
      daily_missions: normalizeDailyMissionPayload(state.dailyMissionState),
      audio_settings: currentAudioSettings(),
      local_leaderboard: normalizeLeaderboardRows(leaderboardState.localRows),
      guest_player_id: leaderboardState.guestPlayerId,
      guest_player_name: leaderboardState.guestPlayerName,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) throw error;
  return true;
}

function queuePlayerProgressSync() {
  persistPlayerProgressToSupabase().catch((error) => {
    console.warn('Player progress Supabase save failed', error);
  });
}

async function syncPlayerProgressForCurrentUser() {
  const client = leaderboardState.client;
  const user = leaderboardState.user;
  if (!client || !user) {
    updateCoinUi?.();
    renderTalentShop?.();
    return;
  }

  const { data, error } = await client
    .from(PLAYER_PROGRESS_TABLE)
    .select('coins, owned_talents, revive_tickets, bombs, daily_missions, audio_settings, local_leaderboard, guest_player_id, guest_player_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('Player progress Supabase load failed', error);
    return;
  }

  const localCoins = Math.max(0, Math.floor(state.coins));
  const remoteCoins = Math.max(0, Math.floor(Number(data?.coins || 0)));
  const remoteSettings = data?.audio_settings && typeof data.audio_settings === 'object'
    ? normalizeAudioSettings(data.audio_settings)
    : null;
  const mergedTalents = normalizeTalentIds([
    ...state.ownedTalents,
    ...(Array.isArray(data?.owned_talents) ? data.owned_talents : [])
  ]);

  state.coins = Math.max(localCoins, remoteCoins);
  state.ownedTalents = mergedTalents;
  state.reviveTickets = Math.max(normalizeProgressInteger(state.reviveTickets), normalizeProgressInteger(data?.revive_tickets));
  state.bombs = Math.max(normalizeProgressInteger(state.bombs), normalizeProgressInteger(data?.bombs));
  state.dailyMissionState = mergeDailyMissionPayloads(state.dailyMissionState, data?.daily_missions);
  leaderboardState.localRows = mergeLeaderboardRows(leaderboardState.localRows, data?.local_leaderboard);
  if (remoteSettings) {
    audioState.enabled = remoteSettings.soundEnabled;
    audioState.musicVolume = remoteSettings.musicVolume;
    audioState.sfxVolume = remoteSettings.sfxVolume;
    hapticsState.enabled = remoteSettings.hapticsEnabled;
    updateAudioVolume?.();
    updateHapticsUi?.();
  }
  if (typeof data?.guest_player_id === 'string') {
    leaderboardState.guestPlayerId = data.guest_player_id;
  }
  if (typeof data?.guest_player_name === 'string') {
    leaderboardState.guestPlayerName = data.guest_player_name;
  }
  saveLocalProgress();
  updateCoinUi?.();
  updateHud?.();
  if (talentScene && !talentScene.hidden) {
    renderTalentShop();
  }
  if (dailyScene && !dailyScene.hidden) {
    renderDailyMissions();
  }
  if (leaderboardScene && !leaderboardScene.hidden) {
    loadLeaderboard();
  }
  await syncPendingLocalLeaderboardRows();
  await persistPlayerProgressToSupabase();
}
