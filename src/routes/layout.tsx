import { component$, Slot } from '@builder.io/qwik';

import Header from '~/components/header';
import Footer from '~/components/footer';

export default component$(() => {
  return (
    <div class='layout'>
      <Header />
      <Slot />
      <Footer />
    </div>
  );
});
