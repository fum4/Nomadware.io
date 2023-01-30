import { component$, useClientEffect$, useStore } from "@builder.io/qwik";

import { Container, Text, Author, Quote } from './styles.css';

export default component$(() => {
  const store = useStore({
    show: 'quotes',
    currentLine: 0,
    currentQuote: 0,
    morph: 0,
    time: new Date(),
  });

  const timeQuotes = [
    {
      text: 'Better three hours too soon than a minute too late.',
      author: 'William Shakespeare',
    },
    {
      text: 'Time waits for no one.',
      author: 'Folklore',
    },
    {
      text: 'Time is money.',
      author: 'Benjamin Franklin',
    },
  ];

  const dialogue = [
    'No matter what quote you choose, one thing is for sure: time is precious.',
    'Don’t waste yours.',
  ];

  const doMorph = () => {
    const morphTime = 1;
    const cooldownTime = 0.25;

    const textIndex = timeQuotes.length - 1;
    let cooldown = cooldownTime;

    store.morph -= cooldown;
    cooldown = 0;

    let fraction = store.morph / morphTime;

    if (fraction > 1) {
      cooldown = cooldownTime;
      fraction = 1;
    }

    // set morph

    elts.text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
    elts.text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

    fraction = 1 - fraction;
    elts.text1.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
    elts.text1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

    elts.text1.textContent = texts[textIndex % texts.length];
    elts.text2.textContent = texts[(textIndex + 1) % texts.length];
  }

  function setMorph(fraction) {

  }

  function doCooldown() {
    store.morph = 0;

    elts.text2.style.filter = "";
    elts.text2.style.opacity = "100%";

    elts.text1.style.filter = "";
    elts.text1.style.opacity = "0%";
  }

  function animate() {
    requestAnimationFrame(animate);

    let newTime = new Date();
    let shouldIncrementIndex = cooldown > 0;
    let dt = (newTime - time) / 1000;
    time = newTime;

    cooldown -= dt;

    if (cooldown <= 0) {
      if (shouldIncrementIndex) {
        textIndex++;
      }

      doMorph();
    } else {
      doCooldown();
    }
  }

  useClientEffect$(() => {
      const interval = setInterval(() => {
        if (store.currentQuote < timeQuotes.length - 1) {
          store.currentQuote = store.currentQuote + 1;
        } else {
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
  });

  return (
    <Container>
      <Quote>
        <Text>{timeQuotes[store.currentQuote].text}</Text>
        <Author>- {timeQuotes[store.currentQuote].author}</Author>
      </Quote>
      {store.currentQuote < timeQuotes.length - 1 && (
        <Quote>
          <Text>{timeQuotes[store.currentQuote + 1].text}</Text>
          <Author>- {timeQuotes[store.currentQuote + 1].author}</Author>
        </Quote>
      )}
    </Container>
  );
});
