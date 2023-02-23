import { component$ } from '@builder.io/qwik';
import { QwikLogo } from '~/components/icons/qwik';

import { Footer, BuiltWith, Anchor } from './styles.css';

export default component$(() => (
  <Footer>
    <BuiltWith>
      <span>Powered by</span>
      <Anchor
        href='https://qwik.builder.io/'
        title='Qwik logo'
      >
        <QwikLogo />
      </Anchor>
    </BuiltWith>
  </Footer>
));
