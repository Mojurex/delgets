import { useCountUp } from '../app/hooks';
import { plain, signed } from '../lib/format';

/** Count-up хийдэг тоо. `mode` = 'signed' бол +/− тэмдэгтэй */
export function Score({ value, mode = 'plain', className }: { value: number; mode?: 'plain' | 'signed'; className?: string }) {
  const shown = useCountUp(Math.round(value));
  return <span className={className}>{mode === 'signed' ? signed(shown) : plain(shown)}</span>;
}
