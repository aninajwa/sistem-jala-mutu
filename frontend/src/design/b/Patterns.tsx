import { type ReactNode } from "react";
import { ArrowRight, CircleDot, Layers3, type LucideIcon } from "lucide-react";
export function InfrastructureArt() {
  return (
    <svg
      className="b-infrastructure"
      viewBox="0 0 420 150"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M-20 160 170 95 230 115 450 30"
        stroke="#d0e5eb"
        strokeWidth="38"
      />
      <path
        d="M-20 160 170 95 230 115 450 30"
        stroke="#157b83"
        strokeWidth="25"
      />
      <path
        d="M-20 160 170 95 230 115 450 30"
        stroke="#f1cf76"
        strokeWidth="2"
        strokeDasharray="9 9"
      />
      <path
        d="M245 110V20l100 48v-53M245 20l50 67 50-19M245 45l100 48M245 70l100 48"
        stroke="#3d7284"
        strokeWidth="3"
      />
      <path d="M0 113 83 75l38 12 90-40M260 20l40-15 120 25" stroke="#a9cbd2" />
      <circle cx="170" cy="95" r="5" fill="#dfb75f" />
    </svg>
  );
}
export function WorkspaceHeading({
  eyebrow,
  title,
  description,
  action,
  art = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  art?: boolean;
}) {
  return (
    <header className={`b-heading ${art ? "has-art" : ""}`}>
      <div>
        <span className="b-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="b-heading-action">{action}</div>}
      {art && <InfrastructureArt />}
    </header>
  );
}
export function MetricTile({
  icon: Icon = Layers3,
  label,
  value,
  note,
  tone = "teal",
}: {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  note?: string;
  tone?: string;
}) {
  return (
    <article className={`b-metric tone-${tone}`}>
      <span className="b-metric-symbol">
        <Icon size={23} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>
    </article>
  );
}
export function WorkPanel({
  title,
  kicker,
  action,
  children,
  className = "",
}: {
  title: string;
  kicker?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`b-panel ${className}`}>
      <div className="b-panel-head">
        <div>
          {kicker && <small>{kicker}</small>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      <div className="b-panel-body">{children}</div>
    </section>
  );
}
export function StatePill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`b-state tone-${tone}`}>
      <CircleDot size={12} />
      {children}
    </span>
  );
}
export function WorkLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="b-text-action" onClick={onClick}>
      {children}
      <ArrowRight size={16} />
    </button>
  );
}
