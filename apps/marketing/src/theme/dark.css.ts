import { createTheme } from '@vanilla-extract/css';

import vars from './index.css';

const darkTheme = createTheme(vars, {
  mode: 'dark',
});

export default darkTheme;
