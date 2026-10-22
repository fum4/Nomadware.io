import { styled } from 'styled-vanilla-extract/qwik';

export const Root = styled.span({
  position: 'relative',
});

export const Tooltip = styled.span({
  backgroundColor: 'black',
  color: '#fff',
  width: 'max-content',
  textAlign: 'center',
  padding: '5px 10px',
  borderRadius: 10,
  position: 'absolute',
  zIndex: 1,
  fontSize: 12,
  top: 30,
  left: '-190%', // TODO
  fontWeight: 100,
});
