
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def norm(value):
    return re.sub(
        r"\s+", " ",
        str(value).lower().replace("_", " ").replace("-", " ")
    ).strip()


def document_blocks(file):
    with zipfile.ZipFile(file) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))

    body = root.find(W + "body")

    if body is None:
        raise ValueError("Body DOCX tidak ditemukan")

    blocks = []

    for element in body:
        if element.tag == W + "p":
            text = "".join(
                node.text or ""
                for node in element.iter(W + "t")
            ).strip()

            if text:
                blocks.append({
                    "type": "paragraph",
                    "text": re.sub(r"\s+", " ", text),
                })

        elif element.tag == W + "tbl":
            rows = []

            for tr in element.findall(W + "tr"):
                cells = []

                for tc in tr.findall(W + "tc"):
                    text = "".join(
                        node.text or ""
                        for node in tc.iter(W + "t")
                    )
                    cells.append(
                        re.sub(r"\s+", " ", text).strip()
                    )

                if any(cells):
                    rows.append(cells)

            if rows:
                blocks.append({
                    "type": "table",
                    "rows": rows,
                })

    return blocks


def determine_survey(file):
    parent = norm(file.parent.name)

    mapping = [
        ("PCI AI", ["pci ai"]),
        ("PCI Manual", ["pci manual"]),
        ("Lalu Lintas", ["lalu lintas"]),
        ("Lendutan", ["lendutan"]),
        ("Jembatan", ["jembatan"]),
        ("Drainase", ["drainase"]),
        ("Lereng", ["lereng"]),
        ("IRI", ["iri"]),
        ("RNI", ["rni"]),
    ]

    for survey, names in mapping:
        if any(name in parent for name in names):
            return survey

    return None


def determine_phase(file):
    name = norm(file.stem)

    # Dokumen gabungan Lalu Lintas mempunyai pemeriksaan
    # periode 2 mingguan, meski namanya diawali Konsistensi.
    if "konsistensi" in name and (
        "2 mingguan" in name or
        "validasi 2" in name
    ):
        return "periodic14"

    if "internal" in name:
        return "internal"

    if "2 mingguan" in name or "validasi 2" in name:
        return "periodic14"

    if "konsistensi" in name:
        return "consistency"

    return None


def significant_headings(blocks):
    result = []

    for index, block in enumerate(blocks):
        if block["type"] != "paragraph":
            continue

        text = block["text"]

        if len(text) > 120:
            continue

        if (
            re.match(r"^(?:BAGIAN\s+)?[A-P][.\s:)]+", text)
            or re.match(r"^[IVX]+[.\s:)]+", text)
            or re.match(r"^\d+(?:\.\d+)*[.\s:)]+", text)
            or any(
                keyword in norm(text)
                for keyword in (
                    "konsistensi",
                    "validasi berjalan",
                    "on going validation",
                    "audit internal",
                    "verifikasi dan validasi internal",
                )
            )
        ):
            result.append({
                "block_index": index,
                "heading": text,
            })

    return result


def main():
    if len(sys.argv) != 2:
        raise SystemExit(
            "Berikan path folder Lampiran Checklist"
        )

    folder = Path(sys.argv[1])

    if not folder.is_dir():
        raise SystemExit(f"Folder tidak ada: {folder}")

    project = Path(__file__).resolve().parents[2]
    report_path = (
        project / "frontend" / "src" / "workflow" /
        "stage3b-mapping-review.json"
    )

    docs = [
        file for file in folder.rglob("*.docx")
        if not file.name.startswith("~$")
    ]

    results = []
    coverage = {}

    for file in sorted(docs):
        survey = determine_survey(file)

        if survey is None:
            continue

        phase = determine_phase(file)

        try:
            blocks = document_blocks(file)
        except Exception as error:
            results.append({
                "survey": survey,
                "file": file.name,
                "error": str(error),
            })
            continue

        headings = significant_headings(blocks)

        is_combined = (
            survey in ("IRI", "Lendutan")
            and "kalibrasi" in norm(file.stem)
        )

        if not phase and not is_combined:
            continue

        entry = {
            "survey": survey,
            "file": file.name,
            "phase": phase,
            "combined": is_combined,
            "paragraphs": sum(
                b["type"] == "paragraph" for b in blocks
            ),
            "tables": sum(
                b["type"] == "table" for b in blocks
            ),
            "headings": headings,
        }

        results.append(entry)

        if phase:
            key = f"{survey}/{phase}"
            coverage.setdefault(key, []).append(file.name)

    required = [
        f"{survey}/{phase}"
        for survey in (
            "IRI", "PCI Manual", "PCI AI", "Lendutan",
            "Jembatan", "Lereng", "Drainase",
            "Lalu Lintas", "RNI",
        )
        for phase in (
            "consistency", "internal", "periodic14"
        )
    ]

    missing = [
        key for key in required
        if key not in coverage
    ]

    report = {
        "documents": results,
        "coverage": coverage,
        "missing_direct_files": missing,
        "important": (
            "Dokumen gabungan IRI dan Lendutan harus "
            "dipisahkan berdasarkan bagian isinya. "
            "Jangan menganggap seluruh dokumen sebagai "
            "satu kegiatan."
        ),
    }

    report_path.write_text(
        json.dumps(
            report,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print("\n=== PEMERIKSAAN PEMETAAN TAHAP 3B ===")
    print("Dokumen terkait:", len(results))

    for key in sorted(coverage):
        print("OK:", key)

    print("\nBUTUH PEMETAAN BAGIAN:")

    for key in missing:
        print("-", key)

    print("\nBAGIAN DOKUMEN GABUNGAN:")

    for entry in results:
        if not entry.get("combined"):
            continue

        print("\n", entry["survey"], ":", entry["file"])

        for heading in entry["headings"]:
            print(
                " ",
                heading["block_index"],
                heading["heading"][:100],
            )

    print("\nLaporan:", report_path)
    print("Data aktif tidak diubah.")


if __name__ == "__main__":
    main()
