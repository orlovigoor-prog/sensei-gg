/// <reference types="@overwolf/types" />
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { startGame, mutateStats, endGame, setAiAdvice } from '../../store/gameSlice';

const LoL_GAME_ID = 5426; 

export function BackgroundWindow() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof overwolf === 'undefined') return;

    // Принудительно открываем видимое окно дашборда при старте
    overwolf.windows.obtainDeclaredWindow('desktop', (result: any) => {
      if (result.success) {
        overwolf.windows.restore(result.window.id);
      }
    });

    let currentKills = 0;
    let currentDeaths = 0;
    let currentAssists = 0;
    let currentCs = 0;

    const setGameFeatures = () => {
      const features = ['live_client_data', 'match_info', 'me', 'death', 'kill'];
      overwolf.games.events.setRequiredFeatures(features, (info: any) => {
        console.log("Статус фич:", JSON.stringify(info));
      });
    };

    const onInfoUpdates = (data: any) => {
      if (!data || !data.info) return;
      const info = data.info;

      if (info.me && info.me.champion) {
        dispatch(startGame(info.me.champion));
        dispatch(setAiAdvice(`Вы играете на ${info.me.champion}. Сэнсэй анализирует матч.`));
      }

      if (info.match_info) {
        const matchData = info.match_info;
        let statsChanged = false;

        if (matchData.kills !== undefined) {
          currentKills = parseInt(matchData.kills, 10);
          statsChanged = true;
        }
        if (matchData.deaths !== undefined) {
          currentDeaths = parseInt(matchData.deaths, 10);
          statsChanged = true;
        }
        if (matchData.assists !== undefined) {
          currentAssists = parseInt(matchData.assists, 10);
          statsChanged = true;
        }
        if (matchData.minions_killed !== undefined) {
          currentCs = parseInt(matchData.minions_killed, 10);
          statsChanged = true;
        }

        if (statsChanged) {
          dispatch(mutateStats({
            kills: currentKills,
            deaths: currentDeaths,
            assists: currentAssists,
            cs: currentCs
          }));
        }
      }
    };

    const onGameEvents = (data: any) => {
      if (!data || !data.events) return;
      data.events.forEach((event: any) => {
        console.log("Триггер:", event.name);
      });
    };

    overwolf.games.getRunningGameInfo((res: any) => {
      if (res && res.id === LoL_GAME_ID) setGameFeatures();
    });

    const onGameInfoUpdated = (res: any) => {
      if (res?.runningChanged && res.gameInfo) {
        if (res.gameInfo.id === LoL_GAME_ID && res.gameInfo.isRunning) {
          setGameFeatures();
        } else if (res.gameInfo.id === LoL_GAME_ID && !res.gameInfo.isRunning) {
          dispatch(endGame());
        }
      }
    };

    overwolf.games.onGameInfoUpdated.addListener(onGameInfoUpdated);
    overwolf.games.events.onNewEvents.addListener(onGameEvents);
    overwolf.games.events.onInfoUpdates2.addListener(onInfoUpdates);

    return () => {
      overwolf.games.onGameInfoUpdated.removeListener(onGameInfoUpdated);
      overwolf.games.events.onNewEvents.removeListener(onGameEvents);
      overwolf.games.events.onInfoUpdates2.removeListener(onInfoUpdates);
    };
  }, [dispatch]);

  return null;
}
