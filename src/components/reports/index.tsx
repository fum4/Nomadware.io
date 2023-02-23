import {
  type PropFunction,
  component$,
  useBrowserVisibleTask$,
  useStore,
  useSignal,
} from '@builder.io/qwik';

import {
  PrimaryMetrics,
  SecondaryMetrics,
  Metric,
  Report,
  Circle,
  MetricText,
  DisplayScore,
  DisplayValue,
  DisplayValuePlaceholder,
  PrimaryMetricTitle,
  SecondaryMetricTitle,
  LoadingText,
  backgroundCircleClass,
  foregroundCircleClass,
  firstDotClass,
  secondDotClass,
  thirdDotClass,
  fadeOutClass,
} from './styles.css';

interface PrimaryMetric {
  title: string;
  score: number;
  displayScore: number;
}

interface SecondaryMetric {
  title: string;
  displayValue?: string;
}

interface ReportState {
  metrics: {
    primary: PrimaryMetric[];
    secondary: SecondaryMetric[];
  };
  reportsFetched: boolean;
}

interface ReportsProps {
  onReportsLoaded$: PropFunction<() => void>;
}

export default component$(({ onReportsLoaded$ }: ReportsProps) => {
  const loadingTextRef = useSignal<HTMLDivElement>();

  const emptyMetrics = {
    primary: [
      { title: 'Performance', score: 0, displayScore: 0 },
      { title: 'Accessibility', score: 0, displayScore: 0 },
      { title: 'Best practices', score: 0, displayScore: 0 },
      { title: 'SEO', score: 0, displayScore: 0 },
    ],
    secondary: [
      { title: 'Speed' },
      { title: 'Boot-up' },
      { title: 'LCP' },
      { title: 'TBT' },
    ]
  };

  const store = useStore<ReportState>({
    metrics: emptyMetrics,
    reportsFetched: false,
  }, { deep: true });

  useBrowserVisibleTask$(({ track }) => {
    track(() => store.reportsFetched);

    if (store.reportsFetched) {
      store.metrics.primary.forEach((metric, index) => {
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

  useBrowserVisibleTask$(() => {
    (async() => {
      if (!window.navigator.userAgent.includes('Chrome-Lighthouse')) {
        const searchParams = 'url=https://nomadware.io&key=AIzaSyB18ptJgrd47t1_tuc4mKfxzeCMMS2xXXc&category=performance&category=accessibility&category=best-practices&category=seo';
        const pageSpeedUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + searchParams;

        const response = await fetch(pageSpeedUrl);
        const { lighthouseResult } = await response.json();

        const {
          performance,
          accessibility,
          seo,
          'best-practices': bestPractices,
        } = lighthouseResult.categories;

        const primaryMetrics = [
          performance,
          accessibility,
          bestPractices,
          seo,
        ];

        primaryMetrics.forEach(({ score }, index) => {
          store.metrics.primary[index] = {
            ...store.metrics.primary[index],
            score,
          };
        });

        primaryMetrics.forEach((metric, index) => {
          let displayScore = 0;

          setTimeout(() => {
            const interval = setInterval(() => {
              if (displayScore / 100 < metric.score) {
                displayScore += 1;

                store.metrics.primary[index] = {
                  ...store.metrics.primary[index],
                  displayScore,
                };
              } else {
                clearInterval(interval);
              }
            }, 20);
          }, 1000);
        });

        const {
          'speed-index': speedIndex,
          'bootup-time': bootupTime,
          'largest-contentful-paint': largestContentfulPaint,
          'total-blocking-time': totalBlockingTime,
        } = lighthouseResult.audits;

        const secondaryMetrics = [
          speedIndex,
          bootupTime,
          largestContentfulPaint,
          totalBlockingTime,
        ];

        secondaryMetrics.forEach(({ displayValue }, index) => {
          store.metrics.secondary[index] = {
            ...store.metrics.secondary[index],
            displayValue,
          };
        });

        store.reportsFetched = true;

        onReportsLoaded$?.();
      }
    })();
  });

  return (
    <Report>
      <PrimaryMetrics>
        {store.metrics.primary.map((primaryMetric) => (
          <Metric key={primaryMetric.title}>
            <a
              title='Mobile perf score from PageSpeed Insights'
              target='_blank'
              rel='noreferrer'
              href='https://pagespeed.web.dev/report?url=https%3A%2F%2Fnomadware.io%2F'
            >
              <Circle>
                <svg viewBox='0 0 150 150'>
                  <circle class={backgroundCircleClass} r='60' cx='75' cy='75' fill='transparent' stroke-dasharray='565.48' stroke-dashoffset='0' />
                  <circle
                    class={foregroundCircleClass}
                    r='60' cx='75' cy='75'
                    stroke-dasharray='565.48'
                    stroke-dashoffset='565.48px'
                    fill='transparent'
                  />
                </svg>
                <MetricText>
                  <DisplayScore>{primaryMetric.displayScore}%</DisplayScore>
                </MetricText>
              </Circle>
            </a>
            <PrimaryMetricTitle>
              {primaryMetric.title}
            </PrimaryMetricTitle>
          </Metric>
        ))}
      </PrimaryMetrics>
      <SecondaryMetrics>
        {store.metrics.secondary.map((secondaryMetric) => (
          <Metric key={secondaryMetric.title}>
            <a
              title='Mobile perf score from PageSpeed Insights'
              target='_blank'
              rel='noreferrer'
              href='https://pagespeed.web.dev/report?url=https%3A%2F%2Fnomadware.io%2F'
            >
              {secondaryMetric.displayValue ? (
                <DisplayValue>{secondaryMetric.displayValue}</DisplayValue>
              ) : (
                <DisplayValuePlaceholder>-</DisplayValuePlaceholder>
              )}
            </a>
            <SecondaryMetricTitle>
              {secondaryMetric.title}
            </SecondaryMetricTitle>
          </Metric>
        ))}
      </SecondaryMetrics>
      <LoadingText
        ref={loadingTextRef}
        class={store.reportsFetched ? fadeOutClass : ''}
      >
        Analyzing page speed
        <span class={firstDotClass}>.</span>
        <span class={secondDotClass}>.</span>
        <span class={thirdDotClass}>.</span>
      </LoadingText>
    </Report>
  );
});
