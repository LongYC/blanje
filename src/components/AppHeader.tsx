import { useRef, useState } from "react";
import type { UserData } from "../data";
import styles from "./AppHeader.module.css";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { FileLoader } from "./FileLoader";

interface AppHeaderProps {
  onLoadedNewFile: (newUserData: UserData, newFilename: string) => void;
  lastLoadedFilename: string | null;
  onDownload: () => void;
  onClear: () => void;
}

export function AppHeader({
  onLoadedNewFile,
  lastLoadedFilename,
  onDownload,
  onClear,
}: AppHeaderProps) {
  const hasExistingData = Boolean(lastLoadedFilename);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const onLoadedNewFileClosePopover = (data: UserData, filename: string) => {
    onLoadedNewFile(data, filename);
    if (popoverRef.current) {
      popoverRef.current.hidePopover();
    }
  };

  const handleConfirmClear = () => {
    onClear();
    setConfirmingClear(false);
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
                  <Button
                    label="Reset & delete data"
                    variant="muted"
                    onClick={() => setConfirmingClear(true)}
                  />
                  <span className={styles.file}>
                    Last loaded from: <span className={styles.filename}>{lastLoadedFilename}</span>
                  </span>
                </div>
              </details>
              <ConfirmDialog
                open={confirmingClear}
                title="Are you sure?"
                description="This permanently deletes all the data on this page, it cannot be undone."
                confirmLabel="Delete data"
                onConfirm={handleConfirmClear}
                cancelLabel="Keep data"
                onCancel={() => setConfirmingClear(false)}
              />
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
