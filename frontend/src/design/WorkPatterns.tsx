import { ArrowRight, CircleAlert } from "lucide-react";
export function TaskRow({
  eyebrow,
  title,
  description,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="jm-task-row">
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <button className="wf-button primary" onClick={onAction}>
        {action}
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
export function BlockerSummary({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="jm-auth-note" role="status">
      <CircleAlert size={18} />
      <span>
        <strong>{title}</strong>
        {children}
      </span>
    </div>
  );
}
