import { styled, style } from 'styled-vanilla-extract/qwik';
import { keyframes } from '@vanilla-extract/css';

const fadeInAnimation = keyframes({
  '100%': {
    opacity: 1,
  }
});

const slideInAnimation = keyframes({
  '100%': {
    opacity: 1,
    marginLeft: 0,
  }
});

export const slideInClass = style({
  opacity: 0,
  marginLeft: -100,
  animation: `${slideInAnimation} 3s`,
  animationDelay: '5.5s',
  animationFillMode: 'forwards',
});

export const fadeInClass = style({
  opacity: 0,
  animation: `${fadeInAnimation} 3s`,
  animationDelay: '4s',
  animationFillMode: 'forwards',
});

export const fadeInEagerClass = style({
  opacity: 0,
  animation: `${fadeInAnimation} 3s`,
  animationDelay: '0s',
  animationFillMode: 'forwards',
});

export const fadeInLateClass = style({
  opacity: 0,
  animation: `${fadeInAnimation} 3s`,
  animationDelay: '9s',
  animationFillMode: 'forwards',
});

export const Root = styled.div({
  position: 'absolute',
  top: 600,
  display: 'flex',
  flexDirection: 'column',

  '@media': {
    'screen and (min-width: 540px)': {
      width: '100%',
    }
  },
});

export const H1 = styled.h1({
  marginTop: 0,
  color: '#90a4bb',
  fontWeight: 100,
});

export const H2 = styled.h2({
  color: '#90a4bb',
  fontWeight: 300,
  fontSize: 19,
});

export const TextBox = styled.div( {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 15,

  '@media': {
    'screen and (max-width: 870px)': {
      flexDirection: 'column',
      gap: 0,
    }
  }
});

export const ReportsBox = styled.div({
  margin: 'auto',
});
