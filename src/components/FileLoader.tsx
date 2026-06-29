import { useRef, useState } from "react";
import { parseSpendingsJson, ValidationError } from "../parse";
import type { UserData } from "../types";
import { Button } from "./Button";
import styles from "./FileLoader.module.css";

interface FileLoaderProps {
  onLoaded: (data: UserData, filename: string) => void;
  hasExistingData?: boolean;
}

export function FileLoader({ onLoaded, hasExistingData = false }: FileLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const data = parseSpendingsJson(text);
      onLoaded(data, file.name);
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      } else {
        setError(`Could not read file: ${(err as Error).message}`);
      }
    }
  }

  return (
    <div className={styles.loader}>
      {error && (
        <p className={styles.error} role="alert">
          {`Failed to load JSON file: ${error}`}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className={styles.hidden}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          // Reset so re-selecting the same file fires change again.
          e.target.value = "";
        }}
      />
      <Button label="Load JSON file" onClick={() => inputRef.current?.click()} variant={hasExistingData ? "danger" : "main"} />
    </div>
  );
}
