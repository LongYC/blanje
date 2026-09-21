import { useRef } from "react";
import type { UserData } from "../data";
import styles from "./AppHeader.module.css";
import { Button } from "./Button";
import { FileLoader } from "./FileLoader";

interface AppHeaderProps {
  onLoadedNewFile: (newUserData: UserData, newFilename: string) => void;
  lastLoadedFilename: string | null;
  onDownload: () => void;
}

export function AppHeader({
  onLoadedNewFile,
  lastLoadedFilename,
  onDownload
}: AppHeaderProps) {
  const hasExistingData = Boolean(lastLoadedFilename);
  const popoverRef = useRef<HTMLDivElement>(null);
  const onLoadedNewFileClosePopover = (data: UserData, filename: string) => {
    onLoadedNewFile(data, filename);
    if (popoverRef.current) {
      popoverRef.current.hidePopover();
    }
  };
 
  return <div className={styles.header}>
    <h1>Blanje</h1>
    <p>Monthly expenses in a JSON.</p>
    <button popoverTarget="app-menu-popover" aria-label="Toggle menu" title="Toggle menu" className={styles.menu}>
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div id="app-menu-popover" popover="auto" ref={popoverRef} className={styles.popover}>
      {
        hasExistingData
          ? <>
              <Button label="Save to a JSON" variant="main"  onClick={onDownload} />
              <details className={styles.advanced}>
                <summary>Advanced options</summary>
                <div className={styles.expandable}>
                  <FileLoader
                      label="Override with a JSON"
                      buttonVariant="danger"
                      onLoaded={onLoadedNewFileClosePopover}
                    />
                  <span className={styles.file}>
                    Last loaded from: <span className={styles.filename}>{lastLoadedFilename}</span>
                  </span>
                </div>
              </details>
            </>
          : <FileLoader
              label="Load a JSON"
              buttonVariant="main"
              onLoaded={onLoadedNewFileClosePopover}
            />
      }
    </div>
  </div>;
}
