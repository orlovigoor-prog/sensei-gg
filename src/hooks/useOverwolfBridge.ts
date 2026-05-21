import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { endGame, mutateStats, setAiAdvice, startGame } from '../store/gameSlice';
import { syncLobbyLifecycle } from '../store/lobbySlice';
import { subscribeToBridgeMessages } from '../services/overwolfBridge';

export const useOverwolfBridge = (onGameStart?: () => void) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const unsubscribe = subscribeToBridgeMessages((message) => {
      switch (message.type) {
        case 'lifecycle':
          dispatch(syncLobbyLifecycle(message.payload));
          break;
        case 'game-start':
          dispatch(startGame(message.payload.championName));
          onGameStart?.();
          break;
        case 'stats':
          dispatch(mutateStats(message.payload));
          break;
        case 'game-end':
          dispatch(endGame());
          dispatch(syncLobbyLifecycle({ phase: 'post-game', isInLobby: false }));
          break;
        case 'status':
          dispatch(setAiAdvice(message.payload.text));
          break;
      }
    });

    return unsubscribe;
  }, [dispatch, onGameStart]);
};
