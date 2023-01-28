import { createThemeContract } from '@vanilla-extract/css';

export const Themes = {
  DARK: 'dark',
  LIGHT: 'light',
}

const vars = createThemeContract({
  mode: null,
});

export default vars;
