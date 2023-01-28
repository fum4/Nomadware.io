import { component$, useClientEffect$, useStore, $ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { Themes } from '~/theme/index.css';

import {
  Header,
  Content,
  Logo,
  Text,
  Title,
  ExtendedTitle,
  NarrowTitle,
  Emoji,
  Icon,
  Buttons,
  Anchor,
  logoLink,
  textLink
} from './styles.css';

export default component$(() => {
  const heartEmoji = '♡';
  const coffeeEmoji = '☕';

  const store = useStore({
    theme: Themes.DARK,
    emoji: heartEmoji,
  });

  const toggleTheme = $(() => {
    store.theme = store.theme === Themes.LIGHT ? Themes.DARK : Themes.LIGHT;
    localStorage.setItem('theme', store.theme);
  });

  useClientEffect$(() => {
    const localStorageTheme = localStorage.getItem('theme');
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    store.theme = localStorageTheme || (isDarkTheme ? Themes.DARK : Themes.LIGHT);
  });

  return (
    <Header>
      <Content>
        <Link href='/' class={logoLink}>
          <Logo alt='Nomadware.io logo' src='./logo.webp' />
        </Link>

        <ExtendedTitle>
          <Text
            onMouseEnter$={() => store.emoji = coffeeEmoji}
            onMouseLeave$={() => store.emoji = heartEmoji}
          >
            Made with <Emoji>{store.emoji}</Emoji> by
            <Link href='/' class={textLink}>
              <Title>Nomadware.io</Title>
            </Link>
          </Text>
        </ExtendedTitle>

        <NarrowTitle>
          <Link href='/' class={textLink}>
            <Title>Nomadware.io</Title>
          </Link>
        </NarrowTitle>

        <Buttons>
          <Icon
            alt={`Toggle ${store.theme} mode`}
            src={`./${store.theme}-theme-icon.webp`}
            onClick$={toggleTheme}
          />
          <Anchor href='https://github.com/fum4'>
            <Icon
              alt='GitHub logo'
              src='./github.svg'
            />
          </Anchor>
        </Buttons>
      </Content>
    </Header>
  );
});
