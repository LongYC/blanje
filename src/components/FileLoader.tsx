import { useRef, useState } from "react";
import { parseSpendingsJson, ValidationError } from "../parse";
import type { SpendingsData } from "../types";

interface FileLoaderProps {
  onLoaded: (data: SpendingsData, filename: string) => void;
}

export function FileLoader({ onLoaded }: FileLoaderProps) {
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
    <div className="file-loader">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="visually-hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          // Reset so re-selecting the same file fires change again.
          e.target.value = "";
        }}
      />
      <button type="button" onClick={() => inputRef.current?.click()}>
        Load JSON file
      </button>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
