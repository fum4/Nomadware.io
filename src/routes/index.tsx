import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

import Rain from '~/components/rain';
import Report from '~/components/report';

export default component$(() => {
  return (
    <div class={'root'}>
      <Rain />
      <Report />
    </div>
  )
});

export const head: DocumentHead = {
  title: 'Nomadware.io',
  meta: [
    {
      name: 'description',
      content: 'Build great software',
    },
  ],
};
