import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

import Rain from '~/components/rain';
import Content from '~/components/content';

export default component$(() => {
  return (
    <div class={'root'}>
      <Rain />
      <Content />
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
