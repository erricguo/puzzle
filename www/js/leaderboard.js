const LEADERBOARD_LIMIT = 1000;

function saveLocalLeaderboard() {
  const sorted = [...leaderboardState.localRows]
    .sort((a, b) => b.score - a.score || b.best_combo - a.best_combo || a.created_at.localeCompare(b.created_at))
    .slice(0, LEADERBOARD_LIMIT);
  leaderboardState.localRows = sorted;
  localStorage.setItem('veggieMergeLocalLeaderboard', JSON.stringify(sorted));
}

function setupSupabase() {
  const config = window.SUPABASE_CONFIG || {};
  const canCreateClient = Boolean(window.supabase?.createClient);
  leaderboardState.isConfigured = Boolean(config.url && config.anonKey && canCreateClient);

  if (!leaderboardState.isConfigured) {
    accountStatusEl.textContent = 'Supabase 尚未設定，排行榜暫用本機資料';
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
  accountStatusEl.textContent = `訪客: ${leaderboardState.playerName}`;
  googleSignInButton.disabled = true;

  leaderboardState.authSubscription = leaderboardState.client.auth.onAuthStateChange((_event, session) => {
    applySupabaseUser(session?.user || null);
    if (leaderboardScene && !leaderboardScene.hidden) {
      loadLeaderboard();
    }
  }).data?.subscription;

  syncSupabaseUser();
}

async function syncSupabaseUser() {
  if (!leaderboardState.client) return;

  const { data, error } = await leaderboardState.client.auth.getUser();
  if (error) {
    applySupabaseUser(null);
    leaderboardMessageEl.textContent = `登入狀態讀取失敗: ${error.message}`;
    return;
  }

  applySupabaseUser(data?.user || null);
}

function applySupabaseUser(user) {
  leaderboardState.user = user;

  if (!user) {
    leaderboardState.playerId = leaderboardState.guestPlayerId;
    leaderboardState.playerName = leaderboardState.guestPlayerName;
    localStorage.setItem('veggieMergePlayerId', leaderboardState.playerId);
    localStorage.setItem('veggieMergePlayerName', leaderboardState.playerName);
    accountStatusEl.textContent = `訪客: ${leaderboardState.playerName}`;
    googleSignInButton.textContent = 'Google 登入';
    googleSignInButton.disabled = false;
    if (typeof syncEncyclopediaForCurrentUser === 'function') {
      syncEncyclopediaForCurrentUser();
    }
    return;
  }

  leaderboardState.playerId = user.id;
  leaderboardState.playerName = getSupabaseDisplayName(user);
  localStorage.setItem('veggieMergePlayerId', leaderboardState.playerId);
  localStorage.setItem('veggieMergePlayerName', leaderboardState.playerName);
  accountStatusEl.textContent = leaderboardState.playerName;
  googleSignInButton.textContent = '登出';
  googleSignInButton.disabled = false;
  if (typeof syncEncyclopediaForCurrentUser === 'function') {
    syncEncyclopediaForCurrentUser();
  }
}

function getSupabaseDisplayName(user) {
  return user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.user_metadata?.preferred_username
    || user.email
    || '登入玩家';
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

  if (leaderboardState.user) {
    const { error } = await leaderboardState.client.auth.signOut();
    leaderboardState.isAuthBusy = false;
    if (error) {
      googleSignInButton.disabled = false;
      leaderboardMessageEl.textContent = `登出失敗: ${error.message}`;
      return;
    }
    applySupabaseUser(null);
    leaderboardMessageEl.textContent = '已登出 Google 帳號';
    return;
  }

  leaderboardMessageEl.textContent = '正在前往 Google 登入...';
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
  if (state.score <= 0) return null;
  state.scoreSaved = true;

  const row = {
    local_id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    player_id: leaderboardState.playerId,
    player_name: leaderboardState.playerName,
    score: state.score,
    best_combo: state.bestCombo,
    best_level: state.bestLevel,
    created_at: new Date().toISOString()
  };

  leaderboardState.localRows.push(row);
  saveLocalLeaderboard();
  leaderboardState.recentScoreRow = row;
  leaderboardState.recentScoreRank = await calculateScoreRank(row);

  if (!leaderboardState.client) return row;

  const { data, error } = await leaderboardState.client
    .from('vegetable_merge_scores')
    .insert({
      player_id: row.player_id,
      player_name: row.player_name,
      score: row.score,
      best_combo: row.best_combo,
      best_level: row.best_level
    })
    .select('id, player_name, score, best_combo, best_level, created_at')
    .single();

  if (!error && data) {
    Object.assign(row, data);
    leaderboardState.recentScoreRow = row;
    leaderboardState.recentScoreRank = await calculateScoreRank(row);
  }

  if (error) {
    leaderboardMessageEl.textContent = `送出失敗，已保存在本機: ${error.message}`;
  }
  return row;
}

async function calculateScoreRank(row) {
  if (!row || row.score <= 0) return null;

  if (!leaderboardState.client) {
    const sorted = [...leaderboardState.localRows]
      .sort((a, b) => b.score - a.score || b.best_combo - a.best_combo || a.created_at.localeCompare(b.created_at));
    const index = sorted.findIndex((item) => isRecentScoreRow(item, row));
    return index >= 0 ? index + 1 : null;
  }

  const { count, error } = await leaderboardState.client
    .from('vegetable_merge_scores')
    .select('id', { count: 'exact', head: true })
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
    && row.best_level === recent.best_level
    && row.created_at === recent.created_at;
}

async function loadLeaderboard() {
  const sortColumn = leaderboardState.activeTab === 'score' ? 'score' : 'best_combo';
  leaderboardMessageEl.textContent = '載入中...';

  if (!leaderboardState.client) {
    const rows = [...leaderboardState.localRows]
      .sort((a, b) => b[sortColumn] - a[sortColumn] || b.score - a.score)
      .slice(0, LEADERBOARD_LIMIT);
    leaderboardState.rows[leaderboardState.activeTab] = rows;
    renderLeaderboard();
    return;
  }

  const { data, error } = await leaderboardState.client
    .from('vegetable_merge_scores')
    .select('id, player_name, score, best_combo, best_level, created_at')
    .order(sortColumn, { ascending: false })
    .order('score', { ascending: false })
    .limit(LEADERBOARD_LIMIT);

  if (error) {
    leaderboardMessageEl.textContent = `讀取失敗: ${error.message}`;
    leaderboardState.rows[leaderboardState.activeTab] = [];
    renderLeaderboard();
    return;
  }

  leaderboardState.rows[leaderboardState.activeTab] = data || [];
  renderLeaderboard();
}

function renderLeaderboardLegacy() {
  const rows = leaderboardState.rows[leaderboardState.activeTab];
  const metricKey = leaderboardState.activeTab === 'score' ? 'score' : 'best_combo';
  const metricLabel = leaderboardState.activeTab === 'score' ? '分' : 'COMBO';

  leaderboardListEl.replaceChildren();

  rows.forEach((row, index) => {
    const item = document.createElement('li');
    const isRecent = isRecentScoreRow(row);
    item.className = `leaderboard-item${isRecent ? ' recent' : ''}`;
    const detailText = leaderboardState.activeTab === 'combo'
      ? `最高 Combo ${row.best_combo || 0} · ${formatDate(row.created_at)}`
      : `最高層 ${row.best_level || 1} · ${formatDate(row.created_at)}`;
    item.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="player">
        <strong>${escapeHtml(row.player_name || '匿名玩家')}</strong>
        <small>${escapeHtml(detailText)}</small>
      </span>
      <span class="metric">${row[metricKey] || 0}<small>${metricLabel}</small></span>
    `;
    if (isRecent) {
      item.querySelector('.player strong')?.insertAdjacentHTML('beforeend', '<span class="recent-label">本局</span>');
    }
    leaderboardListEl.appendChild(item);
  });

  leaderboardMessageEl.textContent = rows.length ? '' : '目前還沒有紀錄，先來打第一筆吧';
}

function renderLeaderboard() {
  const rows = leaderboardState.rows[leaderboardState.activeTab];
  const metricKey = leaderboardState.activeTab === 'score' ? 'score' : 'best_combo';
  const metricLabel = leaderboardState.activeTab === 'score' ? '分' : 'COMBO';

  leaderboardListEl.replaceChildren();

  rows.forEach((row, index) => {
    const item = document.createElement('li');
    const isRecent = isRecentScoreRow(row);
    item.className = `leaderboard-item${isRecent ? ' recent' : ''}`;
    const detailText = leaderboardState.activeTab === 'combo'
      ? `最高 Combo ${row.best_combo || 0} · ${formatDate(row.created_at)}`
      : `最高蔬菜 ${row.best_level || 1} · ${formatDate(row.created_at)}`;
    item.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="player">
        <strong>${escapeHtml(row.player_name || '訪客玩家')}</strong>
        <small>${escapeHtml(detailText)}</small>
      </span>
      <span class="metric">${row[metricKey] || 0}<small>${metricLabel}</small></span>
    `;
    if (isRecent) {
      item.querySelector('.player strong')?.insertAdjacentHTML('beforeend', '<span class="recent-label">本局</span>');
    }
    leaderboardListEl.appendChild(item);
  });

  if (leaderboardState.recentScoreRow && leaderboardState.activeTab === 'score') {
    leaderboardMessageEl.textContent = leaderboardState.recentScoreRank
      ? `本局成績第 ${leaderboardState.recentScoreRank} 名`
      : '本局成績已送出';
    return;
  }

  if (state.gameOver && state.score <= 0 && leaderboardState.activeTab === 'score') {
    leaderboardMessageEl.textContent = '本局沒有分數，未列入排行榜';
    return;
  }

  leaderboardMessageEl.textContent = rows.length ? '' : '目前還沒有紀錄，先來打第一筆吧';
}

function openLeaderboard(tab = leaderboardState.activeTab) {
  if (state.hasStarted && !state.gameOver) {
    setPaused(true);
  }
  leaderboardState.activeTab = tab;
  scoreTabButton.classList.toggle('active', tab === 'score');
  comboTabButton.classList.toggle('active', tab === 'combo');
  leaderboardScene.hidden = false;
  loadLeaderboard();
}

function closeLeaderboard() {
  leaderboardScene.hidden = true;
  if (state.gameOver && state.hasStarted && startScene.hidden) {
    gameOverPanel.hidden = false;
  }
}
