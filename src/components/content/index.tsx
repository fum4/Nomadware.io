import { component$, useStore, $ } from '@builder.io/qwik';
import Reports from '~/components/reports';

import {
  Root,
  H1,
  H2,
  TextBox,
  ReportsBox,
  slideInAnimation,
  fadeInAnimation,
  fadeInAnimationLate,
} from './styles.css';

interface ContentState {
  showText: boolean;
}

export default component$(() => {
  const store = useStore<ContentState>({
    showText: false,
  });

  const handleReportsLoaded = $(() => {
    store.showText = true;
  });

  return (
    <Root>
      <ReportsBox>
        <Reports onReportsLoaded$={handleReportsLoaded} />
      </ReportsBox>
      {store.showText && (
        <div>
          <TextBox>
            <H1 class={fadeInAnimation}>
              Time is performance.
            </H1>
            <H1 class={slideInAnimation}>
              It is the most valuable resource we have.
            </H1>
          </TextBox>
          <TextBox>
            <H2 class={fadeInAnimationLate}>
              Don't waste any.
            </H2>
          </TextBox>
        </div>
      )}
    </Root>
  );
});
