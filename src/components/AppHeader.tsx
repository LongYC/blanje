import type { UserData } from "../data";
import styles from "./AppHeader.module.css";
import { Button } from "./Button";
import { FileLoader } from "./FileLoader";

interface AppHeaderProps {
  onLoadedNewFile: (newUserData: UserData, newFilename: string) => void;
  hasExistingData: boolean;
  onDownload: () => void;
}

export function AppHeader({
  onLoadedNewFile,
  hasExistingData,
  onDownload
}: AppHeaderProps) {
  return <div className={styles.header}>
    <h1>Blanje</h1>
    <p>Monthly expenses in a JSON.</p>
    <div className={styles.controls}>
      <FileLoader onLoaded={onLoadedNewFile} hasExistingData={hasExistingData} />
      <Button label="Save to a JSON" onClick={onDownload} variant="main" disabled={!hasExistingData} />
    </div>
  </div>;
}
