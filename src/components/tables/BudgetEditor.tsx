import { useEffect, useId, useRef, useState, type SubmitEvent } from "react";
import styles from "./BudgetEditor.module.css";

interface BudgetEditorProps {
  categoryName: string;
  budgetAmount?: string;
  onSave: (budget: string | null) => void;
  onDismiss: () => void;
}

export function BudgetEditor({ categoryName, budgetAmount, onSave, onDismiss }: BudgetEditorProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [budgetDraft, setBudgetDraft] = useState(budgetAmount ?? "");
  const [budgetError, setBudgetError] = useState("");
  const isEditingBudget = budgetAmount !== undefined;
  const hasBudgetChanges = budgetDraft.trim() !== (budgetAmount ?? "").trim();
  const normalizedDraft = budgetDraft.trim();
  const isValidBudgetDraft = /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalizedDraft)
    && Number.isFinite(Number(normalizedDraft));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (normalizedDraft === "") {
      if (!isEditingBudget) return;
      onSave(null);
      onDismiss();
      return;
    }

    if (!isValidBudgetDraft) {
      setBudgetError("Enter a nonnegative amount with up to 2 decimal places.");
      return;
    }

    if (isEditingBudget && !hasBudgetChanges) {
      onDismiss();
      return;
    }

    onSave(normalizedDraft);
    onDismiss();
  }

  return (
    <form className={styles.form} aria-label={`${categoryName} budget`} onSubmit={handleSubmit}>
      <label htmlFor={inputId}>Monthly budget</label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        autoComplete="off"
        data-1p-ignore
        data-bwignore
        inputMode="decimal"
        value={budgetDraft}
        aria-describedby={budgetError ? `${inputId}-error` : undefined}
        onChange={(event) => {
          setBudgetDraft(event.target.value);
          setBudgetError("");
        }}
      />
      <button
        type="submit"
        className={styles.submit}
        aria-disabled={(!isEditingBudget && normalizedDraft === "") || (normalizedDraft !== "" && !isValidBudgetDraft)}
      >
        {isEditingBudget ? (hasBudgetChanges ? "Update" : "Keep") : "Add"}
      </button>
      {isEditingBudget ? (
        <button
          type="button"
          className={styles.undo}
          aria-disabled={!hasBudgetChanges}
          aria-label="Undo"
          title="Undo"
          onClick={() => {
            if (!hasBudgetChanges) return;
            setBudgetDraft(budgetAmount ?? "");
            setBudgetError("");
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
        </button>
      ) : (
        <button
          type="button"
          className={styles.discard}
          aria-label="Discard"
          title="Discard"
          onClick={onDismiss}
        >×</button>
      )}
      {budgetError && <span id={`${inputId}-error`} className={styles.error} role="alert">{budgetError}</span>}
    </form>
  );
}
