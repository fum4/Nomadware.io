import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import Hero from '~/components/hero';
import Content from '~/components/content';

import { Home } from './styles.css';

export default component$(() => {
  return (
    <Home>
      <Hero />
      <Content />
    </Home>
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
