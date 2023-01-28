import { component$, Slot } from '@builder.io/qwik';

import Header from '~/components/header';

export default component$(() => {
  return (
    <div class='layout'>
      <Header />
      <Slot />
      <footer>
        <a href="https://www.builder.io/" target="_blank">
          Made with ♡ by Builder.io
        </a>
      </footer>
    </div>
  );
});
