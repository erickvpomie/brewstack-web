import { useId, type ComponentProps } from 'react';
import { Button, Input } from '@heroui/react';
import { FiMinus, FiPlus } from 'react-icons/fi';

type Props = Omit<ComponentProps<typeof Input>, 'type' | 'step' | 'value' | 'onChange' | 'min'> & {
  value: string | number;
  onValueChange: (value: string) => void;
  min?: number;
  'aria-label': string;
};

export function NumberInput({ value, onValueChange, min = 0, ...props }: Props) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const changeBy = (amount: number) => {
    const current = Number(value);
    if (!Number.isFinite(current)) return;
    onValueChange(String(Math.max(min, Number((current + amount).toFixed(10)))));
  };
  return (
    <div className="brew-number-input">
      <Input
        {...props}
        id={id}
        type="number"
        min={min}
        step="any"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);
          if (
            !event.defaultPrevented &&
            !props.readOnly &&
            (event.key === 'ArrowUp' || event.key === 'ArrowDown')
          ) {
            event.preventDefault();
            changeBy(event.key === 'ArrowUp' ? 1 : -1);
          }
        }}
      />
      <Button
        type="button"
        variant="secondary"
        isIconOnly
        aria-label={`Disminuir ${props['aria-label'].toLowerCase()}`}
        aria-controls={id}
        isDisabled={props.disabled || props.readOnly || Number(value) <= min}
        onPress={() => changeBy(-1)}
      >
        <FiMinus aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        isIconOnly
        aria-label={`Aumentar ${props['aria-label'].toLowerCase()}`}
        aria-controls={id}
        isDisabled={props.disabled || props.readOnly}
        onPress={() => changeBy(1)}
      >
        <FiPlus aria-hidden="true" />
      </Button>
    </div>
  );
}
