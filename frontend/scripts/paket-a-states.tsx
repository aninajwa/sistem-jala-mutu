/** Development-only visual fixture. Not an application route or production entry. */
import { createRoot } from "react-dom/client";
import { Feedback, LoadingState } from "../src/design/Feedback";
import "../src/index.css";
import "../src/workflow/operational.css";
import "../src/design/paket-a.css";
const kind = new URLSearchParams(location.search).get("state");
if (import.meta.env.DEV)
  createRoot(document.getElementById("root")!).render(
    <main style={{ padding: 24, background: "#f5f7f8", minHeight: "100vh" }}>
      {kind === "loading" ? (
        <LoadingState />
      ) : kind === "error" ? (
        <Feedback
          kind="error"
          title="Ruang kerja belum dapat dimuat"
          description="Coba kembali. Data yang tersimpan tetap tersedia."
          actionLabel="Coba kembali"
          onBack={() => location.reload()}
        />
      ) : (
        <Feedback
          kind="empty"
          title="Belum ada paket dalam penugasan"
          description="Paket akan tampil setelah penugasan tersedia. Hubungi pengelola untuk memeriksa cakupan akun."
        />
      )}
    </main>,
  );
