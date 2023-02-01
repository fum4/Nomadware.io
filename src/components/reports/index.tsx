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
  backgroundCircleClass,
  foregroundCircleClass,
  firstDotClass,
  secondDotClass,
  thirdDotClass,
  fadeOutClass,
} from './styles.css';

interface MetricData {
  title: string;
  score: number;
  displayScore: number;
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
    { title: 'Performance', score: 0, displayScore: 0 },
    { title: 'Accessibility', score: 0, displayScore: 0 },
    { title: 'Best practices', score: 0, displayScore: 0 },
    { title: 'SEO', score: 0, displayScore: 0 },
  ];

  const store = useStore<ReportState>({
    metrics: emptyMetrics,
    dataLoaded: false,
  }, { recursive: true });

  useClientEffect$(({ track }) => {
    track(() => store.dataLoaded);

    if (store.dataLoaded) {
      store.metrics.forEach((metric, index) => {
        const circle = document.querySelectorAll(`.${foregroundCircleClass}`)[index];

        if (circle) {
          const r = circle.getAttribute('r');

          if (r) {
            const circumference = 2 * +r * Math.PI;
            const strokeDasharray = metric.score * 100 * circumference / 100;

            circle.setAttribute('stroke-dasharray', `${strokeDasharray} 999`);
            circle.setAttribute('stroke-dashoffset', `0`);
          }
        }
      });
    }
  });

  useClientEffect$(() => {
    const searchParams = 'url=https://nomadware.io&key=AIzaSyB18ptJgrd47t1_tuc4mKfxzeCMMS2xXXc&category=performance&category=accessibility&category=best-practices&category=seo';
    const pageSpeedUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + searchParams;

    (async () => {
      const response = await fetch(pageSpeedUrl);
      const { lighthouseResult } = await response.json();

      const {
        performance,
        accessibility,
        seo,
        'best-practices': bestPractices,
      } = lighthouseResult.categories;

      const metrics = [
        performance,
        accessibility,
        bestPractices,
        seo,
      ];

      metrics.forEach(({ score }, index) => {
        store.metrics[index] = {
          ...store.metrics[index],
          score,
        };
      });

      metrics.forEach((metric, index) => {
        let displayScore = 0;

        setTimeout(() => {
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
          }, 20);
        }, 1000);
      });

      store.dataLoaded = true;

      onReportsLoaded$?.();
    })();
  });

  return (
    <Report>
      <Metrics>
        {store.metrics.map((metric) => (
          <Metric key={metric.title}>
            <a
              title='Mobile perf score from PageSpeed Insights'
              target='_blank'
              rel='noreferrer'
              href='https://pagespeed.web.dev/report?url=https%3A%2F%2Fnomadware.io%2F'
            >
              <Circle>
                <svg viewBox='0 0 120 120'>
                  <circle class={backgroundCircleClass} r='50' cx='60' cy='60' fill='transparent' stroke-dasharray='565.48' stroke-dashoffset='0' />
                  <circle
                    className={foregroundCircleClass}
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
              {metric.title}
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
