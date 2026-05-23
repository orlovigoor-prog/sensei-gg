/// <reference types="@overwolf/types" />

import type { GameMode, LobbyPhase } from '../store/lobbySlice';

export const LOL_GAME_ID = 5426;
export const OVERWOLF_BRIDGE_MESSAGE_ID = 'sensei-overwolf-bridge';
export const OVERWOLF_BRIDGE_CUSTOM_EVENT = 'sensei-overwolf-bridge';
export const REQUIRED_FEATURES = ['live_client_data', 'match_info', 'me', 'death', 'kill'] as const;

export type OverwolfBridgeMessage =
  | {
      type: 'lifecycle';
      payload: {
        phase: LobbyPhase;
        isInLobby?: boolean;
        gameMode?: GameMode;
        partyMembers?: string[];
      };
    }
  | {
      type: 'game-start';
      payload: {
        championName: string;
      };
    }
  | {
      type: 'stats';
      payload: {
        kills: number;
        deaths: number;
        assists: number;
        cs: number;
        gameTimeSeconds?: number;
      };
    }
  | {
      type: 'game-end';
    }
  | {
      type: 'status';
      payload: {
        text: string;
      };
    };

type BridgeCallback = (message: OverwolfBridgeMessage) => void;

type CustomBridgeEvent = CustomEvent<OverwolfBridgeMessage>;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
};

export const isOverwolfAvailable = () => typeof overwolf !== 'undefined';

export const normalizeGameMode = (value: unknown): GameMode | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const upper = value.toUpperCase();
  const supportedModes: GameMode[] = ['RANKED_FLEX_SR', 'RANKED_SOLO_5x5', 'NORMAL_5x5_BLIND', 'NORMAL_5x5_DRAFT', 'ARAM'];

  return supportedModes.find((mode) => mode === upper);
};

export const normalizeLobbyPhase = (value: unknown): LobbyPhase | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.includes('champ') || normalized.includes('draft') || normalized.includes('ban')) {
    return 'champ-select';
  }

  if (normalized.includes('load')) {
    return 'loading';
  }

  if (normalized.includes('post') || normalized.includes('end')) {
    return 'post-game';
  }

  if (normalized.includes('game') || normalized.includes('live') || normalized.includes('ingame')) {
    return 'in-game';
  }

  return undefined;
};

export const readNestedString = (root: unknown, path: string[]): string | undefined => {
  let current: unknown = root;

  for (const key of path) {
    const record = asRecord(current);
    if (!record) {
      return undefined;
    }

    current = record[key];
  }

  return typeof current === 'string' ? current : undefined;
};

export const readNumericStat = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

export const readNestedNumber = (root: unknown, path: string[]): number | undefined => {
  let current: unknown = root;

  for (const key of path) {
    const record = asRecord(current);
    if (!record) {
      return undefined;
    }

    current = record[key];
  }

  return readNumericStat(current);
};

export const restoreDesktopWindow = () => {
  if (!isOverwolfAvailable()) {
    return;
  }

  overwolf.windows.obtainDeclaredWindow('desktop', (result) => {
    if (result.success) {
      overwolf.windows.restore(result.window.id);
    }
  });
};

export const sendBridgeMessage = (message: OverwolfBridgeMessage) => {
  if (!isOverwolfAvailable()) {
    window.dispatchEvent(new CustomEvent<OverwolfBridgeMessage>(OVERWOLF_BRIDGE_CUSTOM_EVENT, { detail: message }));
    return;
  }

  overwolf.windows.sendMessage('desktop', OVERWOLF_BRIDGE_MESSAGE_ID, message, () => undefined);
};

const isBridgeMessage = (value: unknown): value is OverwolfBridgeMessage => {
  const record = asRecord(value);
  return !!record && typeof record.type === 'string';
};

export const subscribeToBridgeMessages = (callback: BridgeCallback) => {
  const handleBrowserMessage = (event: Event) => {
    const customEvent = event as CustomBridgeEvent;
    callback(customEvent.detail);
  };

  window.addEventListener(OVERWOLF_BRIDGE_CUSTOM_EVENT, handleBrowserMessage);

  if (!isOverwolfAvailable()) {
    return () => {
      window.removeEventListener(OVERWOLF_BRIDGE_CUSTOM_EVENT, handleBrowserMessage);
    };
  }

  const handleOverwolfMessage = (event: overwolf.windows.MessageReceivedEvent) => {
    if (event.id !== OVERWOLF_BRIDGE_MESSAGE_ID || !isBridgeMessage(event.content)) {
      return;
    }

    callback(event.content);
  };

  overwolf.windows.onMessageReceived.addListener(handleOverwolfMessage);

  return () => {
    window.removeEventListener(OVERWOLF_BRIDGE_CUSTOM_EVENT, handleBrowserMessage);
    overwolf.windows.onMessageReceived.removeListener(handleOverwolfMessage);
  };
};
