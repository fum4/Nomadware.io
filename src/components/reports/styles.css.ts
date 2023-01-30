import { styled, style } from 'styled-vanilla-extract/qwik';
import { keyframes } from '@vanilla-extract/css';

const dotAnimation = keyframes({
  '0%': {
    opacity: 0,
  },
  '50%': {
    opacity: 0,
  },
  '100%': {
    opacity: 1,
  },
});

const fadeOutAnimation = keyframes({
  '0%': {
    opacity: 1,
  },
  '100%': {
    opacity: 0,
  }
});

export const fadeOutClass = style({
  WebkitAnimation: `${fadeOutAnimation} 1s linear forwards`,
  animation: `${fadeOutAnimation} 1s linear forwards`,
})

export const circleClass = style({
  stroke: '#063040',
  strokeWidth: '1em',
});

export const progressBarClass = style({
  transition: 'stroke-dashoffset 2.5s ease-out',
  stroke: '#20a6d6',
});

export const firstDotClass = style({
  opacity: 0,
  WebkitAnimation: `${dotAnimation} 2.3s infinite`,
  WebkitAnimationDelay: '0s',
  animation: `${dotAnimation} 2.3s infinite`,
  animationDelay: '0s',
});

export const secondDotClass = style({
  opacity: 0,
  WebkitAnimation: `${dotAnimation} 2.3s infinite`,
  WebkitAnimationDelay: '0.2s',
  animation: `${dotAnimation} 2.3s infinite`,
  animationDelay: '0.2s',
});

export const thirdDotClass = style({
  opacity: 0,
  WebkitAnimation: `${dotAnimation} 2.3s infinite`,
  WebkitAnimationDelay: '0.3s',
  animation: `${dotAnimation} 2.3s infinite`,
  animationDelay: '0.3s',
});

export const Report = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 30,
  color: '#90a4bb',
  fontWeight: 100,
});

export const Metrics = styled.div({
  display: 'flex',
  gap: 20,
});

export const Metric = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  width: 100,
});

export const Circle = styled.div({
  position: 'relative',
  height: 50,
  width: 50,
});

export const Score = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

export const ScoreText = styled.p({
  fontSize: 10,
});

export const LoadingText = styled.p({
  fontWeight: 100,
});
