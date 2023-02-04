import { component$, useStore, $ } from '@builder.io/qwik';
import Reports from '~/components/reports';

import {
  Root,
  H1,
  H2,
  Logo,
  LogoBox,
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
              Don't waste any.
            </H1>
          </TextBox>
          <LogoBox class={fadeInLateClass}>
            <Logo
              alt='Nomadware.io logo'
              src='./logo.webp'
            />
            <H2>
              Nomadware.io
            </H2>
          </LogoBox>
        </div>
      )}
    </Root>
  );
});
