import { useEffect, useState } from "react";

const DRAFT_KEY = "posDrafts";

const load = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export function usePOSDrafts() {
  const [drafts, setDrafts] = useState(load);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  }, [drafts]);

  const saveDraft = (draft) => {
    setDrafts((prev) => [draft, ...prev].slice(0, 50));
  };

  const deleteDraft = (id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  return { drafts, saveDraft, deleteDraft };
}
