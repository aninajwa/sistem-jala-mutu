
$ErrorActionPreference = "Stop"

$folder = "src\workflow"
$renderer = Join-Path $folder "Stage3BSourceChecklist.tsx"
$uploader = Join-Path $folder "Stage3BFileEvidence.tsx"

if (!(Test-Path $renderer) -or !(Test-Path $uploader)) {
    throw "File Tahap 3B tidak ditemukan. Jalankan dari root sistem-jala-mutu."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $renderer "$renderer.backup-$stamp"
Copy-Item $uploader "$uploader.backup-$stamp"

$text = Get-Content $renderer -Raw

# 1. Kolom foto/gambar menjadi upload, bukan input teks
$old = @'
                    const editableCell = isPlaceholder(cell);
'@
$new = @'
                    const editableCell = isPlaceholder(cell);
                    const columnName = columns[columnIndex] ?? '';
                    const isPhotoColumn =
                      /foto|tangkapan layar|screenshot|gambar|dokumentasi visual/i.test(columnName);
                    const rowDescription = row.slice(0, 2).join(' ');
                    const requiresEvidence =
                      /dokumentasi|foto|video|log harian|berita acara|bukti rekaman/i.test(rowDescription);
                    const isNoteColumn =
                      /keterangan|catatan/i.test(columnName);
'@

if (!$text.Contains($old)) {
    throw "STOP: struktur tabel tidak cocok dengan patch."
}
$text = $text.Replace($old, $new)

# 2. Prioritaskan komponen upload pada kolom foto
$old = @'
{hasStatusChoice && statusLabel && /^[□☐\s]*$/.test(cell) ? (
'@
$new = @'
{isPhotoColumn && editableCell ? (
                          <Stage3BFileEvidence
                            packageId={packageId}
                            evidenceId={`${template.id}:${item.code}:photo:${rowIndex}:${columnIndex}`}
                            label={`Bukti foto baris ${rowIndex + 1}`}
                            editable={canEdit}
                          />
                        ) : hasStatusChoice && statusLabel && /^[□☐\s]*$/.test(cell) ? (
'@

if (!$text.Contains($old)) {
    throw "STOP: pilihan status tabel tidak ditemukan."
}
$text = $text.Replace($old, $new)

# 3. Tambahkan bukti pada keterangan item dokumentasi
$old = @'
                        ) : editableCell ? (
                          <input
                            type="text"
                            value={answers[cellKey] ?? ''}
                            disabled={!canEdit}
                            placeholder="Isi"
                            aria-label={
                              `Baris ${rowIndex + 1}, ` +
                              `kolom ${columnIndex + 1}`
                            }
                            onChange={event =>
                              update(
                                cellKey,
                                event.target.value,
                              )
                            }
                          />
                        ) : (
'@

$new = @'
                        ) : editableCell ? (
                          <div className="s3doc-cell-content">
                            <input
                              type="text"
                              value={answers[cellKey] ?? ''}
                              disabled={!canEdit}
                              placeholder={isNoteColumn ? "Catatan pemeriksaan" : "Isi"}
                              aria-label={`Baris ${rowIndex + 1}, kolom ${columnIndex + 1}`}
                              onChange={event => update(cellKey, event.target.value)}
                            />
                            {isNoteColumn && requiresEvidence && (
                              <Stage3BFileEvidence
                                packageId={packageId}
                                evidenceId={`${template.id}:${item.code}:row:${rowIndex}`}
                                label={`Bukti: ${rowDescription}`}
                                editable={canEdit}
                              />
                            )}
                          </div>
                        ) : (
'@

if (!$text.Contains($old)) {
    throw "STOP: input tabel lama tidak ditemukan."
}
$text = $text.Replace($old, $new)

# 4. Hindari judul lampiran yang berulang
$old = @'
{item.inputType !== 'JSON' &&
                      !isDocumentDecoration(item.label) && (
'@
$new = @'
{item.inputType !== 'JSON' &&
                      !isDocumentDecoration(item.label) &&
                      !isAttachmentSection(item.section) && (
'@

if (!$text.Contains($old)) {
    throw "STOP: label renderer tidak ditemukan."
}
$text = $text.Replace($old, $new)

Set-Content $renderer $text -Encoding UTF8

Write-Host "Renderer Tahap 3B diperbarui." -ForegroundColor Green
Write-Host "Backup dibuat dengan waktu: $stamp"
