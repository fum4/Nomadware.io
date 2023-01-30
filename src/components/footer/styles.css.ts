import { styled } from 'styled-vanilla-extract/qwik';

export const Footer = styled.footer({
  position: 'fixed',
  bottom: 0,
  padding: 15,
  textAlign: 'center',
  fontSize: '.8em',
  margin: 'auto',
});

export const BuiltWith = styled.div({
  color: '#90a4bb',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  cursor: 'default'
});

export const Anchor = styled.a({
  height: 30,
});
