/// <reference types="@overwolf/types" />
import { useEffect } from 'react';
import { registerOverwolfLifecycleController } from '../../services/overwolfLifecycleController';

export function BackgroundWindow() {
  useEffect(() => {
    return registerOverwolfLifecycleController();
  }, []);

  return null;
}
