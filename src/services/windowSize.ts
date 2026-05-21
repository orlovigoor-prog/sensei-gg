export type WindowSizePreset = '800x600' | '1280x720' | '1600x900';

export interface WindowSizeOption {
  preset: WindowSizePreset;
  label: string;
  width: number;
  height: number;
}

export const WINDOW_SIZE_STORAGE_KEY = 'sensei_window_size';

export const WINDOW_SIZE_OPTIONS: WindowSizeOption[] = [
  { preset: '800x600', label: 'Компактный', width: 800, height: 600 },
  { preset: '1280x720', label: 'Широкий', width: 1280, height: 720 },
  { preset: '1600x900', label: 'Большой', width: 1600, height: 900 }
];

export const DEFAULT_WINDOW_SIZE_PRESET: WindowSizePreset = '1280x720';

export const getWindowSizeOption = (preset: WindowSizePreset): WindowSizeOption => {
  return WINDOW_SIZE_OPTIONS.find((option) => option.preset === preset) || WINDOW_SIZE_OPTIONS[1];
};

export const getStoredWindowSizePreset = (): WindowSizePreset => {
  const storedPreset = localStorage.getItem(WINDOW_SIZE_STORAGE_KEY);

  if (storedPreset === '800x600' || storedPreset === '1280x720' || storedPreset === '1600x900') {
    return storedPreset;
  }

  return DEFAULT_WINDOW_SIZE_PRESET;
};

export const applyWindowSizePreset = (preset: WindowSizePreset) => {
  const { width, height } = getWindowSizeOption(preset);

  if (typeof overwolf === 'undefined') {
    return;
  }

  overwolf.windows.getCurrentWindow((result) => {
    if (!result.success || !result.window?.id) {
      return;
    }

    overwolf.windows.changeSize(
      {
        window_id: result.window.id,
        width,
        height
      },
      () => undefined
    );
  });
};
