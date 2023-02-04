import { styled } from 'styled-vanilla-extract/qwik';

export const Footer = styled.footer({
  padding: 15,
  textAlign: 'center',
  fontSize: '.8em',
  margin: 'auto',
  marginTop: 60,
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
