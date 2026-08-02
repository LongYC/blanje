import styles from "./DangerZone.module.css";
import { Button } from "./Button";

interface DangerZoneProps {
  onClear: () => void;
}

export function DangerZone({onClear}: DangerZoneProps) {
  return (
    <section className={styles.danger}>
      <Button label="Clear all loaded data" onClick={onClear} variant="muted" />
    </section>
  );
}
