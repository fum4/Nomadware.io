import { component$, useSignal, $ } from "@builder.io/qwik";
import Rain from '~/components/rain';
import Tweet from '~/components/tweet';

export default component$(() => {
  const perfLevel = useSignal<number>(0);

  const handlePerfDecrease = $(() => {

  });

  return (
    <>
      <Rain />
      <button onClick$={handlePerfDecrease}>Make site less qwik</button>
      <Tweet />
    </>
  );
});
