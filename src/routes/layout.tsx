import { component$, Slot } from '@builder.io/qwik';

import Header from '~/components/header';
import { QwikLogo } from '~/components/icons/qwik';

export default component$(() => {
  return (
    <div class='layout'>
      <Header />
      <Slot />
      <footer>
        <div class='made-with'>
          <span>Built with</span>
          <a href='https://qwik.builder.io/'>
            <QwikLogo />
          </a>
        </div>
      </footer>
    </div>
  );
});
