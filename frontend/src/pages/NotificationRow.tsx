import type { ReactNode } from "react";
import {
  Bell,
  ClipboardList,
  CalendarClock,
  CheckCheck,
  ArrowUpRight,
} from "lucide-react";
export type RowTone = "action" | "warning" | "info" | "success";
type Props = {
  title: string;
  subtitle: string;
  meta: string;
  category: string;
  tone: RowTone;
  unread?: boolean;
  preview?: boolean;
  onView?: () => void;
  onAct?: () => void;
  onRead?: () => void;
  actionLabel?: string;
  details?: ReactNode;
};
export default function NotificationRow({
  title,
  subtitle,
  meta,
  category,
  tone,
  unread,
  preview,
  onView,
  onAct,
  onRead,
  details,
  actionLabel = "Tindak",
}: Props) {
  const Icon =
    tone === "warning"
      ? CalendarClock
      : tone === "action"
        ? ClipboardList
        : tone === "success"
          ? CheckCheck
          : Bell;
  return (
    <article
      className={`notif-row b-notification-record notif-row-${tone} ${unread ? "notif-row-unread" : ""}`}
    >
      <span className="notif-row-symbol">
        <Icon size={22} aria-hidden="true" />
      </span>
      <div className="notif-row-body">
        <div className="b-notif-meta">
          <span className={`notif-row-pill notif-row-pill-${tone}`}>
            {category}
          </span>
          {unread && (
            <span className="b-unread-label">
              <i />
              Belum dibaca
            </span>
          )}
        </div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <small>{meta}</small>
        {details}
      </div>
      <div className="notif-row-actions">
        <button
          type="button"
          className="notif-outline-btn"
          disabled={preview || !onView}
          onClick={onView}
        >
          Lihat
          <ArrowUpRight size={14} />
        </button>
        {onAct && (
          <button
            type="button"
            className="notif-primary-btn"
            disabled={preview}
            onClick={onAct}
          >
            {actionLabel}
          </button>
        )}
        {unread && !preview && onRead && (
          <button type="button" className="notif-row-read" onClick={onRead}>
            <CheckCheck size={13} />
            Tandai dibaca
          </button>
        )}
      </div>
    </article>
  );
}
