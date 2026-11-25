// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { RoleEntryScreen } from "../components/app/RoleEntryScreen";
import { Feedback, LoadingState } from "./Feedback";
import { unavailableAuth } from "../auth/adapter";
afterEach(cleanup);
describe("Paket A presentation boundaries", () => {
  it("unconfigured auth never accepts credentials", async () => {
    expect(unavailableAuth.available).toBe(false);
    await expect(
      unavailableAuth.signIn({ username: "user", password: "secret" }),
    ).rejects.toThrow("Login belum tersedia");
  });
  it("entry has one unavailable login, visible labels and password visibility", () => {
    const enter = vi.fn();
    render(<RoleEntryScreen currentRole="Admin" onEnter={enter} />);
    expect(
      (screen.getByRole("button", { name: /^Masuk$/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("Nama pengguna"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Kata sandi"), {
      target: { value: "secret" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Tampilkan kata sandi" }),
    );
    expect(screen.getByLabelText("Kata sandi").getAttribute("type")).toBe(
      "text",
    );
    expect(enter).not.toHaveBeenCalled();
  });
  it("403 explains scope and offers working return", () => {
    const back = vi.fn();
    render(
      <Feedback
        kind="forbidden"
        title="Akses dibatasi"
        description="Peran tidak berwenang"
        onBack={back}
      />,
    );
    expect(screen.getByTestId("state-forbidden")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Kembali ke beranda" }));
    expect(back).toHaveBeenCalledOnce();
  });
  it("404 is distinct from permission denial", () => {
    render(
      <Feedback
        kind="not-found"
        title="Alamat tidak ditemukan"
        description="Periksa alamat"
      />,
    );
    expect(screen.getByTestId("state-not-found")).toBeTruthy();
    expect(screen.queryByTestId("state-forbidden")).toBeNull();
  });
  it("empty state does not fabricate actions or counts", () => {
    render(
      <Feedback
        kind="empty"
        title="Belum ada paket"
        description="Paket akan tampil sesuai penugasan"
      />,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
  it("error is announced; loading is announced separately", () => {
    const { unmount } = render(
      <Feedback kind="error" title="Gagal memuat" description="Coba kembali" />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    unmount();
    render(<LoadingState />);
    expect(screen.getByRole("status").getAttribute("aria-label")).toBe(
      "Memuat ruang kerja",
    );
  });
});
