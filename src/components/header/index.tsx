import { component$, useClientEffect$, useStore, $ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { Themes } from '~/theme/index.css';

import {
  Header,
  Content,
  LogoBox,
  Logo,
  Text,
  Tooltip,
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
  showTooltip: boolean;
}

export default component$(() => {
  const githubUrl = 'https://github.com/fum4/Nomadware.io';
  const title = 'Nomadware.io';

  const Emoji = {
    HEART: '♡',
    COFFEE: '☕',
  };

  const store = useStore<HeaderState>({
    theme: Themes.DARK,
    emoji: 'HEART',
    drankCoffees: 0,
    showTooltip: false,
  });

  const toggleTheme = $(() => {
    store.theme = store.theme === Themes.LIGHT ? Themes.DARK : Themes.LIGHT;
    localStorage.setItem('theme', store.theme);
  });

  useClientEffect$(() => {
    const localStorageTheme = localStorage.getItem('theme') as Theme;
    const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    store.theme = localStorageTheme || (isDarkTheme ? Themes.DARK : Themes.LIGHT);
  });

  return (
    <Header>
      <Content>
        <LogoBox>
          <Link href='/' class={logoLink}>
            <Logo alt={`${title} logo`} src='./logo.webp' />
          </Link>
        </LogoBox>

        <Text
          onMouseEnter$={() => {
            if (store.drankCoffees < 3) {
              store.emoji = 'COFFEE';
            }
          }}
          onMouseLeave$={() => store.emoji = 'HEART'}
        >
          Made with

          <span
            onClick$={() => {
              if (store.emoji === 'COFFEE') {
                store.emoji = 'HEART';
                store.drankCoffees += 1;
              }
            }}
            onMouseEnter$={() => {
              if (store.drankCoffees >= 3) {
                store.showTooltip = true;
              }
            }}
            onMouseLeave$={() => store.showTooltip = false}
            class={emoji[store.emoji]}
          >
            {Emoji[store.emoji]}

            {store.showTooltip && (
              <Tooltip>
                A bit too much {Emoji.COFFEE} ?
              </Tooltip>
            )}
          </span>

          by

          <Link href='/' class={textLink}>
            <Title>{title}</Title>
          </Link>
        </Text>

        <ButtonsBox>
          <Buttons>
            <Icon
              alt={`Toggle ${store.theme} mode`}
              src={`./${store.theme}-theme-icon.webp`}
              onClick$={toggleTheme}
              style={{ cursor: 'default', pointerEvents: 'none' }}
            />
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
