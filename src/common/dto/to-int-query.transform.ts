import { Transform } from 'class-transformer';

// Convierte a número solo strings decimales puros ("5", "12").
// Cualquier otra entrada ("1e2", "0x10", " 7", "", arrays) queda intacta
// para que @IsInt() la rechace con 400.
export function ToIntQuery(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value,
  );
}
