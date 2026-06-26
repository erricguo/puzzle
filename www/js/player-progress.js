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

function normalizeLeaderboardRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map(normalizeLeaderboardRow)
    .filter((row) => row.score > 0 && row.best_combo > 0)
    .slice(0, LEADERBOARD_LIMIT);
}

function resetProgressForIdentityLoad() {
  state.coins = 0;
  state.ownedTalents = [];
  state.reviveTickets = STARTING_REVIVE_TICKETS;
  state.bombs = 0;
  state.dailyMissionState = {};
  state.encyclopediaUnlockedLevels = [0];
  leaderboardState.localRows = [];
  leaderboardState.rows.classic = [];
  leaderboardState.rows.item = [];
  leaderboardState.recentScoreRow = null;
  leaderboardState.recentScoreRank = null;
  updateCoinUi?.();
  updateHud?.();
}

async function persistPlayerProgressToSupabase() {
  const client = leaderboardState.client;
  const user = leaderboardState.user;
  if (!client || !user) return false;

  const guestIdentity = user.is_anonymous
    ? {
      guest_player_id: leaderboardState.guestPlayerId,
      guest_player_name: leaderboardState.guestPlayerName
    }
    : {
      guest_player_id: null,
      guest_player_name: null
    };

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
      ...guestIdentity,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) throw error;
  return true;
}

function queuePlayerProgressSync() {
  if (!leaderboardState.isIdentityReady) return;
  persistPlayerProgressToSupabase().catch((error) => {
    console.warn('Player progress Supabase save failed', error);
  });
}

async function syncPlayerProgressForCurrentUser(syncToken = leaderboardState.identitySyncToken) {
  const client = leaderboardState.client;
  const user = leaderboardState.user;
  if (!client || !user) {
    updateCoinUi?.();
    renderTalentShop?.();
    return;
  }

  const { data, error } = await client
    .from(PLAYER_PROGRESS_TABLE)
    .select('coins, owned_talents, revive_tickets, bombs, daily_missions, audio_settings, guest_player_id, guest_player_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (syncToken !== leaderboardState.identitySyncToken || leaderboardState.user?.id !== user.id) return false;

  if (error) {
    console.warn('Player progress Supabase load failed', error);
    return false;
  }

  const remoteCoins = Math.max(0, Math.floor(Number(data?.coins || 0)));
  const remoteSettings = data?.audio_settings && typeof data.audio_settings === 'object'
    ? normalizeAudioSettings(data.audio_settings)
    : null;
  state.coins = remoteCoins;
  state.ownedTalents = normalizeTalentIds(Array.isArray(data?.owned_talents) ? data.owned_talents : []);
  state.reviveTickets = data ? normalizeProgressInteger(data?.revive_tickets) : STARTING_REVIVE_TICKETS;
  state.bombs = normalizeProgressInteger(data?.bombs);
  state.dailyMissionState = normalizeDailyMissionPayload(data?.daily_missions);
  if (remoteSettings) {
    audioState.enabled = remoteSettings.soundEnabled;
    audioState.musicVolume = remoteSettings.musicVolume;
    audioState.sfxVolume = remoteSettings.sfxVolume;
    hapticsState.enabled = remoteSettings.hapticsEnabled;
    updateAudioVolume?.();
    updateHapticsUi?.();
  }
  if (user.is_anonymous && typeof data?.guest_player_id === 'string') {
    leaderboardState.guestPlayerId = data.guest_player_id;
  }
  if (user.is_anonymous && typeof data?.guest_player_name === 'string') {
    leaderboardState.guestPlayerName = data.guest_player_name;
    leaderboardState.playerName = data.guest_player_name;
  }
  normalizeDailyMissionState?.();
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
  if (syncToken !== leaderboardState.identitySyncToken || leaderboardState.user?.id !== user.id) return false;
  await persistPlayerProgressToSupabase();
  return true;
}
