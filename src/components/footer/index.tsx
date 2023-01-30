import { component$ } from '@builder.io/qwik';

import { QwikLogo } from '~/components/icons/qwik';
import { Footer, BuiltWith, Anchor } from './styles.css';

export default component$(() => (
  <Footer>
    <BuiltWith>
      <span>Built with</span>
      <Anchor href='https://qwik.builder.io/'>
        <QwikLogo />
      </Anchor>
    </BuiltWith>
  </Footer>
));
