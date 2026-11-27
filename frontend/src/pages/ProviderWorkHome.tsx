import { useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import type { PageProps } from "../types";
import { dashboardWorkQueue, type QueuePriority } from "./dashboardWorkQueue";
import { correctionNextStep } from "../workflow/checkpoint09Corrections";
import { providerCaseTasks } from "./providerWorkTasks";
import "./providerWorkHome.css";
import { getNextWorkflowAction } from "../workflow/WorkflowNextAction";

export default function ProviderWorkHome({
  packages, openPackage, openPackageReview, onOpenCorrection, embedded = false,
}: PageProps & { onOpenCorrection: (packageId: string, correctionId: string) => void; embedded?: boolean }) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<QueuePriority | "cases" | "">("");
  const queue = dashboardWorkQueue(packages, "Penyedia Jasa / Ketua Tim");
  const matches = queue.filter(({ id, name, balai, priority: status }) =>
    (!priority || status === priority || (priority === "cases" && packages[id].corrections.some((entry) => entry.status !== "Ditutup")))
    && [name, balai, packages[id].project.contractNumber].join(" ").toLocaleLowerCase("id-ID")
      .includes(query.trim().toLocaleLowerCase("id-ID"))
  );
  const caseTasks = providerCaseTasks(packages);
  const ownTasks = caseTasks.filter((item) => item.owner === "provider");
  const action = queue.filter((item) => item.priority === "action").length;
  const waiting = queue.filter((item) => item.priority === "waiting").length;
  const cases = caseTasks.length;

  return (
    <div className="b-dashboard v2-work-home" data-testid={embedded ? "provider-work-queue" : "dashboard-work-queue"}>
      {!embedded && <header>
        <h1>Pekerjaan survei saya</h1>
        <p>Lihat pekerjaan dan pengajuan pada paket penugasan Anda.</p>
      </header>}
      {!embedded && <div className="v2-work-totals" aria-label="Ringkasan pekerjaan">
        <Link href="/packages"><strong>{queue.length}</strong>Paket saya</Link>
        <button type="button" aria-pressed={priority === "action"} onClick={() => setPriority(priority === "action" ? "" : "action")}>
          <strong>{action}</strong>Paket perlu tindakan
        </button>
        <button type="button" aria-pressed={priority === "waiting"} onClick={() => setPriority(priority === "waiting" ? "" : "waiting")}>
          <strong>{waiting}</strong>Paket menunggu pemeriksaan
        </button>
        <button type="button" aria-pressed={priority === "cases"} onClick={() => setPriority(priority === "cases" ? "" : "cases")}>
          <strong>{cases}</strong>Kasus belum ditutup
        </button>
      </div>}
      <section className="v2-work-cases" aria-labelledby="v2-work-cases-title" data-testid="provider-case-task-queue">
        <div className="v2-work-cases-header">
          <h2 id="v2-work-cases-title">Tindakan Perbaikan saya</h2>
          <Link href="/actions?tab=Tugas+Saya">Lihat semua kasus</Link>
        </div>
        {ownTasks.length ? (
          <ul className="v2-work-case-list">
            {ownTasks.slice(0, 5).map((task) => (
              <li className="v2-work-case" key={`${task.packageId}:${task.caseId}`}>
                <div>
                  <strong>{task.caseId} · {task.packageName}</strong>
                  <small>{task.survey} · {task.stage}{task.period != null ? ` · Periode ${task.period}` : ""} · {task.status}{task.dueDate ? ` · Tenggat ${task.dueDate}` : ""}</small>
                  <p>{task.nextAction}</p>
                </div>
                <button type="button" className="btn" onClick={() => onOpenCorrection(task.packageId, task.caseId)}>
                  Buka kasus <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="v2-work-empty">Tidak ada kasus yang memerlukan tindakan Anda saat ini.</p>}
      </section>
      <section className="v2-queue" aria-labelledby="v2-queue-title">
        <div className="v2-stage-toolbar">
          <h2 id="v2-queue-title">Antrean paket</h2>
          <label>
            <span>Cari paket</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nama, kontrak, atau Balai" />
          </label>
        </div>
        {!matches.length && (
          <p role="status">{queue.length ? "Tidak ada paket yang cocok dengan pencarian ini." : "Belum ada paket dalam penugasan Anda."}</p>
        )}
        <ul>
          {matches.map((item) => {
            const state = packages[item.id];
            const next = getNextWorkflowAction(state);
            const corrections = state.corrections.filter((entry) => entry.status !== "Ditutup");
            const relevant = corrections.filter((entry) => (correctionNextStep(entry).actor === "Penyedia Jasa / Ketua Tim") === (item.priority === "action"));
            const correction = relevant.length === 1 ? relevant[0] : corrections.length === 1 ? corrections[0] : undefined;
            const reviewTab = item.priority === "waiting" ? "Menunggu Verifikasi" : "Tugas Saya";
            return (
              <li key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.balai}{correction ? ` · ${correction.blockedStage}` : corrections.length ? "" : ` · ${next.stage}`}</p>
                  <span>{item.label}</span>
                  {correction && <p>{correction.id} · {correction.surveyType}{correction.cyclePeriod ? ` · Periode ${correction.cyclePeriod}` : ""}</p>}
                </div>
                {corrections.length > 1 && !correction ? (
                  <Link href={`/actions?${new URLSearchParams({ tab: reviewTab, package: item.id })}`} className="btn">Lihat kasus <ArrowUpRight size={16} aria-hidden="true" /></Link>
                ) : <button type="button" className="btn" onClick={() => {
                  if (correction) {
                    onOpenCorrection(item.id, correction.id);
                    return;
                  }
                  if (next.stage === "Selesai" || !next.selection) openPackage(item.id);
                  else openPackageReview(item.id, next.selection);
                }}>
                  {item.priority === "action" ? "Buka pekerjaan" : "Lihat paket"} <ArrowUpRight size={16} aria-hidden="true" />
                </button>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
