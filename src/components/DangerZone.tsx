import styles from "./DangerZone.module.css";
import { Button } from "./Button";

interface DangerZoneProps {
  filename: string | null;
  onClear: () => void;
}

export function DangerZone({ filename, onClear }: DangerZoneProps) {
  return (
    <section className={styles.danger}>
      <div className={styles.text}>
        {filename && (
          <span className={styles.file}>
            Last loaded from <strong>{filename}</strong>
          </span>
        )}
      </div>
      <Button label="Clear all loaded data" onClick={onClear} variant="muted" />
    </section>
  );
}
