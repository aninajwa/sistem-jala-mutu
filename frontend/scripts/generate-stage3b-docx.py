
import json
import re
import sys
import zipfile
from pathlib import Path
from collections import Counter
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

SURVEYS = {
    "PCI AI": ["pci ai", "pci berbasis ai"],
    "PCI Manual": ["pci manual"],
    "IRI": ["iri"],
    "Jembatan": ["jembatan"],
    "Lendutan": ["lendutan"],
    "Lereng": ["lereng"],
    "Drainase": ["drainase"],
    "Lalu Lintas": ["lalu lintas"],
    "RNI": ["rni"],
}

PHASES = {
    "consistency": ["konsistensi", "repeatability"],
    "internal": [
        "validasi internal",
        "verifikasi dan validasi internal",
        "verivikasi dan validasi internal",
    ],
    "periodic14": [
        "2 mingguan",
        "2-mingguan",
        "validasi 2",
    ],
}


def normalize(value):
    return re.sub(
        r"\s+", " ",
        str(value).lower().replace("_", " ").replace("-", " ")
    ).strip()


def get_text(element):
    return re.sub(
        r"\s+", " ",
        "".join(x.text or "" for x in element.iter(W + "t"))
    ).strip()


def read_docx(file):
    with zipfile.ZipFile(file) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))

    body = root.find(W + "body")
    if body is None:
        raise ValueError("Isi dokumen tidak ditemukan")

    blocks = []

    for element in body:
        if element.tag == W + "p":
            text = get_text(element)
            if text:
                blocks.append({
                    "kind": "paragraph",
                    "text": text,
                })

        elif element.tag == W + "tbl":
            rows = []

            for tr in element.findall(W + "tr"):
                cells = [
                    get_text(tc)
                    for tc in tr.findall(W + "tc")
                ]
                if any(cells):
                    rows.append(cells)

            if rows:
                blocks.append({
                    "kind": "table",
                    "rows": rows,
                })

    return blocks


def detect_survey(file):
    folder = normalize(file.parent)

    for survey, patterns in SURVEYS.items():
        if any(pattern in folder for pattern in patterns):
            return survey

    return None



def detect_phase(file):
    name = normalize(file.stem)
    survey = detect_survey(file)

    # Lalu Lintas: judul gabungan adalah dokumen
    # Verifikasi dan Validasi 2-Mingguan.
    if survey == "Lalu Lintas":
        if (
            "konsistensi" in name
            and "validasi 2 mingguan" in name
        ):
            return "periodic14"

    # Validasi internal dapat ditulis dengan
    # urutan kata yang berbeda.
    if (
        "internal" in name
        and (
            "validasi" in name
            or "verifikasi" in name
            or "verivikasi" in name
        )
    ):
        return "internal"

    if (
        "2 mingguan" in name
        or "2 minggu" in name
        or "validasi 2" in name
    ):
        return "periodic14"

    if "konsistensi" in name:
        return "consistency"

    return None

def is_heading(text):
    if len(text) > 110:
        return False

    return bool(re.match(
        r"^(?:BAGIAN\s+)?(?:[A-P]|[IVX]+|\d+(?:\.\d+)*)"
        r"[.\s:)]+[A-Z].{2,}$",
        text,
    ))


def create_item(block, section, number, survey, phase):
    code = (
        "DOCX_"
        + re.sub(r"\W+", "_", survey).upper()
        + "_"
        + phase.upper()
        + f"_{number:04d}"
    )

    base = {
        "code": code,
        "section": section,
        "options": [],
        "required": False,
        "order": number,
        "sourceOrder": number,
        "unit": "",
        "rule": {},
    }

    if block["kind"] == "table":
        rows = block["rows"]
        width = max(len(row) for row in rows)
        columns = rows[0] + [""] * (width - len(rows[0]))
        data = rows[1:]

        return {
            **base,
            "label": f"Tabel pemeriksaan: {section}",
            "inputType": "JSON",
            "checkType": "TABLE_INPUT",
            "metadata": {
                "table_columns": columns,
                "row_labels": [
                    row[0] if row else str(i + 1)
                    for i, row in enumerate(data)
                ],
                "source_rows": data,
                "table_rows": len(data),
                "needs_review": True,
            },
        }

    return {
        **base,
        "label": block["text"],
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
            "needs_review": True,
        },
    }


def main():
    if len(sys.argv) < 2:
        raise SystemExit(
            "Gunakan: py -3 frontend/scripts/"
            "generate-stage3b-docx.py PATH_FOLDER"
        )

    folder = Path(sys.argv[1])

    if not folder.is_dir():
        raise SystemExit(f"Folder tidak ditemukan: {folder}")

    project = Path(__file__).resolve().parents[2]
    output_dir = project / "frontend" / "src" / "workflow"

    documents = sorted(
        file for file in folder.rglob("*.docx")
        if not file.name.startswith("~$")
    )

    templates = []
    report = []
    coverage = Counter()

    for file in documents:
        survey = detect_survey(file)
        phase = detect_phase(file)

        if not survey:
            continue

        if not phase:
            if survey in ("IRI", "Lendutan") and (
                "kalibrasi" in normalize(file.stem)
                or "validasi" in normalize(file.stem)
            ):
                report.append({
                    "survey": survey,
                    "document": file.name,
                    "status": "PERLU PEMETAAN DOKUMEN GABUNGAN",
                })
            continue

        try:
            blocks = read_docx(file)
        except Exception as error:
            report.append({
                "survey": survey,
                "phase": phase,
                "document": file.name,
                "status": "GAGAL DIBACA",
                "error": str(error),
            })
            continue

        section = "Informasi dan Pemeriksaan"
        items = []
        sections = []
        table_count = 0

        for block in blocks:
            if (
                block["kind"] == "paragraph"
                and is_heading(block["text"])
            ):
                section = block["text"]
                sections.append(section)
                continue

            if block["kind"] == "table":
                table_count += 1

            items.append(
                create_item(
                    block,
                    section,
                    len(items) + 1,
                    survey,
                    phase,
                )
            )

        if not items:
            report.append({
                "survey": survey,
                "phase": phase,
                "document": file.name,
                "status": "TIDAK ADA ITEM TERBACA",
            })
            continue

        coverage[(survey, phase)] += 1

        template_id = (
            f"docx-{len(templates) + 1}-"
            f"{re.sub(r'[^a-z0-9]+', '-', survey.lower())}-"
            f"{phase}"
        )

        templates.append({
            "id": template_id,
            "survey": survey,
            "phase": phase,
            "items": items,
        })

        report.append({
            "survey": survey,
            "phase": phase,
            "document": file.name,
            "status": "BERHASIL DIEKSTRAK - PERLU REVIEW",
            "sections": sections,
            "items": len(items),
            "tables": table_count,
        })


    # ==============================================
    # PEMETAAN DOKUMEN GABUNGAN TAHAP 3B
    # IRI dan Lendutan — berdasarkan heading DOCX
    # ==============================================

    combined_mapping = [
        {
            "survey": "IRI",
            "filename": "CHECKLIST KALIBRASI DAN VALIDASI.docx",
            "phase": "consistency",
            "start": "B. CHECKLIST KONSISTENSI",
            "end": None,
        },
        {
            "survey": "Lendutan",
            "filename": "CHECKLIST KALIBRASI dan VALIDASI LENDUTAN.docx",
            "phase": "consistency",
            "start": "IV. PENGUKURAN KONSISTENSI (REPEATABILITY)",
            "end": "V. MONITORING KONDISI ALAT",
            "after": "BERITA ACARA VALIDASI BERJALAN",
        },
        {
            "survey": "Lendutan",
            "filename": "CHECKLIST KALIBRASI dan VALIDASI LENDUTAN.docx",
            "phase": "internal",
            "start": "BERITA ACARA AUDIT INTERNAL PENYEDIA JASA",
            "end": "III. AUDIT DOKUMEN MANAJEMEN MUTU",
        },
        {
            "survey": "Lendutan",
            "filename": "CHECKLIST KALIBRASI dan VALIDASI LENDUTAN.docx",
            "phase": "periodic14",
            "start": "BERITA ACARA VALIDASI BERJALAN",
            "end": "BERITA ACARA AUDIT INTERNAL PENYEDIA JASA",
        },
    ]


    def find_heading(blocks, heading, start_at=0):
        target = normalize(heading)

        for index in range(start_at, len(blocks)):
            block = blocks[index]

            if block["kind"] != "paragraph":
                continue

            text = normalize(block["text"])

            if text == target or text.startswith(target + " "):
                return index

        raise ValueError(
            f"Batas bagian tidak ditemukan: {heading}"
        )

    for mapping in combined_mapping:
        matches = [
            file for file in documents
            if file.name.lower() == mapping["filename"].lower()
            and detect_survey(file) == mapping["survey"]
        ]

        if len(matches) != 1:
            raise ValueError(
                f"Dokumen harus ditemukan tepat satu kali: "
                f"{mapping['filename']}. "
                f"Ditemukan: {len(matches)}"
            )

        file = matches[0]
        blocks = read_docx(file)

        start_at = 0

        if mapping.get("after"):
            start_at = find_heading(
                blocks,
                mapping["after"],
            ) + 1

        start = find_heading(
            blocks,
            mapping["start"],
            start_at,
        )


        if (
            mapping["survey"] == "Lendutan"
            and mapping["phase"] == "internal"
        ):
            # Ada dua bagian I. INFORMASI UMUM setelah
            # judul Audit Internal Penyedia:
            # pertama milik Penyedia, kedua milik audit berikutnya.
            headings = [
                index
                for index, block in enumerate(blocks)
                if index > start
                and block["kind"] == "paragraph"
                and normalize(block["text"]) == normalize(
                    "I. INFORMASI UMUM"
                )
            ]

            if len(headings) < 2:
                raise ValueError(
                    "Batas Audit Internal Lendutan tidak jelas."
                )

            end = headings[1]

            print(
                "BATAS AUDIT INTERNAL LENDUTAN:",
                start, "sampai sebelum", end
            )

        elif mapping["end"]:
            end = find_heading(
                blocks,
                mapping["end"],
                start + 1,
            )

        else:
            end = len(blocks)

        if end <= start:
            raise ValueError(
                f"Rentang tidak valid: "
                f"{mapping['survey']} / {mapping['phase']}"
            )

        section_name = mapping["start"]
        items = []

        for block in blocks[start:end]:
            if (
                block["kind"] == "paragraph"
                and is_heading(block["text"])
            ):
                section_name = block["text"]
                continue

            items.append(
                create_item(
                    block,
                    section_name,
                    len(items) + 1,
                    mapping["survey"],
                    mapping["phase"],
                )
            )

        if not items:
            raise ValueError(
                f"Tidak ada item: "
                f"{mapping['survey']} / {mapping['phase']}"
            )

        key = (
            mapping["survey"],
            mapping["phase"],
        )

        if coverage[key] > 0:
            raise ValueError(
                f"Template sudah ada, hindari duplikasi: {key}"
            )

        coverage[key] += 1

        templates.append({
            "id": (
                "docx-combined-"
                + mapping["survey"].lower()
                + "-"
                + mapping["phase"]
            ),
            "survey": mapping["survey"],
            "phase": mapping["phase"],
            "items": items,
        })

        report.append({
            "survey": mapping["survey"],
            "phase": mapping["phase"],
            "document": file.name,
            "status": "EKSTRAKSI BAGIAN GABUNGAN - PERLU REVIEW",
            "items": len(items),
            "block_start": start,
            "block_end": end,
        })

    missing = [
        f"{survey} / {phase}"
        for survey in SURVEYS
        for phase in PHASES
        if coverage[(survey, phase)] == 0
    ]

    output_dir.mkdir(parents=True, exist_ok=True)

    template_file = (
        output_dir / "stage3bChecklistData.docx-candidate.ts"
    )
    audit_file = output_dir / "stage3b-docx-audit.json"

    header = (
        "/* KANDIDAT HASIL EKSTRAKSI DOCX.\n"
        "   Belum boleh digunakan sebagai gate final.\n"
        "   Tipe jawaban dan struktur tabel perlu diperiksa. */\n"
        "import type { Stage3BTemplate } "
        "from './stage3bChecklistData.generated';\n\n"
        "export const STAGE3B_DOCX_CANDIDATES: "
        "Stage3BTemplate[] = "
    )

    template_file.write_text(
        header
        + json.dumps(templates, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )

    audit_file.write_text(
        json.dumps({
            "documents_scanned": len(documents),
            "templates_extracted": len(templates),
            "missing": missing,
            "documents": report,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("\n=== HASIL EKSTRAKSI TAHAP 3B ===")
    print("DOCX ditemukan:", len(documents))
    print("Template kandidat:", len(templates))
    print("Kombinasi belum terpetakan:", len(missing))

    for template in templates:
        print(
            template["survey"],
            "|",
            template["phase"],
            "|",
            len(template["items"]),
            "item",
        )

    for item in missing:
        print("PERLU PEMETAAN:", item)

    print("\nKandidat:", template_file)
    print("Laporan:", audit_file)
    print("File Tahap 3B aktif tidak ditimpa.")


if __name__ == "__main__":
    main()
