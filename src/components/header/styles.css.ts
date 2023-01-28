import { styled, style } from 'styled-vanilla-extract/qwik';

export const Header = styled.header({
  backgroundColor: 'rgba(0, 0, 0, .15)',
  height: 57,
  width: '100%',
  zIndex: 100,
  position: 'fixed',
  top: 0,
  left: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
})

export const Logo = styled.img({
  height: 37,
  width: 37,
  borderRadius: '50%',
});

export const link = style({
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 10,
  background: 'linear-gradient(to bottom, transparent 50%, #22192c 50%) top',
  backgroundSize: '100% 200%',
  transition: '.25s ease-out',

  '> h3': {
    opacity: .3,
  },

  ':hover': {
    backgroundPosition: 'bottom',

    '> h3': {
      opacity: 1,
    }
  }
});

export const Section = styled.div({
  marginRight: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 15,
});

export const Icon = styled.img({
  height: 25,
  width: 25,
  opacity: .3,

  ':hover': {
    opacity: 1,
    cursor: 'pointer',
  }
});

export const Anchor = styled.a({
  textDecoration: 'none',
});
