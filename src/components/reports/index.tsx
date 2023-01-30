import {
  type PropFunction,
  component$,
  useClientEffect$,
  useStore,
  useSignal,
} from '@builder.io/qwik';

import {
  Metrics,
  Metric,
  Report,
  Circle,
  Score,
  ScoreText,
  LoadingText,
  circleClass,
  progressBarClass,
  firstDotClass,
  secondDotClass,
  thirdDotClass,
  fadeOutClass,
} from './styles.css';

interface MetricData {
  name: string;
  displayValue: string;
  score: number;
  displayScore: number;
  description?: string;
}

interface ReportState {
  metrics: MetricData[];
  dataLoaded: boolean;
}

interface ReportsProps {
  onReportsLoaded$: PropFunction<() => void>;
}

export default component$(({ onReportsLoaded$ }: ReportsProps) => {
  const loadingTextRef = useSignal<HTMLDivElement>();

  const emptyMetrics = [
    { name: 'Speed Index', displayValue: '0s', score: 0, displayScore: 0 },
    { name: 'Boot time', displayValue: '0s', score: 0, displayScore: 0 },
    { name: 'TBT', displayValue: '0s', score: 0, displayScore: 0 },
    { name: 'FCP', displayValue: '0s', score: 0, displayScore: 0 },
    { name: 'LCP', displayValue: '0s', score: 0, displayScore: 0 },
  ];

  const store = useStore<ReportState>({
    metrics: emptyMetrics,
    dataLoaded: false,
  }, { recursive: true });

  useClientEffect$(({ track }) => {
    track(() => store.dataLoaded);

    if (store.dataLoaded) {
      store.metrics.forEach((metric, index) => { // TODO: stale values?
        const circle = document.querySelectorAll(`.${circleClass}.${progressBarClass}`)[index];

        const r = circle.getAttribute('r');

        if (r) {
          const c = Math.PI * (+r * 2);
          const strokeDashoffset = metric.score * c;

          circle.setAttribute('stroke-dashoffset', `${strokeDashoffset}px`);
        }
      });
    }
  });

  useClientEffect$(() => {
    const searchParams = new URLSearchParams({
      url: 'https://nomadware.io',
      key: 'AIzaSyB18ptJgrd47t1_tuc4mKfxzeCMMS2xXXc',
      category: 'performance',
    });

    const pageSpeedUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + searchParams;

    (async () => {
      const response = await fetch(pageSpeedUrl);
      const { lighthouseResult } = await response.json();

      const {
        'speed-index': speedIndex,
        'bootup-time': bootupTime,
        'total-blocking-time': totalBlockingTime,
        'first-contentful-paint': firstContentfulPaint,
        'largest-contentful-paint': largestContentfulPaint,
      } = lighthouseResult.audits;

      const metrics = [
        speedIndex,
        bootupTime,
        totalBlockingTime,
        firstContentfulPaint,
        largestContentfulPaint
      ];

      metrics.forEach((metric, index) => {
        store.metrics[index] = {
          ...store.metrics[index],
          displayValue: metric.displayValue,
          score: metric.score,
        };
      });

      metrics.forEach((metric, index) => {
        let displayScore = 0;

        const interval = setInterval(() => {
          if (displayScore / 100 < metric.score) {
            displayScore += 1;

            store.metrics[index] = {
              ...store.metrics[index],
              displayScore,
            };
          } else {
            clearInterval(interval);
          }
        }, 30);
      });

      store.dataLoaded = true;

      onReportsLoaded$?.();
    })();
  });

  return (
    <Report>
      <Metrics>
        {store.metrics.map((metric) => (
          <Metric>
            <a
              style='--color:#0c6'
              title='Mobile perf score from PageSpeed Insights'
              target='_blank'
              rel='noreferrer'
              href='https://pagespeed.web.dev/report?url=https%3A%2F%2Fgoshi.dev%2F'
            >
              <Circle>
                <svg viewBox='0 0 120 120'>
                  <circle class={circleClass} r='50' cx='60' cy='60' fill='transparent' stroke-dasharray='565.48' stroke-dashoffset='0' />
                  <circle
                    class={`${circleClass} ${progressBarClass}`}
                    r='50' cx='60' cy='60'
                    stroke-dasharray='565.48'
                    stroke-dashoffset='565.48px'
                    fill='transparent'
                  />
                </svg>
                <Score>
                  <ScoreText>{metric.displayScore}%</ScoreText>
                </Score>
              </Circle>
            </a>
            <p>
              {metric.name}
            </p>
          </Metric>
        ))}
      </Metrics>
      <LoadingText
        ref={loadingTextRef}
        class={store.dataLoaded ? fadeOutClass : ''}
      >
        Analyzing page speed
        <span class={firstDotClass}>.</span>
        <span class={secondDotClass}>.</span>
        <span class={thirdDotClass}>.</span>
      </LoadingText>
    </Report>
  );
});
