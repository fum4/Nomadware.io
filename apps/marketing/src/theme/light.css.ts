import { createTheme } from '@vanilla-extract/css';

import vars from './index.css';

const lightTheme = createTheme(vars, {
  mode: 'dark',
});

export default lightTheme;
