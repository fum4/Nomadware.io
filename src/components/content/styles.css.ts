import { styled, style } from 'styled-vanilla-extract/qwik';
import { keyframes } from '@vanilla-extract/css';

const fadeIn = keyframes({
  '100%': {
    opacity: 1,
  }
});

const slideIn = keyframes({
  '100%': {
    opacity: 1,
    marginLeft: 0,
  }
});

export const slideInAnimation = style({
  opacity: 0,
  marginLeft: -100,
  animation: `${slideIn} 3s`,
  animationDelay: '5.5s',
  animationFillMode: 'forwards',
});

export const fadeInAnimation = style({
  opacity: 0,
  animation: `${fadeIn} 3s`,
  animationDelay: '4s',
  animationFillMode: 'forwards',
});

export const fadeInAnimationEager = style({
  opacity: 0,
  animation: `${fadeIn} 3s`,
  animationDelay: '2s',
  animationFillMode: 'forwards',
});

export const fadeInAnimationLate = style({
  opacity: 0,
  animation: `${fadeIn} 3s`,
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
