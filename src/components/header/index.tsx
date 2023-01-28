import { component$, useClientEffect$, useSignal, $ } from "@builder.io/qwik";
import { Link } from '@builder.io/qwik-city';
import { Themes } from '~/theme/index.css';

import { Header, Logo, Icon, Section, Anchor, link } from './styles.css';

export default component$(() => {
  const theme = useSignal(Themes.DARK);

  const toggleTheme = $(() => {
    theme.value = theme.value === Themes.LIGHT ? Themes.DARK : Themes.LIGHT;
    localStorage.setItem('theme', theme.value);
  });

  useClientEffect$(() => {
    const localStorageTheme = localStorage.getItem('theme');
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    theme.value = localStorageTheme || (isDarkTheme ? Themes.DARK : Themes.LIGHT);
  });

  return (
    <Header>
      <Link href='/' class={link}>
        <Logo alt='Nomadware.io logo' src='./logo.webp' />
      </Link>
      <Section>
        <Icon
          alt={`Toggle ${theme.value} mode`}
          src={`./${theme.value}-theme-icon.webp`}
          onClick$={toggleTheme}
        />
        <Anchor href='https://github.com/fum4'>
          <Icon
            alt='GitHub logo'
            src='./github.svg'
          />
        </Anchor>
      </Section>
    </Header>
  );
});
