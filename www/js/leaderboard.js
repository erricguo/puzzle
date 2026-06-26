const LEADERBOARD_LIMIT = 1000;
const GUEST_SESSION_STORAGE_KEY = 'veggieMergeGuestSession';
const LEGACY_LOCAL_STORAGE_KEYS = [
  'veggieMergeBombs',
  'veggieMergeCoins',
  'veggieMergeDailyMissions',
  'veggieMergeEncyclopediaLevels',
  'veggieMergeGuestPlayerId',
  'veggieMergeGuestPlayerName',
  'veggieMergeHapticsEnabled',
  'veggieMergeLocalLeaderboard',
  'veggieMergeMusicVolume',
  'veggieMergeOwnedTalents',
  'veggieMergePlayerId',
  'veggieMergePlayerName',
  'veggieMergeReviveTickets',
  'veggieMergeSfxVolume',
  'veggieMergeSoundEnabled',
  'veggieMergeVolume'
];

function saveLocalLeaderboard() {
  const sorted = [...leaderboardState.localRows]
    .map(normalizeLeaderboardRow)
    .sort((a, b) => b.score - a.score || b.best_combo - a.best_combo || a.created_at.localeCompare(b.created_at))
    .slice(0, LEADERBOARD_LIMIT);
  leaderboardState.localRows = sorted;
}

function normalizeLeaderboardRow(row) {
  return {
    ...row,
    score: Math.max(0, Math.floor(Number(row.score) || 0)),
    best_combo: Math.max(0, Math.floor(Number(row.best_combo) || 0)),
    best_level: clamp(Math.floor(Number(row.best_level) || 1), 1, VEGETABLES.length),
    board_type: row.board_type === 'item' ? 'item' : 'classic',
    created_at: row.created_at || new Date().toISOString()
  };
}

function currentBoardType() {
  return leaderboardState.activeTab === 'item' ? 'item' : 'classic';
}

function clearLegacyLocalGameData() {
  LEGACY_LOCAL_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
}

function loadGuestSessionSnapshot() {
  try {
    const snapshot = JSON.parse(localStorage.getItem(GUEST_SESSION_STORAGE_KEY) || 'null');
    if (snapshot?.access_token && snapshot?.refresh_token) return snapshot;
  } catch {
    // Ignore malformed auth snapshots.
  }
  return null;
}

function saveGuestSessionSnapshot(session) {
  if (!session?.access_token || !session?.refresh_token) return;
  leaderboardState.guestSessionSnapshot = {
    access_token: session.access_token,
    refresh_token: session.refresh_token
  };
  localStorage.setItem(GUEST_SESSION_STORAGE_KEY, JSON.stringify(leaderboardState.guestSessionSnapshot));
}

function clearGuestSessionSnapshot() {
  leaderboardState.guestSessionSnapshot = null;
  localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
}

function setSupabaseGateReady(ready) {
  leaderboardState.isIdentityReady = ready;
  [
    startButton,
    startDailyButton,
    startTalentButton,
    startEncyclopediaButton,
    startLeaderboardButton
  ].forEach((button) => {
    if (button) button.disabled = !ready;
  });
}

function setupSupabase() {
  clearLegacyLocalGameData();
  const config = window.SUPABASE_CONFIG || {};
  const canCreateClient = Boolean(window.supabase?.createClient);
  leaderboardState.isConfigured = Boolean(config.url && config.anonKey && canCreateClient);
  leaderboardState.guestSessionSnapshot = loadGuestSessionSnapshot();
  setSupabaseGateReady(false);

  if (!leaderboardState.isConfigured) {
    accountStatusEl.textContent = 'Supabase is required. Please check configuration.';
    googleSignInButton.hidden = true;
    return;
  }

  leaderboardState.client = window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  accountStatusEl.textContent = 'Connecting to Supabase...';
  googleSignInButton.disabled = true;

  leaderboardState.authSubscription = leaderboardState.client.auth.onAuthStateChange((_event, session) => {
    applySupabaseUser(session?.user || null).catch((error) => {
      console.warn('Supabase user apply failed', error);
    });
    if (leaderboardScene && !leaderboardScene.hidden) {
      loadLeaderboard();
    }
  }).data?.subscription;

  syncSupabaseUser();
}

async function syncSupabaseUser() {
  if (!leaderboardState.client) return;

  const { data: sessionData, error: sessionError } = await leaderboardState.client.auth.getSession();
  if (sessionError) {
    setSupabaseGateReady(false);
    leaderboardMessageEl.textContent = `Supabase session failed: ${sessionError.message}`;
    return;
  }

  if (sessionData?.session?.user) {
    if (sessionData.session.user.is_anonymous && sessionData.session.access_token && sessionData.session.refresh_token) {
      saveGuestSessionSnapshot(sessionData.session);
    }
    await applySupabaseUser(sessionData.session.user);
    return;
  }

  const { data, error } = await leaderboardState.client.auth.signInAnonymously();
  if (error) {
    setSupabaseGateReady(false);
    accountStatusEl.textContent = `Anonymous sign-in failed: ${error.message}`;
    leaderboardMessageEl.textContent = 'Supabase anonymous auth must be enabled.';
    googleSignInButton.disabled = false;
    return;
  }

  if (data?.session?.access_token && data?.session?.refresh_token) {
    saveGuestSessionSnapshot(data.session);
  }
  await applySupabaseUser(data?.user || null);
}

async function restoreGuestSessionOrCreateNew() {
  if (!leaderboardState.client) return false;

  const snapshot = leaderboardState.guestSessionSnapshot;
  if (snapshot?.access_token && snapshot?.refresh_token) {
    const { data, error } = await leaderboardState.client.auth.setSession({
      access_token: snapshot.access_token,
      refresh_token: snapshot.refresh_token
    });
    if (!error && data?.session?.user?.is_anonymous) {
      await applySupabaseUser(data.session.user);
      return true;
    }
    console.warn('Guest session restore failed', error);
    clearGuestSessionSnapshot();
  }

  const { data, error } = await leaderboardState.client.auth.signInAnonymously();
  if (error) {
    setSupabaseGateReady(false);
    accountStatusEl.textContent = `Anonymous sign-in failed: ${error.message}`;
    leaderboardMessageEl.textContent = 'Supabase anonymous auth must be enabled.';
    googleSignInButton.disabled = false;
    return false;
  }

  if (data?.session?.access_token && data?.session?.refresh_token) {
    saveGuestSessionSnapshot(data.session);
  }
  await applySupabaseUser(data?.user || null);
  return true;
}

async function applySupabaseUser(user) {
  const syncToken = ++leaderboardState.identitySyncToken;
  leaderboardState.user = user;
  setSupabaseGateReady(false);

  if (!user) {
    leaderboardState.playerId = '';
    leaderboardState.playerName = '';
    accountStatusEl.textContent = 'Connecting to Supabase...';
    googleSignInButton.textContent = 'Google 登入';
    googleSignInButton.disabled = false;
    return;
  }

  leaderboardState.playerId = user.id;
  leaderboardState.playerName = user.is_anonymous ? leaderboardState.guestPlayerName : getSupabaseDisplayName(user);
  if (user.is_anonymous) {
    leaderboardState.guestPlayerId = user.id;
  }
  accountStatusEl.textContent = user.is_anonymous
    ? `Loading guest: ${leaderboardState.playerName}`
    : `Loading ${leaderboardState.playerName}`;
  googleSignInButton.textContent = user.is_anonymous ? 'Google 登入' : '登出';
  googleSignInButton.disabled = true;

  try {
    resetProgressForIdentityLoad();
    if (typeof syncEncyclopediaForCurrentUser === 'function') {
      await syncEncyclopediaForCurrentUser(syncToken);
    }
    if (typeof syncPlayerProgressForCurrentUser === 'function') {
      await syncPlayerProgressForCurrentUser(syncToken);
    }
  } catch (error) {
    console.warn('Supabase progress load failed', error);
    if (syncToken === leaderboardState.identitySyncToken && leaderboardState.user?.id === user.id) {
      accountStatusEl.textContent = `Supabase load failed: ${error.message}`;
      googleSignInButton.disabled = false;
      setSupabaseGateReady(false);
    }
    return;
  }

  if (syncToken !== leaderboardState.identitySyncToken || leaderboardState.user?.id !== user.id) return;
  accountStatusEl.textContent = user.is_anonymous ? `Guest: ${leaderboardState.playerName}` : leaderboardState.playerName;
  googleSignInButton.disabled = false;
  setSupabaseGateReady(true);
}

function getSupabaseDisplayName(user) {
  const metadata = user.user_metadata || {};
  const identityData = (user.identities || [])
    .map((identity) => identity.identity_data || {})
    .find((data) => data.provider === 'google' || data.iss?.includes('accounts.google.com'))
    || {};
  const candidates = [
    metadata.name,
    metadata.full_name,
    metadata.preferred_username,
    identityData.name,
    identityData.full_name,
    identityData.preferred_username
  ];
  return candidates.find(isDisplayName) || getEmailLocalPart(user.email) || '已登入玩家';
}

function isDisplayName(value) {
  return typeof value === 'string' && value.trim() && !value.includes('@');
}

function getEmailLocalPart(email) {
  if (typeof email !== 'string' || !email.includes('@')) return '';
  return email.split('@')[0] || '';
}
function authRedirectUrl() {
  const url = new URL(window.location.href);
  url.hash = '';
  url.search = '';
  return url.toString();
}

async function signInWithGoogle() {
  if (!leaderboardState.client) return;

  googleSignInButton.disabled = true;
  leaderboardState.isAuthBusy = true;

  if (leaderboardState.user && !leaderboardState.user.is_anonymous) {
    const { error } = await leaderboardState.client.auth.signOut();
    leaderboardState.isAuthBusy = false;
    if (error) {
      googleSignInButton.disabled = false;
      leaderboardMessageEl.textContent = `登出失敗: ${error.message}`;
      return;
    }
    await restoreGuestSessionOrCreateNew();
    leaderboardMessageEl.textContent = '已登出，訪客遊戲資料已準備完成。';
    return;
  }

  leaderboardMessageEl.textContent = '正在前往 Google 登入...';
  if (leaderboardState.user?.is_anonymous) {
    try {
      await persistPlayerProgressToSupabase?.();
      const { data: guestSessionData } = await leaderboardState.client.auth.getSession();
      const guestSession = guestSessionData?.session;
      if (guestSession?.user?.is_anonymous && guestSession.access_token && guestSession.refresh_token) {
        saveGuestSessionSnapshot(guestSession);
      }
    } catch (error) {
      console.warn('Guest progress save before Google sign-in failed', error);
    }

    const { error: signOutError } = await leaderboardState.client.auth.signOut();
    if (signOutError) {
      leaderboardState.isAuthBusy = false;
      googleSignInButton.disabled = false;
      leaderboardMessageEl.textContent = `Guest sign-out failed: ${signOutError.message}`;
      return;
    }
  }

  const { error } = await leaderboardState.client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: authRedirectUrl(),
      queryParams: {
        prompt: 'select_account'
      }
    }
  });

  leaderboardState.isAuthBusy = false;
  if (error) {
    googleSignInButton.disabled = false;
    leaderboardMessageEl.textContent = `Google 登入失敗: ${error.message}`;
  }
}

async function submitLeaderboardScore() {
  if (state.scoreSaved) return leaderboardState.recentScoreRow;
  if (state.score <= 0 || state.bestCombo <= 0) return null;
  if (!leaderboardState.client || !leaderboardState.user) {
    leaderboardMessageEl.textContent = 'Supabase is not ready. Score was not submitted.';
    return null;
  }
  state.scoreSaved = true;

  const row = {
    local_id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    player_id: leaderboardState.playerId,
    player_name: leaderboardState.playerName,
    score: state.score,
    best_combo: state.bestCombo,
    best_level: state.bestLevel,
    board_type: state.itemBoardRun ? 'item' : 'classic',
    created_at: new Date().toISOString()
  };

  const { data, error } = await leaderboardState.client
    .from('vegetable_merge_scores')
    .insert({
      player_id: row.player_id,
      player_name: row.player_name,
      score: row.score,
      best_combo: row.best_combo,
      best_level: row.best_level,
      board_type: row.board_type
    })
    .select('id, player_name, score, best_combo, best_level, board_type, created_at')
    .single();

  if (!error && data) {
    Object.assign(row, data);
    Object.assign(row, normalizeLeaderboardRow(row));
    leaderboardState.localRows.push(row);
    leaderboardState.recentScoreRow = row;
    leaderboardState.recentScoreRank = await calculateScoreRank(row);
    saveLocalLeaderboard();
  }

  if (error) {
    leaderboardMessageEl.textContent = `送出失敗: ${error.message}`;
    state.scoreSaved = false;
    return null;
  }
  return row;
}

async function calculateScoreRank(row) {
  if (!row || row.score <= 0 || row.best_combo <= 0) return null;
  const boardType = normalizeLeaderboardRow(row).board_type;

  if (!leaderboardState.client) return null;

  const { count, error } = await leaderboardState.client
    .from('vegetable_merge_scores')
    .select('id', { count: 'exact', head: true })
    .eq('board_type', boardType)
    .gt('best_combo', 0)
    .gt('score', row.score);

  if (error) {
    console.warn('Leaderboard rank calculation failed', error);
    return null;
  }

  return (count || 0) + 1;
}

function isRecentScoreRow(row, recent = leaderboardState.recentScoreRow) {
  if (!row || !recent) return false;
  if (row.id && recent.id) return row.id === recent.id;
  if (row.local_id && recent.local_id) return row.local_id === recent.local_id;
  return row.player_id === recent.player_id
    && row.score === recent.score
    && row.best_combo === recent.best_combo
    && normalizeLeaderboardRow(row).board_type === normalizeLeaderboardRow(recent).board_type
    && row.best_level === recent.best_level
    && row.created_at === recent.created_at;
}

async function loadLeaderboard() {
  const boardType = currentBoardType();
  leaderboardMessageEl.textContent = '載入中...';

  if (!leaderboardState.client) {
    leaderboardMessageEl.textContent = 'Supabase is required for leaderboard.';
    leaderboardState.rows[leaderboardState.activeTab] = [];
    renderLeaderboard();
    return;
  }

  let query = leaderboardState.client
    .from('vegetable_merge_scores')
    .select('id, player_name, score, best_combo, best_level, board_type, created_at')
    .eq('board_type', boardType)
    .gt('best_combo', 0);

  const { data, error } = await query
    .order('score', { ascending: false })
    .order('best_combo', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(LEADERBOARD_LIMIT);

  if (error) {
    leaderboardMessageEl.textContent = `讀取失敗: ${error.message}`;
    leaderboardState.rows[leaderboardState.activeTab] = [];
    renderLeaderboard();
    return;
  }

  leaderboardState.rows[leaderboardState.activeTab] = (data || []).map(normalizeLeaderboardRow);
  renderLeaderboard();
}

function renderLeaderboard() {
  const rows = leaderboardState.rows[leaderboardState.activeTab];
  const boardType = currentBoardType();
  const boardLabel = boardType === 'item' ? '道具榜' : '經典榜';
  const recentMatchesBoard = leaderboardState.recentScoreRow
    && normalizeLeaderboardRow(leaderboardState.recentScoreRow).board_type === boardType;
  let recentItem = null;

  leaderboardListEl.replaceChildren();
  leaderboardPersonalInfoEl.hidden = true;
  leaderboardPersonalInfoEl.replaceChildren();

  rows.forEach((row, index) => {
    const item = document.createElement('li');
    const isRecent = isRecentScoreRow(row);
    item.className = `leaderboard-item${isRecent ? ' recent' : ''}`;
    const detailText = `${formatDate(row.created_at)}`;
    item.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="player">
        <strong>${escapeHtml(row.player_name || '訪客玩家')}</strong>
        <small>${escapeHtml(detailText)}</small>
      </span>
      <span class="metric">
        <b>${row.score || 0}<small>分</small></b>
        <em>COMBO ${row.best_combo || 0}</em>
      </span>
    `;
    if (isRecent) {
      item.querySelector('.player strong')?.insertAdjacentHTML('beforeend', '<span class="recent-label">本局</span>');
      recentItem = item;
    }
    leaderboardListEl.appendChild(item);
  });

  if (recentMatchesBoard && recentItem) {
    focusRecentLeaderboardItem(recentItem);
  }

  if (recentMatchesBoard) {
    leaderboardMessageEl.textContent = leaderboardState.recentScoreRank
      ? `本局成績列入${boardLabel}第 ${leaderboardState.recentScoreRank} 名`
      : '本局成績已送出';
    return;
  }

  if (state.gameOver && state.score <= 0) {
    leaderboardMessageEl.textContent = '本局沒有分數，未列入排行榜';
    return;
  }

  if (state.gameOver && state.bestCombo <= 0) {
    leaderboardMessageEl.textContent = '本局 COMBO 為 0，未列入排行榜';
    return;
  }

  leaderboardMessageEl.textContent = rows.length ? '' : '目前還沒有紀錄，先來打第一筆吧';
}

function focusRecentLeaderboardItem(item) {
  window.requestAnimationFrame(() => {
    item.scrollIntoView({
      block: 'center',
      inline: 'nearest',
      behavior: 'smooth'
    });
    item.classList.remove('focus-rank');
    item.offsetWidth;
    item.classList.add('focus-rank');
  });
}

function openLeaderboard(tab = leaderboardState.activeTab) {
  if (state.hasStarted && !state.gameOver) {
    setPaused(true);
  }
  leaderboardState.activeTab = tab === 'item' ? 'item' : 'classic';
  scoreTabButton.classList.toggle('active', leaderboardState.activeTab === 'classic');
  comboTabButton.classList.toggle('active', leaderboardState.activeTab === 'item');
  leaderboardScene.hidden = false;
  loadLeaderboard();
}

function closeLeaderboard() {
  leaderboardScene.hidden = true;
  if (state.gameOver && state.hasStarted && startScene.hidden) {
    returnToStartScene();
  }
}
