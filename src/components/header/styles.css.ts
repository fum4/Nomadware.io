import { styled, style } from 'styled-vanilla-extract/qwik';
import { styleVariants } from '@vanilla-extract/css';

export const Header = styled.header({
  backgroundColor: 'rgba(0, 0, 0, .15)',
  height: 57,
  width: '100%',
  zIndex: 100,
  position: 'fixed',
  top: 0,
  left: 0,
})

export const Content = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: 'auto',
  maxWidth: 1000,
});

export const LogoBox = styled.div({
  width: 85,

  // TODO: layout shift `fix` (not even working well)
  '@media': {
    'screen and (max-width: 870px)': {
      width: 80,
    }
  }
});

export const Logo = styled.img({
  height: 33,
  width: 33,
  borderRadius: '50%',
  border: '2px solid #90a4bb',
});

export const Text = styled.span({
  color: '#90a4bb',
  fontWeight: 100,
  display: 'flex',
  alignItems: 'center',

  ':hover': {
    cursor: 'default',
  }
});

export const Title = styled.h4({
  color: '#90a4bb',
  fontWeight: 300,
  margin: 0,
});

export const baseEmojiStyle = style({
  position: 'relative',
  width: 18,
  padding: 4,
  display: 'flex',
  justifyContent: 'center',

  ':hover': {
    cursor: 'grab',
  },
});

export const emoji = styleVariants({
  HEART: [baseEmojiStyle, {
    ':hover': {
      cursor: 'default',
    }
  }],
  COFFEE: [baseEmojiStyle, {
    ':hover': {
      cursor: 'grab',
    }
  }]
});

export const logoLink = style({
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 10,
  background: 'linear-gradient(to bottom, transparent 50%, #22192c 50%) top',
  backgroundSize: '100% 200%',
  transition: '.25s ease-out',
  width: 'fit-content',

  ':hover': {
    backgroundPosition: 'bottom',

    'img': {
      border: 'none',
    }
  }
});

export const textLink = style({
  textDecoration: 'none',
  marginLeft: 5,
  display: 'block',
  position: 'relative',
  padding: '0.3em 0',

  '::after': {
    opacity: 0,
    transform: 'scale(0)',
    transformOrigin: 'center',
    content: '',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '0.2em',
    backgroundColor: '#22192c',
    transition: 'opacity 300ms, transform 500ms',
  },

  selectors: {
    '&:hover::after': {
      transform: 'scale(1)',
      opacity: 1,
    }
  }
});

export const ButtonsBox = styled.div({
  padding: 10,
});

export const Buttons = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 15,
});

export const Icon = styled.img({
  height: 25,
  width: 25,
  opacity: .5,

  ':hover': {
    opacity: 1,
    cursor: 'pointer',
  }
});

export const Anchor = styled.a({
  textDecoration: 'none',
});
