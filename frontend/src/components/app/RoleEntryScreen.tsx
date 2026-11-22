import { BlockerSummary } from "../../design/WorkPatterns";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Route,
  ClipboardCheck,
  Settings,
  Building2,
  Layers3,
} from "lucide-react";
import { isRoleTestMode } from "../../workflow/access/packageAccess";
import type { WorkflowRole } from "../../workflow/model";
import { WORKFLOW_ROLE_OPTIONS } from "../../workflow/workflowConfig";
import { unavailableAuth, type AuthAdapter } from "../../auth/adapter";
const personas = [
  { name: "Penyedia", detail: "Persiapan, bukti & tindak lanjut", icon: Route },
  { name: "PIC Balai", detail: "Pemeriksaan & validasi", icon: ClipboardCheck },
  { name: "Direktorat", detail: "Audit & pengawasan mutu", icon: Building2 },
  { name: "Admin", detail: "Administrasi & akses", icon: Settings },
];
export function RoleEntryScreen({
  currentRole,
  onEnter,
  adapter = unavailableAuth,
}: {
  currentRole: WorkflowRole;
  onEnter: (role: WorkflowRole) => void;
  adapter?: AuthAdapter;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <main className="jm-entry">
      <section className="jm-entry-story" aria-label="Tentang JALA MUTU">
        <a
          className="jm-entry-brand"
          href="/"
          aria-label="JALA MUTU halaman masuk"
        >
          <img src={`${import.meta.env.BASE_URL}jala-mutu-mark.png`} alt="" />
          <span>
            JALA <b>MUTU</b>
            <small>SISTEM PENGENDALIAN MUTU</small>
          </span>
        </a>
        <div className="jm-story-copy">
          <span className="jm-eyebrow">
            <span />
            TERHUBUNG DALAM SATU ALUR
          </span>
          <h1>
            Jalan yang andal.
            <br />
            <em>
              Berawal dari data
              <br />
              {" "}yang bermutu.
            </em>
          </h1>
          <p>
            Ruang kerja pengendalian mutu survei jalan dan jembatan, dari
            persiapan hingga penerimaan data.
          </p>
        </div>
        <div className="jm-road-art" aria-hidden="true">
          <svg viewBox="0 0 680 270" fill="none">
            <defs>
              <linearGradient id="road" x1="100" y1="250" x2="600" y2="30">
                <stop stopColor="#194a5d" />
                <stop offset="1" stopColor="#326d77" />
              </linearGradient>
            </defs>
            <path
              d="M-50 240 210 110 360 180 730 5"
              stroke="#85b9b1"
              strokeWidth="1"
            />
            <path
              d="m-40 285 250-130 150 70L740 50"
              stroke="#85b9b1"
              strokeWidth="1"
            />
            <path
              d="M-50 262 210 132 360 202 730 27"
              stroke="url(#road)"
              strokeWidth="39"
            />
            <path
              d="M-50 262 210 132 360 202 730 27"
              stroke="#f9d17c"
              strokeWidth="2"
              strokeDasharray="12 12"
            />
            <path
              d="m415 157 0-110 108 60 0-108M415 47l108 60M415 78l108 60M415 110l108 60"
              stroke="#d0e6de"
              strokeWidth="3"
            />
            <path d="m415 47 54 84 54-24" stroke="#d0e6de" strokeWidth="1" />
            <circle cx="210" cy="132" r="7" fill="#e9b967" />
            <circle cx="360" cy="202" r="7" fill="#e9b967" />
            <circle cx="570" cy="103" r="7" fill="#e9b967" />
          </svg>
          <span className="jm-art-label">
            <Layers3 size={14} /> BUKTI · PEMERIKSAAN · KETERTELUSURAN
          </span>
        </div>
        <footer>
          <ShieldCheck size={16} />
          Satu alur QA/QC. Kewenangan tetap terjaga.
        </footer>
      </section>
      <section className="jm-entry-access" aria-label="Masuk ke JALA MUTU">
        <div className="jm-login-card">
          <span className="jm-eyebrow">SELAMAT DATANG</span>
          <h2>Masuk ke ruang kerja</h2>
          <p>Gunakan akun yang ditugaskan untuk mengakses pekerjaan Anda.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setMessage("");
              if (!adapter.available) {
                setMessage("Login belum tersedia pada lingkungan ini.");
                return;
              }
              setBusy(true);
              try {
                const form = new FormData(e.currentTarget);
                await adapter.signIn({
                  username: String(form.get("username")),
                  password: String(form.get("password")),
                });
                setMessage(
                  "Sesi diterima. Pengaitan identitas backend ke ruang kerja memerlukan integrasi.",
                );
              } catch {
                setMessage(
                  "Tidak dapat masuk. Periksa akun atau coba kembali.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="jm-username">Nama pengguna</label>
            <input
              id="jm-username"
              name="username"
              autoComplete="username"
              required
              placeholder="Nama pengguna Anda"
              disabled={busy}
            />
            <label htmlFor="jm-password">Kata sandi</label>
            <div className="jm-password">
              <input
                id="jm-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Masukkan kata sandi"
                disabled={busy}
              />
              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <BlockerSummary
              title={
                adapter.available
                  ? "Akses sesuai penugasan"
                  : "Login belum tersedia pada lingkungan ini."
              }
            >
              <br />
              {adapter.available
                ? "Gunakan identitas akun yang sah."
                : "Koneksi autentikasi sedang disiapkan."}
            </BlockerSummary>
            {message && (
              <p className="jm-form-message" role="alert">
                {message}
              </p>
            )}
            <button
              className="jm-signin"
              type="submit"
              disabled={!adapter.available || busy}
            >
              {busy ? "Menghubungkan…" : "Masuk"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="jm-role-caption">RUANG KERJA SESUAI KEWENANGAN</div>
          <div className="jm-personas">
            {personas.map(({ name, detail, icon: Icon }) => (
              <div key={name}>
                <Icon size={19} />
                <span>
                  <b>{name}</b>
                  <small>{detail}</small>
                </span>
              </div>
            ))}
          </div>
          {isRoleTestMode() && (
            <details
              className="jm-dev-access"
              open={
                new URLSearchParams(location.search).get("testRoles") === "1"
              }
            >
              <summary>Uji Peran · lingkungan pengembangan</summary>
              <p>
                Sesi simulasi lokal. Bukan autentikasi pengguna operasional.
              </p>
              <div>
                {WORKFLOW_ROLE_OPTIONS.map((role, i) => (
                  <button
                    key={role}
                    type="button"
                    aria-current={role === currentRole ? "true" : undefined}
                    onClick={() => onEnter(role)}
                    data-testid={`button-enter-role-${role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    {personas[i].name}
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
        <footer>JALA MUTU · Pengendalian mutu survei jalan & jembatan</footer>
      </section>
    </main>
  );
}
