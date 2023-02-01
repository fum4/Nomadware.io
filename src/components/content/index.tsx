import { component$, useStore, $ } from '@builder.io/qwik';
import Reports from '~/components/reports';

import {
  Root,
  H1,
  H2,
  TextBox,
  ReportsBox,
  slideInClass,
  fadeInClass,
  fadeInEagerClass,
  fadeInLateClass,
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
      <ReportsBox class={fadeInEagerClass}>
        <Reports onReportsLoaded$={handleReportsLoaded} />
      </ReportsBox>
      {store.showText && (
        <div>
          <TextBox>
            <H1 class={fadeInClass}>
              Time is performance.
            </H1>
            <H1 class={slideInClass}>
              It is the most valuable resource we have.
            </H1>
          </TextBox>
          <TextBox>
            <H2 class={fadeInLateClass}>
              Don't waste any.
            </H2>
          </TextBox>
        </div>
      )}
    </Root>
  );
});
