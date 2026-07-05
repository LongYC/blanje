import styles from "./AppHeader.module.css";

export function AppHeader() {
  return <header className={styles.header}>
    <h1>Blanje</h1>
    <p className={styles.tagline}>Monthly expenses in a JSON file.</p>
  </header>;
}
