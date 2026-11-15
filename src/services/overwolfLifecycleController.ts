/// <reference types="@overwolf/types" />

import {
  LOL_GAME_ID,
  REQUIRED_FEATURES,
  normalizeGameMode,
  normalizeLobbyPhase,
  readNestedNumber,
  readNestedString,
  readNumericStat,
  restoreDesktopWindow,
  sendBridgeMessage,
  toggleDesktopWindow
} from './overwolfBridge';
import { extractLiveClientScoreboardSnapshot, normalizeLiveClientRoster, normalizeLiveClientScoreboard } from './overwolfScoreboard';
import type { CompletedMatchScoreboard, LiveRoster } from '../store/lobbySlice';
import type { LobbyPhase } from '../store/lobbySlice';

interface OverwolfMatchInfo {
  kills?: unknown;
  deaths?: unknown;
  assists?: unknown;
  minions_killed?: unknown;
  game_mode?: unknown;
  phase?: unknown;
}

interface OverwolfInfoPayload {
  me?: {
    champion?: unknown;
  };
  match_info?: OverwolfMatchInfo;
  live_client_data?: unknown;
  phase?: unknown;
}

interface OverwolfInfoUpdatesEvent {
  info?: OverwolfInfoPayload;
}

interface OverwolfGameEventsPayload {
  events?: Array<{
    name?: string;
  }>;
}

interface OverwolfRunningGameInfo {
  id?: number;
  isRunning?: boolean;
}

interface OverwolfGameInfoUpdatedEvent {
  runningChanged?: boolean;
  gameInfo?: OverwolfRunningGameInfo | null;
}

export const registerOverwolfLifecycleController = () => {
  if (typeof overwolf === 'undefined') {
    return () => undefined;
  }

  restoreDesktopWindow();

  let currentKills = 0;
  let currentDeaths = 0;
  let currentAssists = 0;
  let currentCs = 0;
  let currentGameTimeSeconds = 0;
  let currentChampionName = '';
  let currentPhase: LobbyPhase = 'champ-select';
  let sawRunningGame = false;
  let latestActivePlayer: unknown = null;
  let latestAllPlayers: unknown = null;
  let latestCompletedScoreboard: CompletedMatchScoreboard | null = null;
  let latestLiveRosterKey: string | null = null;
  let latestFeatureStatusKey: string | null = null;

  const resetCompletedScoreboardCapture = () => {
      latestActivePlayer = null;
      latestAllPlayers = null;
      latestCompletedScoreboard = null;
      latestLiveRosterKey = null;
      sendBridgeMessage({ type: 'clear-live-roster' });
  };

  const sendLatestCompletedScoreboard = () => {
    if (latestCompletedScoreboard) {
      sendBridgeMessage({ type: 'completed-scoreboard', payload: latestCompletedScoreboard });
    }
  };

  const sendLiveRosterIfChanged = (roster: LiveRoster | null) => {
    if (!roster) {
      return;
    }

    const rosterKey = JSON.stringify({
      localSummonerName: roster.localSummonerName,
      allies: roster.allies.map((player) => [player.summonerName, player.championName, player.mainRole]),
      enemies: roster.enemies.map((player) => [player.summonerName, player.championName, player.mainRole])
    });

    if (rosterKey !== latestLiveRosterKey) {
      latestLiveRosterKey = rosterKey;
      sendBridgeMessage({ type: 'live-roster', payload: roster });
    }
  };

  const emitLifecycle = (phase: LobbyPhase, options?: { gameMode?: string; isInLobby?: boolean }) => {
    currentPhase = phase;
    sendBridgeMessage({
      type: 'lifecycle',
      payload: {
        phase,
        isInLobby: options?.isInLobby ?? phase !== 'post-game',
        gameMode: normalizeGameMode(options?.gameMode)
      }
    });
  };

  const setGameFeatures = () => {
    overwolf.games.events.setRequiredFeatures([...REQUIRED_FEATURES], (info) => {
      const supportedFeatures = info.supportedFeatures ?? [];
      const missingFeatures = REQUIRED_FEATURES.filter((feature) => !supportedFeatures.includes(feature));
      const statusKey = info.success && missingFeatures.length === 0
        ? 'ready'
        : `${info.error ?? 'unsupported'}:${missingFeatures.join(',')}`;

      if (statusKey === latestFeatureStatusKey) {
        return;
      }

      latestFeatureStatusKey = statusKey;

      if (!info.success) {
        sendBridgeMessage({
          type: 'status',
          payload: { text: 'Часть данных Overwolf недоступна. Sensei GG не будет показывать неполные данные состава.' }
        });
        return;
      }

      if (missingFeatures.length > 0) {
        sendBridgeMessage({
          type: 'status',
          payload: { text: 'Overwolf подтвердил не все источники данных. Неподтверждённые данные состава не будут показаны.' }
        });
      }
    });
  };

  const onHotkeyPressed = (event: { name?: string }) => {
    if (event.name === 'sensei_toggle_overlay') {
      toggleDesktopWindow();
    }
  };

  const onInfoUpdates = (data: OverwolfInfoUpdatesEvent) => {
    if (!data.info) {
      return;
    }

    const { info } = data;
    const gameMode = normalizeGameMode(
      info.match_info?.game_mode ?? readNestedString(info.live_client_data, ['game_data', 'gameMode'])
    );
    const derivedPhase = normalizeLobbyPhase(
      info.phase ?? info.match_info?.phase ?? readNestedString(info.live_client_data, ['game_data', 'gamePhase'])
    );

    if (
      (derivedPhase === 'loading' || derivedPhase === 'in-game')
      && currentPhase !== 'loading'
      && currentPhase !== 'in-game'
    ) {
      resetCompletedScoreboardCapture();
    }

    const liveClientSnapshot = extractLiveClientScoreboardSnapshot(info.live_client_data);
    if (liveClientSnapshot.activePlayer !== undefined) {
      latestActivePlayer = liveClientSnapshot.activePlayer;
    }
    if (liveClientSnapshot.allPlayers !== undefined) {
      latestAllPlayers = liveClientSnapshot.allPlayers;
    }
    if (latestActivePlayer && latestAllPlayers) {
      latestCompletedScoreboard = normalizeLiveClientScoreboard({
        activePlayer: latestActivePlayer,
        allPlayers: latestAllPlayers
      }) ?? latestCompletedScoreboard;
    }
    if (derivedPhase && derivedPhase !== currentPhase) {
      if (derivedPhase === 'post-game') {
        sendLatestCompletedScoreboard();
      }
      emitLifecycle(derivedPhase, { gameMode });
    }

    if (derivedPhase === 'loading' || derivedPhase === 'in-game' || currentPhase === 'in-game') {
      sendLiveRosterIfChanged(normalizeLiveClientRoster({
        activePlayer: latestActivePlayer,
        allPlayers: latestAllPlayers
      }));
    }

    if (derivedPhase === 'post-game' || currentPhase === 'post-game') {
      return;
    }

    if (typeof info.me?.champion === 'string' && info.me.champion && info.me.champion !== currentChampionName) {
      currentChampionName = info.me.champion;
      emitLifecycle('in-game', { gameMode });
      sendBridgeMessage({
        type: 'game-start',
        payload: {
          championName: info.me.champion
        }
      });
      sendBridgeMessage({
        type: 'status',
        payload: {
          text: `Вы играете на ${info.me.champion}. Sensei GG анализирует матч.`
        }
      });
    }

    if (!info.match_info) {
      return;
    }

    const matchData = info.match_info;
    let statsChanged = false;

    const nextKills = readNumericStat(matchData.kills);
    const nextDeaths = readNumericStat(matchData.deaths);
    const nextAssists = readNumericStat(matchData.assists);
    const nextCs = readNumericStat(matchData.minions_killed);
    const nextGameTimeSeconds = readNestedNumber(info.live_client_data, ['game_data', 'gameTime']);

    if (nextKills !== undefined) {
      currentKills = nextKills;
      statsChanged = true;
    }
    if (nextDeaths !== undefined) {
      currentDeaths = nextDeaths;
      statsChanged = true;
    }
    if (nextAssists !== undefined) {
      currentAssists = nextAssists;
      statsChanged = true;
    }
    if (nextCs !== undefined) {
      currentCs = nextCs;
      statsChanged = true;
    }
    if (nextGameTimeSeconds !== undefined) {
      currentGameTimeSeconds = nextGameTimeSeconds;
      statsChanged = true;
    }

    if (!statsChanged) {
      return;
    }

    if (currentPhase !== 'in-game') {
      emitLifecycle('in-game', { gameMode });
    }

    sendBridgeMessage({
      type: 'stats',
      payload: {
        kills: currentKills,
        deaths: currentDeaths,
        assists: currentAssists,
        cs: currentCs,
        gameTimeSeconds: currentGameTimeSeconds
      }
    });
  };

  const onGameEvents = (data: OverwolfGameEventsPayload) => {
    if (!data.events) {
      return;
    }

    data.events.forEach((event) => {
      if (event.name) {
        console.log('Триггер:', event.name);
      }
    });
  };

  overwolf.games.getRunningGameInfo((res) => {
    if (res && res.id === LOL_GAME_ID) {
      sawRunningGame = true;
      setGameFeatures();
      emitLifecycle('loading');
    }
  });

  const onGameInfoUpdated = (res: OverwolfGameInfoUpdatedEvent) => {
    if (!res.runningChanged || !res.gameInfo) {
      return;
    }

    if (res.gameInfo.id === LOL_GAME_ID && res.gameInfo.isRunning) {
      sawRunningGame = true;
      setGameFeatures();
      resetCompletedScoreboardCapture();
      if (currentPhase !== 'in-game') {
        emitLifecycle('loading');
      }
      return;
    }

    if (res.gameInfo.id === LOL_GAME_ID && !res.gameInfo.isRunning && sawRunningGame) {
      sendLatestCompletedScoreboard();
      emitLifecycle('post-game', { isInLobby: false });
      sendBridgeMessage({ type: 'game-end' });
      currentChampionName = '';
      currentKills = 0;
      currentDeaths = 0;
      currentAssists = 0;
      currentCs = 0;
      currentGameTimeSeconds = 0;
      resetCompletedScoreboardCapture();
      sawRunningGame = false;
    }
  };

  overwolf.games.onGameInfoUpdated.addListener(onGameInfoUpdated);
  overwolf.games.events.onNewEvents.addListener(onGameEvents);
  overwolf.games.events.onInfoUpdates2.addListener(onInfoUpdates);
  overwolf.settings.hotkeys.onPressed.addListener(onHotkeyPressed);

  return () => {
    overwolf.games.onGameInfoUpdated.removeListener(onGameInfoUpdated);
    overwolf.games.events.onNewEvents.removeListener(onGameEvents);
    overwolf.games.events.onInfoUpdates2.removeListener(onInfoUpdates);
    overwolf.settings.hotkeys.onPressed.removeListener(onHotkeyPressed);
  };
};
