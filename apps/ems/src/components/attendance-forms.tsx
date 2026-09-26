"use client";

/** Sets every status select in the register form to Present, without saving. */
export function MarkAllPresent() {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={(e) => {
        const form = e.currentTarget.closest("form");
        if (!form) return;
        for (const el of form.querySelectorAll<HTMLSelectElement>("select[name^='st_']")) {
          el.value = "PRESENT";
        }
      }}
    >
      Mark all present
    </button>
  );
}
