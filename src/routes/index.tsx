import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

import Rain from '~/components/rain';

export default component$(() => (
  <div class={'root'}>
    <Rain />
  </div>
));

export const head: DocumentHead = {
  title: 'Nomadware.io',
  meta: [
    {
      name: 'description',
      content: 'Build great software',
    },
  ],
};
