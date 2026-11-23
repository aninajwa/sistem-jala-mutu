import { useEffect } from "react";
/** Enhance presentation from actual table headers, never from invented schema labels. */
export function useResponsiveTables() {
  useEffect(() => {
    const update = () => {
      for (const table of document.querySelectorAll<HTMLTableElement>(
        ".b-master-workspace table,.b-admin-workspace table,.cm-workspace table",
      )) {
        const headings = [
          ...table.querySelectorAll("thead tr:first-child th"),
        ].map((th) => th.textContent?.trim() || "");
        if (!headings.length) continue;
        table.classList.add("b-responsive-table");
        table.setAttribute("role", "table");
        for (const row of table.querySelectorAll<HTMLTableRowElement>(
          "tbody tr",
        )) {
          row.setAttribute("role", "row");
          [...row.cells].forEach((cell, i) => {
            cell.dataset.label = headings[i] || "";
            cell.setAttribute(
              "role",
              cell.tagName === "TH" ? "rowheader" : "cell",
            );
          });
        }
      }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}
