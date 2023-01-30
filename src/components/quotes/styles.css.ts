import { styled, style } from 'styled-vanilla-extract/qwik';

export const Container = styled.div({
  position: 'relative',
  width: '100%',
  height: 500,
  display: 'flex',
  justifyContent: 'center'
})

const text = style({
  fontWeight: 100,
});

export const Text = styled.h1([ text, {
}]);

export const Author = styled.h3([ text, {
  margin: 0,
}]);

export const Quote = styled.div({
  position: 'absolute',
  top: 0,
  color: '#90a4bb',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
});
