import { Slot, useStore, component$ } from '@builder.io/qwik';

import { Root, Tooltip } from './styles.css';

interface TooltipProps {
  text: string;
  disabled?: boolean;
}

export default component$(({ text, disabled = false }: TooltipProps) => {
  const store = useStore({
    showTooltip: false,
  });

  return (
    <Root
      onMouseEnter$={() => !disabled && (store.showTooltip = true)}
      onMouseLeave$={() => store.showTooltip = false}
    >
      <Slot />
      {store.showTooltip && (
        <Tooltip onMouseEnter$={() => store.showTooltip = false}>
          {text}
        </Tooltip>
      )}
    </Root>
  );
});
