const PLAYER_PROGRESS_TABLE = 'vegetable_player_progress';

function normalizeTalentIds(ids) {
  const validIds = new Set(TALENT_DEFS.map((talent) => talent.id));
  return [...new Set((Array.isArray(ids) ? ids : [])
    .filter((id) => typeof id === 'string' && validIds.has(id)))];
}

function saveLocalProgress() {
  localStorage.setItem('veggieMergeCoins', String(state.coins));
  localStorage.setItem('veggieMergeOwnedTalents', JSON.stringify(state.ownedTalents));
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
    .select('coins, owned_talents')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('Player progress Supabase load failed', error);
    return;
  }

  const localCoins = Math.max(0, Math.floor(state.coins));
  const remoteCoins = Math.max(0, Math.floor(Number(data?.coins || 0)));
  const mergedTalents = normalizeTalentIds([
    ...state.ownedTalents,
    ...(Array.isArray(data?.owned_talents) ? data.owned_talents : [])
  ]);

  state.coins = Math.max(localCoins, remoteCoins);
  state.ownedTalents = mergedTalents;
  saveLocalProgress();
  updateCoinUi?.();
  if (talentScene && !talentScene.hidden) {
    renderTalentShop();
  }
  await persistPlayerProgressToSupabase();
}
