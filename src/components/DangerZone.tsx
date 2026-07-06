import styles from "./DangerZone.module.css";
import { Button } from "./Button";

interface DangerZoneProps {
  filename: string;
  onClear: () => void;
}

export function DangerZone({ filename, onClear }: DangerZoneProps) {
  return (
    <section className={styles.danger}>
      <p className={styles.text}>
        Last loaded from: <span className={styles.filename}>{filename}</span>
      </p>
      <Button label="Clear all loaded data" onClick={onClear} variant="muted" />
    </section>
  );
}
