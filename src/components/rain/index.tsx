import { component$, useSignal, useStore, useClientEffect$, useOnWindow, $ } from '@builder.io/qwik';

import { Root, Canvas } from './styles.css';

interface RainCoordinates {
  width: number; // TODO: ??
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
  height: number;
  isRaining: boolean;
  rainProgress: number;
}

export default component$(() => {
  const canvasRef = useSignal<HTMLCanvasElement>();

  const store = useStore<State>({
    rainCoordinates: [] as RainCoordinates[],
    lightningTimer: 8000,
    lightningAlpha: 0,
    rainSpeed: 2,
    msTimer: 0,
    width: 0,
    height: 0,
    isRaining: false,
    rainProgress: 0,
  });

  const handleResize = $(() => {
    if (canvasRef.value && window.visualViewport) {
      const { width, height } = window.visualViewport;

      canvasRef.value.width = width;
      canvasRef.value.height = height;

      store.width = width;
      store.height = height;
    }
  });

  const drawRoad = $(() => {
    const ctx = canvasRef.value?.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#202224';
      ctx.fillRect(0, 520, store.width, store.height - 520);
    }
  });

  const drawSidewalk = $(() => {
    const ctx = canvasRef.value?.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#343A34';
      ctx.fillRect(0, 500, store.width, 10);

      let gradient = ctx.createRadialGradient(250, 500, 0, 250, 500, 150);

      gradient.addColorStop(0.0, 'rgba(32, 36, 38, .0)');
      gradient.addColorStop(0.2, 'rgba(32, 36, 38, 0.1)');
      gradient.addColorStop(0.6, 'rgba(32, 36, 38, 0.2)');
      gradient.addColorStop(0.8, 'rgba(32, 36, 38, 0.6)');
      gradient.addColorStop(1, 'rgba(32, 34, 38, .8)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 500, store.width, 10);

      ctx.fillStyle = '#343A34';
      ctx.fillRect(0, 510, store.width, 10);

      gradient = ctx.createRadialGradient(250, 500, 0, 250, 500, 150);

      gradient.addColorStop(0.0, 'rgba(32, 36, 38, 0.7)');
      gradient.addColorStop(0.2, 'rgba(32, 36, 38, 0.8)');
      gradient.addColorStop(0.4, 'rgba(32, 36, 38, 0.85)');
      gradient.addColorStop(1, 'rgba(32, 34, 38, .9)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 510, store.width, 10);
    }
  });

  const drawLamp = $(() => {
    const ctx = canvasRef.value?.getContext('2d');

    if (ctx) {
      const gradient = ctx.createLinearGradient(150, 210, 150, 500);

      gradient.addColorStop(0.000, 'rgba(60, 60, 60, 1.000)');
      gradient.addColorStop(0.2, 'rgba(80, 80, 80, 1.000)');
      gradient.addColorStop(1, 'rgba(45, 45, 45, 1.000)');

      ctx.fillStyle = gradient;
      ctx.fillRect(247, 210, 6, 290);

      const gradientOuterHigh = ctx.createLinearGradient(150, 210, 150, 500);

      gradientOuterHigh.addColorStop(0.000, 'rgba(65, 65, 65, 1.000)');
      gradientOuterHigh.addColorStop(0.2, 'rgba(95, 95, 95, 1.000)');
      gradientOuterHigh.addColorStop(1, 'rgba(47, 47, 47, 1.000)');

      ctx.fillStyle = gradientOuterHigh;
      ctx.fillRect(246, 210, 1, 290);

      const gradientOuterLow = ctx.createLinearGradient(150, 210, 150, 500);

      gradientOuterLow.addColorStop(0.000, 'rgba(45, 45, 45, 1.000)');
      gradientOuterLow.addColorStop(0.2, 'rgba(60, 60, 60, 1.000)');
      gradientOuterLow.addColorStop(1, 'rgba(43, 43, 43, 1.000)');

      ctx.fillStyle = gradientOuterLow;
      ctx.fillRect(253, 210, 1, 290);

      // Modify glow based on passed time
      const sinGlowMod = 5 * Math.sin(store.msTimer / 200);
      const cosGlowMod = 5 * Math.cos((store.msTimer + 0.5 * sinGlowMod) / 200);
      const gradientGlow = ctx.createRadialGradient(250, 200, 0, 247 + sinGlowMod, 400, 206 + cosGlowMod);

      gradientGlow.addColorStop(0.000, 'rgba(220, 240, 160, 1)');
      gradientGlow.addColorStop(0.2, 'rgba(180, 240, 160, 0.4)');
      gradientGlow.addColorStop(0.4, 'rgba(140, 240, 160, 0.2)');
      gradientGlow.addColorStop(1, 'rgba(140, 240, 160, 0)');

      ctx.fillStyle = gradientGlow;
      ctx.fillRect(0, 0, 500, 500);
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
          // const { width, x, y } = store.rainCoordinates[i]; // TODO: play with these

          if (store.rainCoordinates[i].y >= 482) {
            store.rainCoordinates[i].y -= 500;
          }

          if (store.rainCoordinates[i].x < -10) {
            store.rainCoordinates[i].x += store.width;
          } else {
            store.rainCoordinates[i].y += store.rainCoordinates[i].width * store.rainSpeed;
            store.rainCoordinates[i].x -= 5 + Math.floor(store.rainCoordinates[i].y / 250) - store.rainCoordinates[i].width;
          }

          const gradient = ctx.createRadialGradient(250, 450, 140, 250, 300, 600);

          gradient.addColorStop(0.000, 'rgba(100, 170, 160, 0.2)');
          gradient.addColorStop(0.1, 'rgba(100, 160, 160, 0.12)');
          gradient.addColorStop(0.2, 'rgba(100, 150, 150, 0.1)');
          gradient.addColorStop(1, 'rgba(100, 140, 140, .08)');

          ctx.fillStyle = gradient;
          ctx.fillRect(store.rainCoordinates[i].x, store.rainCoordinates[i].y, store.rainCoordinates[i].z, 4);
        }
      }
    }
  });

  useOnWindow('resize', handleResize);

  useClientEffect$(() => {
    drawRoad();
    drawSidewalk();
    drawLamp();
  });

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
          } as RainCoordinates); // TODO
        }

        for (let j = 0; j < 500; j++) {
          store.rainCoordinates[j].x = Math.floor((Math.random() * 820) - 9);
          store.rainCoordinates[j].y = Math.floor((Math.random() * 520) - 9);
          store.rainCoordinates[j].z = Math.floor((Math.random() * 2) + 1);
          store.rainCoordinates[j].width = Math.floor((Math.random() * 3) + 2);
        }
      };

      const mainLoop = () => {
        store.msTimer += 30;

        if (store.lightningTimer < 0)  {
          store.lightningTimer = lightningTimer;
        } else {
          store.lightningTimer -= 30;
        }

        ctx.fillStyle = '#202426';
        ctx.fillRect(0,0, store.width, store.height);

        drawSidewalk();
        drawRoad();
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

      setInterval(mainLoop, 30); // TODO: check if needs clean up

      setTimeout(() => {
        lightningTimer = 30000;
      }, lightningTimer * 2);

      setTimeout(() => {
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

            setTimeout(() => store.rainSpeed = 4, 4500);
          }
        }, 100);
      }, 1000);
    }
  });

  return (
    <Root>
      <Canvas ref={canvasRef} />
    </Root>
  );
});
