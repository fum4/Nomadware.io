import { styled, style } from 'styled-vanilla-extract/qwik';
import { keyframes } from '@vanilla-extract/css';
import { Breakpoints } from '~/constants';

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
  display: 'flex',
  flexDirection: 'column',
  padding: '85px 0',
  width: '100%',

  '@media': {
    [`screen and (max-width: ${Breakpoints.SM}px)`]: {
      padding: '40px 0',
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

export const Logo = styled.img({
  height: 25,
  width: 25,
  borderRadius: '50%',
  border: '1px solid #90a4bb',
});

export const LogoBox = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

export const TextBox = styled.div( {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 15,

  '@media': {
    [`screen and (max-width: ${Breakpoints.SM}px)`]: {
      flexDirection: 'column',
      gap: 0,
    }
  }
});

export const ReportsBox = styled.div({
  margin: 'auto',
});
