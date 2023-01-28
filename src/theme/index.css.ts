import { createThemeContract } from '@vanilla-extract/css';

export const Themes: Record<'DARK' | 'LIGHT', 'dark' | 'light'> = {
  DARK: 'dark',
  LIGHT: 'light',
}

const vars = createThemeContract({
  mode: null,
});

export default vars;
