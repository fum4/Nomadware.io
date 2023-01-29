import { component$, useClientEffect$ } from '@builder.io/qwik';

export default component$(() => {
  // const report = useSignal('');
  //
  useClientEffect$(() => {
      const apiKey = 'AIzaSyB18ptJgrd47t1_tuc4mKfxzeCMMS2xXXc';
      const nwUrl = 'https://nomadware.io';
      const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed/${nwUrl}?key=${apiKey}`;

      fetch(psUrl)
        .then(response => response.json())
        .then(json => {
          console.log('@@@@@@ json ', json);
          // See https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed#response
          // to learn more about each of the properties in the response object.
          // showInitialContent(json.id);
          // const cruxMetrics = {
          //   "First Contentful Paint": json.loadingExperience.metrics.FIRST_CONTENTFUL_PAINT_MS.category,
          //   "First Input Delay": json.loadingExperience.metrics.FIRST_INPUT_DELAY_MS.category
          // };
          // showCruxContent(cruxMetrics);
          // const lighthouse = json.lighthouseResult;
          // const lighthouseMetrics = {
          //   'First Contentful Paint': lighthouse.audits['first-contentful-paint'].displayValue,
          //   'Speed Index': lighthouse.audits['speed-index'].displayValue,
          //   'Time To Interactive': lighthouse.audits['interactive'].displayValue,
          //   'First Meaningful Paint': lighthouse.audits['first-meaningful-paint'].displayValue,
          //   'First CPU Idle': lighthouse.audits['first-cpu-idle'].displayValue,
          //   'Estimated Input Latency': lighthouse.audits['estimated-input-latency'].displayValue
          // };
          // showLighthouseContent(lighthouseMetrics);
        });
  });
  //
  // // useTask$(({ track }) => {
  // //   track(() => report.value);
  // //   console.log('@@@@@@ ', report.value)
  // // });

  return (
    // <div innerHTML={report.value}>
    <div></div>
  );
});
