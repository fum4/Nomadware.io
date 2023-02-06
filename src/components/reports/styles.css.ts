import { styled, style } from 'styled-vanilla-extract/qwik';
import { keyframes } from '@vanilla-extract/css';
import { Breakpoints } from '~/constants';

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

const fadeInAnimation = keyframes({
  '0%': {
    opacity: 0,
  },
  '100%': {
    opacity: 1,
  }
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
});

export const backgroundCircleClass = style({
  stroke: '#063040',
  strokeWidth: '1em',
});

export const foregroundCircleClass = style({
  transition: 'stroke-dashoffset',
  transitionDuration: '3.3s',
  transitionDelay: '0s',
  transitionTimingFunction: 'ease-out',
  stroke: '#20a6d6',
  strokeWidth: 2,
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

const baseMetrics = style({
  display: 'flex',
  gap: 10,

  '@media': {
    [`screen and (max-width: ${Breakpoints.SM}px)`]: {
      display: 'grid',
      gridTemplateColumns: '100px 100px',
    }
  },
});

export const PrimaryMetrics = styled.div([ baseMetrics, {
  '@media': {
    [`screen and (max-width: ${Breakpoints.SM}px)`]: {
      gridTemplateRows: '100px 100px',
    }
  },
}]);

export const SecondaryMetrics = styled.div([ baseMetrics, {
  '@media': {
    [`screen and (max-width: ${Breakpoints.SM}px)`]: {
      gridTemplateRows: '60px 60px',
    }
  },
}]);

export const Metric = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  width: 100,
});

export const Circle = styled.div({
  position: 'relative',
  height: 70,
  width: 70,
});

export const MetricText = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
});

export const DisplayScore = styled.p({
  fontSize: 14,
});

export const DisplayValue = styled.p({
  animation: `${fadeInAnimation} 1s linear forwards`,
  color: '#20a6d6',
  fontSize: 22,
});

export const DisplayValuePlaceholder = styled.p({
  fontSize: 22,
});

export const PrimaryMetricTitle = styled.p({
  fontSize: 15,
});

export const SecondaryMetricTitle = styled.p({
  fontSize: 14,
});

export const LoadingText = styled.p({
  marginTop: 50,
  fontSize: 14,
  fontWeight: 100,

  '@media': {
    [`screen and (max-width: ${Breakpoints.SM}px)`]: {
      marginTop: 0,
    }
  },
});
