import { component$, useBrowserVisibleTask$, useStore, $ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { Themes } from '~/theme/index.css';
import Tooltip from '~/components/tooltip';

import {
  Header,
  Content,
  LogoBox,
  Logo,
  Text,
  Title,
  Icon,
  ButtonsBox,
  Buttons,
  Anchor,
  logoLink,
  textLink,
  emoji
} from './styles.css';

type Theme = typeof Themes.LIGHT | typeof Themes.DARK;

interface HeaderState {
  theme: Theme;
  emoji: keyof typeof emoji;
  drankCoffees: number;
}

export default component$(() => {
  const githubUrl = 'https://github.com/fum4';
  const title = 'Nomadware.io';

  const Emoji = {
    HEART: '♡',
    COFFEE: '☕',
    SUN: '☀️',
  };

  const store = useStore<HeaderState>({
    theme: Themes.DARK,
    emoji: 'HEART',
    drankCoffees: 0,
  });

  const toggleTheme = $(() => {
    store.theme = store.theme === Themes.LIGHT ? Themes.DARK : Themes.LIGHT;
    localStorage.setItem('theme', store.theme);
  });

  useBrowserVisibleTask$(() => {
    const localStorageTheme = localStorage.getItem('theme') as Theme;
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    store.theme = localStorageTheme || (isDarkTheme ? Themes.DARK : Themes.LIGHT);
  });

  return (
    <Header>
      <Content>
        <LogoBox>
          <Link href='/' class={logoLink}>
            <Logo alt={`${title} logo`} src='./logo.png' />
          </Link>
        </LogoBox>

        <Text
          onMouseEnter$={() => store.drankCoffees < 3 && (store.emoji = 'COFFEE')}
          onMouseLeave$={() => store.emoji = 'HEART'}
        >
          Made with

          <Tooltip
            text={`A bit too much ${Emoji.COFFEE} ?`}
            disabled={store.drankCoffees < 3}
          >
            <span
              class={emoji[store.emoji]}
              onClick$={() => {
                if (store.emoji === 'COFFEE') {
                  store.emoji = 'HEART';
                  store.drankCoffees += 1;
                }
              }}
            >
              {Emoji[store.emoji]}
            </span>
          </Tooltip>

          by

          <Link href='/' class={textLink}>
            <Title>{title}</Title>
          </Link>
        </Text>

        <ButtonsBox>
          <Buttons>
            <Tooltip text={`${Emoji.SUN} Coming soon !`}>
              <Icon
                alt={`Toggle ${store.theme} mode`}
                src={`./${store.theme}-theme-icon.webp`}
                onClick$={toggleTheme}
                style={{ cursor: 'default', pointerEvents: 'none' }}
              />
            </Tooltip>
            <Anchor
              href={githubUrl}
              target='_blank'
            >
              <Icon
                alt='GitHub logo'
                src='./github.svg'
              />
            </Anchor>
          </Buttons>
        </ButtonsBox>
      </Content>
    </Header>
  );
});
