import { useContext } from "react";
import {
  StagePresentationContext,
  sectionGroup,
  sectionIntent,
} from "../c/stagePresentation";
import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import { Activity, type LucideIcon } from "lucide-react";
export function FormPanel({
  title,
  icon: Icon = Activity,
  extra,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const presentation = useContext(StagePresentationContext);
  const group = sectionGroup(title);
  return (
    <section
      className={`wf-panel b-form-panel c-form-panel c-group-${group}`}
      data-mode={presentation.mode}
    >
      <div className="wf-panel-head">
        <h3>
          <span className="b-panel-symbol">
            <Icon size={18} />
          </span>
          {title}
        </h3>
        <div className="c-panel-context">
          <span className="c-panel-intent">
            {sectionIntent(presentation.mode, group)}
          </span>
          {extra}
        </div>
      </div>
      <div className="wf-body">{children}</div>
    </section>
  );
}
export function FormField({
  label,
  children,
  full = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  const generated = useId();
  const native =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  const control = native
    ? (children as ReactElement<{ id?: string }>)
    : undefined;
  const id = control?.props.id || generated;
  return (
    <div className={`wf-field b-field ${full ? "full" : ""}`}>
      <label htmlFor={native ? id : undefined}>{label}</label>
      {control ? cloneElement(control, { id }) : children}
    </div>
  );
}
