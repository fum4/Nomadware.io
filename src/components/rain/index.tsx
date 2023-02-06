import {
  component$,
  useSignal,
  useStore,
  useClientEffect$,
  useOnWindow,
  $
} from '@builder.io/qwik';
import { Breakpoints } from '~/constants';

interface RainCoordinates {
  w: number; // TODO: ??
  x: number;
  y: number;
  z: number;
}

interface State {
  rainCoordinates: RainCoordinates[];
  lightningTimer: number;
  lightningAlpha: number;
  rainSpeed: number;
  msTimer: number;
  width : number;
  isRaining: boolean;
  rainProgress: number;
}

export default component$(() => {
  const canvasRef = useSignal<HTMLCanvasElement>();

  const store = useStore<State>({
    rainCoordinates: [] as RainCoordinates[],
    lightningTimer: 10000,
    lightningAlpha: 0,
    rainSpeed: 2,
    msTimer: 0,
    width: 0,
    isRaining: false,
    rainProgress: 0,
  });

  const drawSidewalk = $(() => {
    const ctx = canvasRef.value?.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#2c3c4a';
      ctx.fillRect(0, 500, store.width, 5);

      let gradient = ctx.createRadialGradient(store.width / 2, 500, 0, store.width / 2, 500, 150);

      gradient.addColorStop(0.0, 'rgba(18,10,35, .0)');
      gradient.addColorStop(0.2, 'rgba(18,10,35, 0.1)');
      gradient.addColorStop(0.6, 'rgba(18,10,35, 0.2)');
      gradient.addColorStop(0.8, 'rgba(18,10,35, 0.6)');
      gradient.addColorStop(1, 'rgba(18,15,35, .8)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 500, store.width, 10);

      ctx.fillStyle = '#2c3c4a';
      ctx.fillRect(0, 505, store.width, 10);

      gradient = ctx.createRadialGradient(store.width / 2, 500, 0, store.width / 2, 500, 150);

      gradient.addColorStop(0.0, 'rgba(7,8,17, 0.7)');
      gradient.addColorStop(0.2, 'rgba(7,8,17, 0.8)');
      gradient.addColorStop(0.4, 'rgba(7,8,17, 0.85)');
      gradient.addColorStop(1, 'rgba(7,5,17, .9)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 505, store.width, 10);
    }
  });

  const drawLamp = $(() => {
    const ctx = canvasRef.value?.getContext('2d');

    if (ctx) {
      const gradient = ctx.createLinearGradient(store.width / 2, 210, store.width / 2, 500);

      gradient.addColorStop(0.000, 'rgba(30, 30, 60, 1.000)');
      gradient.addColorStop(0.2, 'rgba(50, 50, 80, 1.000)');
      gradient.addColorStop(1, 'rgba(15, 15, 45, 1.000)');

      ctx.fillStyle = gradient;
      ctx.fillRect(store.width / 2, 210, 6, 290);

      const gradientOuterHigh = ctx.createLinearGradient(store.width / 2, 210, store.width / 2, 500);

      gradientOuterHigh.addColorStop(0.000, 'rgba(35, 35, 75, 1.000)');
      gradientOuterHigh.addColorStop(0.2, 'rgba(65, 65, 105, 1.000)');
      gradientOuterHigh.addColorStop(1, 'rgba(17, 22, 57, 1.000)');

      ctx.fillStyle = gradientOuterHigh;
      ctx.fillRect(store.width / 2 - 1, 210, 1, 290);

      const gradientOuterLow = ctx.createLinearGradient(store.width / 2, 210, store.width / 2, 500);

      gradientOuterLow.addColorStop(0.000, 'rgba(35, 35, 65, 1.000)');
      gradientOuterLow.addColorStop(0.2, 'rgba(50, 50, 80, 1.000)');
      gradientOuterLow.addColorStop(1, 'rgba(33, 33, 63, 1.000)');

      ctx.fillStyle = gradientOuterLow;
      ctx.fillRect(store.width / 2 + 6, 210, 1, 290);

      // Modify glow based on passed time
      const sinGlowMod = 5 * Math.sin(store.msTimer / 200);
      const cosGlowMod = 5 * Math.cos((store.msTimer + 0.5 * sinGlowMod) / 200);
      const gradientGlow = ctx.createRadialGradient(store.width / 2 + 3, 200, 0, store.width / 2 + sinGlowMod, 400, 206 + cosGlowMod);

      gradientGlow.addColorStop(0.000, 'rgba(140, 180, 160, 1)');
      gradientGlow.addColorStop(0.2, 'rgba(100, 180, 160, 0.4)');
      gradientGlow.addColorStop(0.4, 'rgba(60, 180, 160, 0.2)');
      gradientGlow.addColorStop(1, 'rgba(60, 140, 160, 0)');

      ctx.fillStyle = gradientGlow;
      ctx.fillRect(store.width / 2 - 220, 0, 500, 500);
    }
  });

  const drawLightning = $(() => {
    const ctx = canvasRef.value?.getContext('2d');

    if (ctx) {
      store.lightningAlpha = 0;

      if (store.lightningTimer > 350) {
        store.lightningAlpha = (500.0 - store.lightningTimer) * 0.004;
      } else if (store.lightningTimer < 350 && store.lightningTimer > 250) {
        store.lightningAlpha = (store.lightningTimer - 250.0) * 0.006;
      } else if (store.lightningTimer < 250 && store.lightningTimer >= 100) {
        store.lightningAlpha = (250 - store.lightningTimer) * 0.004;
      } else if (store.lightningTimer < 100 && store.lightningTimer >= 0.0) {
        store.lightningAlpha = store.lightningTimer * 0.006;
      }

      if (store.lightningAlpha > 0) {
        ctx.fillStyle = `rgba(250, 250, 245, ${store.lightningAlpha})`;
        ctx.fillRect(0, 0, store.width, 500);
      }
    }
  });

  const drawRain = $(() => {
    const ctx = canvasRef.value?.getContext('2d');

    if (ctx) {
      for (let i = 0; i < store.rainProgress; i++) {
        if (store.rainCoordinates[i]) {
          if (store.rainCoordinates[i].y >= 482) {
            store.rainCoordinates[i].y -= 500;
          }

          if (store.rainCoordinates[i].x < -10) {
            store.rainCoordinates[i].x += store.width;
          } else {
            store.rainCoordinates[i].y += store.rainCoordinates[i].w * store.rainSpeed;
            store.rainCoordinates[i].x -= 5 + Math.floor(store.rainCoordinates[i].y / 250);
          }

          const gradient = ctx.createRadialGradient(store.width / 2, 450, 140, store.width / 2, 300, 600);

          gradient.addColorStop(0.000, 'rgba(100, 170, 160, 0.25)');
          gradient.addColorStop(0.1, 'rgba(100, 160, 160, 0.17)');
          gradient.addColorStop(0.2, 'rgba(100, 150, 150, 0.15)');
          gradient.addColorStop(1, 'rgba(100, 140, 140, .13)');

          ctx.fillStyle = gradient;
          ctx.fillRect(store.rainCoordinates[i].x, store.rainCoordinates[i].y, store.rainCoordinates[i].z, 4);
        }
      }
    }
  });

  const handleResize = $(() => {
    if (canvasRef.value && window.visualViewport) {
      const { width } = window.visualViewport;

      canvasRef.value.width = width;
      store.width = width;
    }
  });

  useOnWindow('resize', $(() => {
    // @ts-ignore
    if (window.visualViewport?.width > Breakpoints.SM) {
      handleResize();
    }
  }));

  useClientEffect$(() => {
    handleResize();

    let lightningTimer = 8000;

    const ctx = canvasRef.value?.getContext('2d');

    if (ctx) {
      const setupRain = () => {
        store.rainCoordinates = [];

        for (let i = 500; i >= 0; i--) {
          store.rainCoordinates.push({
            x: 1,
            y: 0,
            z: 0
          } as RainCoordinates);
        }

        for (let j = 0; j < 500; j++) {
          store.rainCoordinates[j].x = Math.floor((Math.random() * 820) - 9);
          store.rainCoordinates[j].y = Math.floor((Math.random() * 520) - 9);
          store.rainCoordinates[j].z = Math.floor((Math.random() * 2) + 1);
          store.rainCoordinates[j].w = Math.floor((Math.random() * 3) + 2);
        }
      };

      const mainLoop = () => {
        store.msTimer += 30;

        if (store.lightningTimer < 0)  {
          store.lightningTimer = lightningTimer;
        } else {
          store.lightningTimer -= 30;
        }

        ctx.fillStyle = '#0e0f1a';
        ctx.fillRect(0,0, store.width, 515);

        drawSidewalk();
        drawLamp();

        if (store.isRaining) {
          drawRain();
        }

        if (store.lightningTimer < 500.0) {
          drawLightning();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, .1)';
        ctx.font = '30px Sans-Serif';
      }

      setupRain();

      const mainLoopInterval = setInterval(mainLoop, 30);

      const lightningTimerTimeout = setTimeout(() => {
        lightningTimer = 30000;
      }, lightningTimer * 2);

      const rainingTimeout = setTimeout(() => {
        store.isRaining = true;

        const rainProgressInterval = setInterval(() => {
          if (store.rainProgress < 30) {
            store.rainProgress += 1;
          } else if (store.rainProgress < 100) {
            store.rainProgress += 2;
          } else if (store.rainProgress < 500) {
            store.rainProgress += 10;
          } else {
            clearInterval(rainProgressInterval);

            const rainSpeedTimeout = setTimeout(() => {
              store.rainSpeed = 4;

              clearTimeout(rainSpeedTimeout);
            }, 6500);
          }
        }, 100);
      }, 1000);

      return () => {
        clearInterval(mainLoopInterval);
        clearTimeout(lightningTimerTimeout);
        clearTimeout(rainingTimeout);
      };
    }
  });

  return (
    <canvas ref={canvasRef} height={515} />
  );
});
