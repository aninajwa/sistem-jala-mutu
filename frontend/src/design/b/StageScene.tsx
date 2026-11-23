import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { StagePresentationContext, stagePresentation } from "../c/stagePresentation";
import type { WorkflowRole } from "../../workflow/model";
import type { WorkflowStage } from "../../workflow/workflowGate";

export function StageScene({ children, role, stage }: {
  children: ReactNode;
  role: WorkflowRole;
  stage?: WorkflowStage;
}) {
  const presentation = stage
    ? stagePresentation(role, stage)
    : { mode: "monitor" as const, level: 1 as const };
  const content = useRef<HTMLDivElement>(null);
  const prefix = useId();
  const identifiers = useRef(new WeakMap<HTMLElement, string>());
  const counter = useRef(0);
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const main = content.current;
    if (!main || !stage) return;
    const collect = () => {
      const panels = [...main.querySelectorAll<HTMLElement>(".wf-panel")]
        .filter((panel) => !panel.parentElement?.closest(".wf-panel") && !panel.closest("[hidden]"));
      const next = panels.flatMap((panel) => {
        const title = panel.querySelector("h3,h2,h4,summary")?.textContent?.trim()
          || panel.getAttribute("aria-label");
        if (!title) return [];
        let id = panel.id || identifiers.current.get(panel);
        if (!id) {
          id = `stage-${prefix}-${++counter.current}`;
          identifiers.current.set(panel, id);
          panel.id = id;
        }
        return [{ id, title }];
      });
      setSections((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    collect();
    const observer = new MutationObserver(collect);
    observer.observe(main, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    return () => observer.disconnect();
  }, [prefix, stage]);

  const title = role === "Admin" ? "Administrasi tahap" : {
    prepare: "Ruang kerja Penyedia",
    review: "Meja pemeriksaan Balai",
    audit: `Audit tingkat ${presentation.level}`,
    monitor: "Hasil dan bukti",
  }[presentation.mode];

  return (
    <StagePresentationContext.Provider value={presentation}>
      <div className="v2-stage-scene" data-mode={presentation.mode}>
        {stage && !(["Tahap 0", "Tahap 1", "Tahap 3A"].includes(stage)) && (
          <div className="v2-stage-toolbar">
            <h2>{title}</h2>
            {sections.length > 1 && (
              <label>
                <span>Ke bagian</span>
                <select value="" onChange={(event) => {
                  const panel = document.getElementById(event.target.value);
                  if (!panel) return;
                  panel.tabIndex = -1;
                  panel.scrollIntoView({ block: "start" });
                  panel.focus({ preventScroll: true });
                }}>
                  <option value="">Pilih bagian</option>
                  {sections.map(({ id, title: sectionTitle }) => (
                    <option key={id} value={id}>{sectionTitle}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
        <div ref={content} className="v2-stage-body">{children}</div>
      </div>
    </StagePresentationContext.Provider>
  );
}
