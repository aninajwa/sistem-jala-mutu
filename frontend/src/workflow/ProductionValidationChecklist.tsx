import { ClipboardCheck } from 'lucide-react';

import type {
  ProductionTest,
  SurveyType,
} from './model';

type DetailValue =
  | string
  | number
  | boolean;

type DetailMap =
  Record<string, DetailValue>;

type Props = {
  type: SurveyType;
  test: ProductionTest;
  editable: boolean;
  onUpdate:
    <K extends keyof ProductionTest>(
      key: K,
      value: ProductionTest[K],
    ) => void;
};

type FieldDefinition = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date';
};

const RNI_FIELDS: FieldDefinition[] = [
  {
    key: 'road',
    label: 'Ruas',
  },
  {
    key: 'staStart',
    label: 'STA awal',
  },
  {
    key: 'staEnd',
    label: 'STA akhir',
  },
  {
    key: 'linkDescription',
    label: 'Link description',
  },
  {
    key: 'lrpReference',
    label: 'LRP / referensi lokasi',
  },
  {
    key: 'crossSectionInventory',
    label: 'Inventori penampang melintang',
  },
  {
    key: 'inventoryAttributes',
    label: 'Atribut inventori',
  },
  {
    key: 'gpsReference',
    label: 'Referensi GPS/GNSS',
  },
  {
    key: 'rawDataReference',
    label: 'RAW GPS / data inventori',
  },
];

const SLOPE_FIELDS: FieldDefinition[] = [
  {
    key: 'road',
    label: 'Ruas',
  },
  {
    key: 'locationReference',
    label: 'Referensi lokasi / STA',
  },
  {
    key: 'coordinates',
    label: 'Koordinat / GPS',
  },
  {
    key: 'geometry',
    label: 'Geometri lereng',
  },
  {
    key: 'materialCondition',
    label: 'Material / kondisi lereng',
  },
  {
    key: 'failureCondition',
    label: 'Jenis / kondisi keruntuhan',
  },
  {
    key: 'drainageCondition',
    label: 'Kondisi drainase',
  },
  {
    key: 'engineeringStructure',
    label: 'Bangunan rekayasa / pengaman',
  },
  {
    key: 'instrumentation',
    label: 'Instrumentasi',
  },
  {
    key: 'photoReference',
    label: 'Referensi foto',
  },
  {
    key: 'sketchReference',
    label: 'Referensi sketsa',
  },
  {
    key: 'inSlopeReference',
    label: 'Referensi InSlope',
  },
];

const DRAINAGE_FIELDS: FieldDefinition[] = [
  {
    key: 'segmentId',
    label: 'ID segmen',
  },
  {
    key: 'road',
    label: 'Ruas',
  },
  {
    key: 'staStart',
    label: 'STA awal',
  },
  {
    key: 'staEnd',
    label: 'STA akhir',
  },
  {
    key: 'coordinates',
    label: 'Koordinat / GPS',
  },
  {
    key: 'side',
    label: 'Sisi',
  },
  {
    key: 'channelType',
    label: 'Jenis saluran',
  },
  {
    key: 'material',
    label: 'Material',
  },
  {
    key: 'widthM',
    label: 'Lebar (m)',
  },
  {
    key: 'depthM',
    label: 'Kedalaman (m)',
  },
  {
    key: 'sedimentHeightM',
    label: 'Tinggi sedimentasi (m)',
  },
  {
    key: 'conditionClass',
    label: 'Klasifikasi kondisi',
  },
  {
    key: 'obstructionSediment',
    label: 'Hambatan / sedimentasi',
  },
  {
    key: 'flowCondition',
    label: 'Kondisi aliran',
  },
  {
    key: 'outletCondition',
    label: 'Kondisi outlet',
  },
  {
    key: 'inDrainReference',
    label: 'Referensi InDrain',
  },
  {
    key: 'inspectionReference',
    label: 'Form / data inspeksi',
  },
  {
    key: 'photoVideoReference',
    label: 'Foto / video inspeksi',
  },
];

const TRAFFIC_FIELDS: FieldDefinition[] = [
  {
    key: 'tcId',
    label: 'ID lokasi TC',
  },
  {
    key: 'road',
    label: 'Ruas',
  },
  {
    key: 'coordinates',
    label: 'Koordinat',
  },
  {
    key: 'testDate',
    label: 'Tanggal uji',
    type: 'date',
  },
  {
    key: 'direction',
    label: 'Arah',
  },
  {
    key: 'lane',
    label: 'Lajur',
  },
];

function InputField({
  field,
  value,
  editable,
  onChange,
}: {
  field: FieldDefinition;
  value: DetailValue | undefined;
  editable: boolean;
  onChange: (
    value: DetailValue,
  ) => void;
}) {
  return (
    <label className="wf-field">
      <span>{field.label}</span>

      <input
        type={field.type ?? 'text'}
        step={
          field.type === 'number'
            ? 'any'
            : undefined
        }
        disabled={!editable}
        value={
          value === undefined ||
          (
            typeof value === 'number' &&
            Number.isNaN(value)
          )
            ? ''
            : String(value)
        }
        onChange={event => {
          if (field.type === 'number') {
            onChange(
              event.target.value === ''
                ? Number.NaN
                : Number(
                    event.target.value,
                  ),
            );

            return;
          }

          onChange(
            event.target.value,
          );
        }}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  editable,
  min,
  step,
  onChange,
}: {
  label: string;
  value: number | undefined;
  editable: boolean;
  min?: number;
  step?: number;
  onChange: (
    value: number,
  ) => void;
}) {
  return (
    <label className="wf-field">
      <span>{label}</span>

      <input
        type="number"
        min={min}
        step={step}
        disabled={!editable}
        value={
          value === undefined ||
          Number.isNaN(value)
            ? ''
            : value
        }
        onChange={event =>
          onChange(
            event.target.value === ''
              ? Number.NaN
              : Number(
                  event.target.value,
                ),
          )
        }
      />
    </label>
  );
}

function TrialCheck({
  label,
  checked,
  editable,
  onChange,
}: {
  label: string;
  checked: boolean;
  editable: boolean;
  onChange:
    (value: boolean) => void;
}) {
  return (
    <label
      className="wf-row wf-check production-trial-check"
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={!editable}
        onChange={event =>
          onChange(
            event.target.checked,
          )
        }
      />

      <span>{label}</span>
    </label>
  );
}

function FieldsFromDefinitions({
  fields,
  details,
  editable,
  setDetail,
}: {
  fields: FieldDefinition[];
  details: DetailMap;
  editable: boolean;
  setDetail:
    (
      key: string,
      value: DetailValue,
    ) => void;
}) {
  return (
    <>
      {fields.map(field => (
        <InputField
          key={field.key}
          field={field}
          value={
            details[
              field.key
            ]
          }
          editable={editable}
          onChange={value =>
            setDetail(
              field.key,
              value,
            )
          }
        />
      ))}
    </>
  );
}

export function ProductionValidationChecklist({
  type,
  test,
  editable,
  onUpdate,
}: Props) {
  const details:
    DetailMap =
      test.productionDetails ?? {};

  const setDetail = (
    key: string,
    value: DetailValue,
  ) => {
    onUpdate(
      'productionDetails',
      {
        ...details,
        [key]: value,
      },
    );
  };

  const flag = (
    key: string,
  ) =>
    details[key] === true;

  const targetLabel =
    type === 'IRI'
      ? 'Minimal 10 km'
      : type === 'PCI'
        ? 'Minimal 5 km'
        : type === 'Lendutan'
          ? 'Minimal 1 lokasi / tim'
          : type === 'Jembatan'
            ? '3 sampel uji coba wajib'
            : type === 'RNI'
              ? 'Minimal 5 km'
              : type === 'Lereng'
                ? 'Minimal 1 lokasi / tim'
                : type === 'Drainase'
                  ? 'Minimal 5 km'
                  : 'Minimal 1 lokasi TC · 1 × 24 jam';

  return (
    <section className="wf-panel">
      <div className="wf-panel-head">
        <h3>
          <ClipboardCheck
            size={14}
          />

          Data Uji Coba {type}
        </h3>

        <span className="wf-status info">
          {targetLabel}
        </span>
      </div>

      <div className="wf-body">
        {!editable && (
          <div className="wf-callout">
            Data teknis ditampilkan
            read-only karena berasal
            dari sistem sumber atau
            peran aktif tidak memiliki
            hak input.
          </div>
        )}

        {/* =====================================
            IRI
            ===================================== */}

        {type === 'IRI' && (
          <>
            <div className="wf-fields">
              <NumberField
                label="Panjang uji (km)"
                value={test.trialKm}
                editable={editable}
                min={0}
                step={0.1}
                onChange={value =>
                  onUpdate(
                    'trialKm',
                    value,
                  )
                }
              />

              <NumberField
                label="Jumlah seksi uji"
                value={test.sections}
                editable={editable}
                min={0}
                onChange={value =>
                  onUpdate(
                    'sections',
                    value,
                  )
                }
              />

              <NumberField
                label="Panjang setiap seksi (km)"
                value={
                  test.sectionLengthKm
                }
                editable={editable}
                min={0}
                step={0.1}
                onChange={value =>
                  onUpdate(
                    'sectionLengthKm',
                    value,
                  )
                }
              />

              <NumberField
                label="Jumlah pengulangan"
                value={test.repeats}
                editable={editable}
                min={0}
                onChange={value =>
                  onUpdate(
                    'repeats',
                    value,
                  )
                }
              />

              <NumberField
                label="Ulangan 40 km/jam"
                value={
                  test.speedTrials40
                }
                editable={editable}
                min={0}
                onChange={value =>
                  onUpdate(
                    'speedTrials40',
                    value,
                  )
                }
              />

              <NumberField
                label="Ulangan 50 km/jam"
                value={
                  test.speedTrials50
                }
                editable={editable}
                min={0}
                onChange={value =>
                  onUpdate(
                    'speedTrials50',
                    value,
                  )
                }
              />

              <NumberField
                label="Ulangan >60 km/jam"
                value={
                  test
                    .speedTrialsAbove60
                }
                editable={editable}
                min={0}
                onChange={value =>
                  onUpdate(
                    'speedTrialsAbove60',
                    value,
                  )
                }
              />

              <NumberField
                label="Koefisien A"
                value={
                  test.coefficientA
                }
                editable={editable}
                step={0.001}
                onChange={value =>
                  onUpdate(
                    'coefficientA',
                    value,
                  )
                }
              />

              <NumberField
                label="Koefisien B"
                value={
                  test.coefficientB
                }
                editable={editable}
                step={0.001}
                onChange={value =>
                  onUpdate(
                    'coefficientB',
                    value,
                  )
                }
              />

              <NumberField
                label="R²"
                value={
                  test.rSquared
                }
                editable={editable}
                step={0.01}
                onChange={value =>
                  onUpdate(
                    'rSquared',
                    value,
                  )
                }
              />

              <NumberField
                label="Koefisien variasi / CV (%)"
                value={
                  test
                    .coefficientVariation
                }
                editable={editable}
                step={0.1}
                onChange={value =>
                  onUpdate(
                    'coefficientVariation',
                    value,
                  )
                }
              />
            </div>

            <TrialCheck
              label="Referensi lokasi konsisten dengan LRS"
              checked={
                test
                  .stationingConsistent
              }
              editable={editable}
              onChange={value =>
                onUpdate(
                  'stationingConsistent',
                  value,
                )
              }
            />
          </>
        )}

        {/* =====================================
            PCI
            ===================================== */}

        {type === 'PCI' && (
          <>
            <div className="production-method-box">
              <div>
                <strong>
                  Metode PCI
                </strong>

                <span>
                  Pilih metode yang digunakan
                  pada paket. Struktur validasi
                  menyesuaikan PCI Manual atau
                  PCI Berbasis AI.
                </span>
              </div>

              <div className="pci-method-options">
                <button
                  type="button"
                  className={`wf-button ${
                    test.pciManual !== false
                      ? 'primary'
                      : ''
                  }`}
                  disabled={!editable}
                  onClick={() =>
                    onUpdate(
                      'pciManual',
                      true,
                    )
                  }
                >
                  PCI Manual
                </button>

                <button
                  type="button"
                  className={`wf-button ${
                    test.pciManual === false
                      ? 'primary'
                      : ''
                  }`}
                  disabled={!editable}
                  onClick={() =>
                    onUpdate(
                      'pciManual',
                      false,
                    )
                  }
                >
                  PCI Berbasis AI
                </button>
              </div>
            </div>

            <div className="wf-fields">
              <NumberField
                label="Panjang uji (km)"
                value={test.trialKm}
                editable={editable}
                min={0}
                step={0.1}
                onChange={value =>
                  onUpdate(
                    'trialKm',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key: 'pciRoad',
                  label:
                    'Ruas / lokasi uji',
                }}
                value={
                  details.pciRoad
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'pciRoad',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key: 'pciTestDate',
                  label: 'Tanggal uji',
                  type: 'date',
                }}
                value={
                  details.pciTestDate
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'pciTestDate',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'pciSegmentReference',
                  label:
                    'Referensi segmen / sampel',
                }}
                value={
                  details
                    .pciSegmentReference
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'pciSegmentReference',
                    value,
                  )
                }
              />

              {test.pciManual !== false ? (
                <>
                  <InputField
                    field={{
                      key:
                        'pciDistressReference',
                      label:
                        'Referensi identifikasi kerusakan / rating',
                    }}
                    value={
                      details
                        .pciDistressReference
                    }
                    editable={editable}
                    onChange={value =>
                      setDetail(
                        'pciDistressReference',
                        value,
                      )
                    }
                  />

                  <InputField
                    field={{
                      key:
                        'pciComparisonReference',
                      label:
                        'Referensi data pembanding / objek standar',
                    }}
                    value={
                      details
                        .pciComparisonReference
                    }
                    editable={editable}
                    onChange={value =>
                      setDetail(
                        'pciComparisonReference',
                        value,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <InputField
                    field={{
                      key:
                        'pciModelVersion',
                      label:
                        'Versi model AI',
                    }}
                    value={
                      details
                        .pciModelVersion
                    }
                    editable={editable}
                    onChange={value =>
                      setDetail(
                        'pciModelVersion',
                        value,
                      )
                    }
                  />

                  <InputField
                    field={{
                      key:
                        'pciBenchmarkReference',
                      label:
                        'Referensi benchmark / kondisi aktual',
                    }}
                    value={
                      details
                        .pciBenchmarkReference
                    }
                    editable={editable}
                    onChange={value =>
                      setDetail(
                        'pciBenchmarkReference',
                        value,
                      )
                    }
                  />

                  <InputField
                    field={{
                      key:
                        'pciPerformanceReport',
                      label:
                        'Referensi hasil evaluasi kinerja AI',
                    }}
                    value={
                      details
                        .pciPerformanceReport
                    }
                    editable={editable}
                    onChange={value =>
                      setDetail(
                        'pciPerformanceReport',
                        value,
                      )
                    }
                  />
                </>
              )}
            </div>

            <TrialCheck
              label="Metode dan peralatan uji memenuhi persyaratan"
              checked={flag(
                'methodEquipmentCompliant',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'methodEquipmentCompliant',
                  value,
                )
              }
            />

            <TrialCheck
              label="Data hasil uji telah diproses"
              checked={flag(
                'dataProcessed',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'dataProcessed',
                  value,
                )
              }
            />

            {test.pciManual !== false && (
              <TrialCheck
                label="Hasil penilaian visual telah diperiksa personel penilai lain"
                checked={
                  test.ratersAgree
                }
                editable={editable}
                onChange={value =>
                  onUpdate(
                    'ratersAgree',
                    value,
                  )
                }
              />
            )}

            <TrialCheck
              label="Hasil PCI konsisten dengan LRS"
              checked={
                test
                  .stationingConsistent
              }
              editable={editable}
              onChange={value =>
                onUpdate(
                  'stationingConsistent',
                  value,
                )
              }
            />
          </>
        )}

        {/* =====================================
            LENDUTAN
            ===================================== */}

        {type === 'Lendutan' && (
          <>
            <div className="production-method-box">
              <div>
                <strong>
                  Metode pengukuran lendutan
                </strong>

                <span>
                  Parameter pemeriksaan
                  menyesuaikan metode alat
                  yang digunakan.
                </span>
              </div>

              <div className="pci-method-options">
                <button
                  type="button"
                  className={`wf-button ${
                    test.deflectionMethod !==
                    'LWD'
                      ? 'primary'
                      : ''
                  }`}
                  disabled={!editable}
                  onClick={() =>
                    onUpdate(
                      'deflectionMethod',
                      'FWD',
                    )
                  }
                >
                  FWD
                </button>

                <button
                  type="button"
                  className={`wf-button ${
                    test.deflectionMethod ===
                    'LWD'
                      ? 'primary'
                      : ''
                  }`}
                  disabled={!editable}
                  onClick={() =>
                    onUpdate(
                      'deflectionMethod',
                      'LWD',
                    )
                  }
                >
                  LWD
                </button>
              </div>
            </div>

            <div className="wf-fields">
              <NumberField
                label="Jumlah lokasi uji"
                value={
                  test.locations
                }
                editable={editable}
                min={0}
                onChange={value =>
                  onUpdate(
                    'locations',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'deflectionLocation',
                  label:
                    'Lokasi / STA',
                }}
                value={
                  details
                    .deflectionLocation
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'deflectionLocation',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'deflectionCoordinates',
                  label:
                    'Koordinat / LRS',
                }}
                value={
                  details
                    .deflectionCoordinates
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'deflectionCoordinates',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'deflectionResultReference',
                  label:
                    'Referensi hasil pengukuran',
                }}
                value={
                  details
                    .deflectionResultReference
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'deflectionResultReference',
                    value,
                  )
                }
              />

              {test.deflectionMethod ===
              'LWD' ? (
                <>
                  <NumberField
                    label="Titik korelasi terhadap FWD"
                    value={
                      test
                        .lwdCorrelationPoints
                    }
                    editable={editable}
                    min={0}
                    onChange={value =>
                      onUpdate(
                        'lwdCorrelationPoints',
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Jumlah pengukuran LWD"
                    value={
                      test.lwdRepeats
                    }
                    editable={editable}
                    min={0}
                    onChange={value =>
                      onUpdate(
                        'lwdRepeats',
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Selisih ulangan (µm)"
                    value={
                      test
                        .lwdDifferenceMicrons
                    }
                    editable={editable}
                    onChange={value =>
                      onUpdate(
                        'lwdDifferenceMicrons',
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Selisih ulangan (%)"
                    value={
                      test
                        .lwdDifferencePercent
                    }
                    editable={editable}
                    onChange={value =>
                      onUpdate(
                        'lwdDifferencePercent',
                        value,
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <NumberField
                    label="Beban FWD (kN)"
                    value={
                      test.fwdLoad
                    }
                    editable={editable}
                    onChange={value =>
                      onUpdate(
                        'fwdLoad',
                        value,
                      )
                    }
                  />

                  <NumberField
                    label="Jumlah sensor FWD"
                    value={
                      test.sensorCount
                    }
                    editable={editable}
                    min={0}
                    onChange={value =>
                      onUpdate(
                        'sensorCount',
                        value,
                      )
                    }
                  />
                </>
              )}
            </div>

            {test.deflectionMethod !==
              'LWD' && (
              <TrialCheck
                label="Urutan deflection bowl hasil FWD valid"
                checked={
                  test
                    .deflectionBowlOrdered
                }
                editable={editable}
                onChange={value =>
                  onUpdate(
                    'deflectionBowlOrdered',
                    value,
                  )
                }
              />
            )}

            <TrialCheck
              label="Metode dan peralatan uji memenuhi persyaratan"
              checked={flag(
                'methodEquipmentCompliant',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'methodEquipmentCompliant',
                  value,
                )
              }
            />

            <TrialCheck
              label="Data hasil uji telah diproses"
              checked={flag(
                'dataProcessed',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'dataProcessed',
                  value,
                )
              }
            />

            <TrialCheck
              label="Lokasi pengukuran konsisten dengan LRS"
              checked={
                test
                  .stationingConsistent
              }
              editable={editable}
              onChange={value =>
                onUpdate(
                  'stationingConsistent',
                  value,
                )
              }
            />
          </>
        )}

        {/* =====================================
            JEMBATAN
            ===================================== */}

        {type === 'Jembatan' && (
          <>
            <div className="wf-callout">
              Uji coba Jembatan menggunakan
              3 sampel: 1 inventarisasi dan
              2 pemeriksaan detail sesuai
              karakteristik yang ditetapkan
              KAK.
            </div>

            <div className="wf-fields">
              <InputField
                field={{
                  key:
                    'bridgeSample1Id',
                  label:
                    'Sampel 1 · ID / nama jembatan',
                }}
                value={
                  details
                    .bridgeSample1Id
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample1Id',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeSample1Spans',
                  label:
                    'Sampel 1 · Jumlah bentang',
                  type: 'number',
                }}
                value={
                  details
                    .bridgeSample1Spans
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample1Spans',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeSample1SpanLength',
                  label:
                    'Sampel 1 · Panjang bentang (m)',
                  type: 'number',
                }}
                value={
                  details
                    .bridgeSample1SpanLength
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample1SpanLength',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeSample1Reference',
                  label:
                    'Sampel 1 · Referensi inventarisasi',
                }}
                value={
                  details
                    .bridgeSample1Reference
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample1Reference',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeSample2Id',
                  label:
                    'Sampel 2 · Jembatan rangka baja',
                }}
                value={
                  details
                    .bridgeSample2Id
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample2Id',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeSample2SpanLength',
                  label:
                    'Sampel 2 · Panjang bentang (m)',
                  type: 'number',
                }}
                value={
                  details
                    .bridgeSample2SpanLength
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample2SpanLength',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeSample2Reference',
                  label:
                    'Sampel 2 · Referensi pemeriksaan detail',
                }}
                value={
                  details
                    .bridgeSample2Reference
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample2Reference',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeSample3Id',
                  label:
                    'Sampel 3 · Jembatan beton bertulang',
                }}
                value={
                  details
                    .bridgeSample3Id
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample3Id',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeSample3SpanLength',
                  label:
                    'Sampel 3 · Panjang bentang (m)',
                  type: 'number',
                }}
                value={
                  details
                    .bridgeSample3SpanLength
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample3SpanLength',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeSample3Reference',
                  label:
                    'Sampel 3 · Referensi pemeriksaan detail',
                }}
                value={
                  details
                    .bridgeSample3Reference
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeSample3Reference',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeReportIntro',
                  label:
                    'Laporan · BAB I Pendahuluan',
                }}
                value={
                  details
                    .bridgeReportIntro
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeReportIntro',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeReportResult',
                  label:
                    'Laporan · BAB II Hasil Uji Coba',
                }}
                value={
                  details
                    .bridgeReportResult
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeReportResult',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeReportEvaluation',
                  label:
                    'Laporan · BAB III Pembahasan & Evaluasi',
                }}
                value={
                  details
                    .bridgeReportEvaluation
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeReportEvaluation',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeReportConclusion',
                  label:
                    'Laporan · BAB IV Kesimpulan & Saran',
                }}
                value={
                  details
                    .bridgeReportConclusion
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeReportConclusion',
                    value,
                  )
                }
              />

              <InputField
                field={{
                  key:
                    'bridgeReportAttachment',
                  label:
                    'Lampiran formulir, foto & sketsa',
                }}
                value={
                  details
                    .bridgeReportAttachment
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'bridgeReportAttachment',
                    value,
                  )
                }
              />
            </div>

            <TrialCheck
              label="Personel pemeriksa dinyatakan memenuhi hasil uji coba"
              checked={
                test
                  .bridgePersonnelPassed
              }
              editable={editable}
              onChange={value =>
                onUpdate(
                  'bridgePersonnelPassed',
                  value,
                )
              }
            />

            <TrialCheck
              label="Laporan uji coba Jembatan lengkap"
              checked={
                test
                  .bridgeTrialReportComplete ===
                true
              }
              editable={editable}
              onChange={value =>
                onUpdate(
                  'bridgeTrialReportComplete',
                  value,
                )
              }
            />

            <TrialCheck
              label="Data hasil uji telah diproses"
              checked={flag(
                'dataProcessed',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'dataProcessed',
                  value,
                )
              }
            />

            <TrialCheck
              label="Lokasi / data jembatan konsisten dengan LRS"
              checked={
                test
                  .stationingConsistent
              }
              editable={editable}
              onChange={value =>
                onUpdate(
                  'stationingConsistent',
                  value,
                )
              }
            />
          </>
        )}

        {/* =====================================
            RNI
            ===================================== */}

        {type === 'RNI' && (
          <>
            <div className="wf-fields">
              <NumberField
                label="Panjang uji (km)"
                value={test.trialKm}
                editable={editable}
                min={0}
                step={0.1}
                onChange={value =>
                  onUpdate(
                    'trialKm',
                    value,
                  )
                }
              />

              <FieldsFromDefinitions
                fields={RNI_FIELDS}
                details={details}
                editable={editable}
                setDetail={setDetail}
              />
            </div>

            <TrialCheck
              label="Metode dan peralatan uji memenuhi persyaratan"
              checked={flag(
                'methodEquipmentCompliant',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'methodEquipmentCompliant',
                  value,
                )
              }
            />

            <TrialCheck
              label="Data hasil uji telah diproses"
              checked={flag(
                'dataProcessed',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'dataProcessed',
                  value,
                )
              }
            />

            <TrialCheck
              label="Referensi lokasi konsisten dengan LRS"
              checked={
                test
                  .stationingConsistent
              }
              editable={editable}
              onChange={value =>
                onUpdate(
                  'stationingConsistent',
                  value,
                )
              }
            />
          </>
        )}

        {/* =====================================
            LERENG
            ===================================== */}

        {type === 'Lereng' && (
          <>
            <div className="wf-fields">
              <NumberField
                label="Jumlah lokasi uji"
                value={
                  test.locations
                }
                editable={editable}
                min={0}
                onChange={value =>
                  onUpdate(
                    'locations',
                    value,
                  )
                }
              />

              <FieldsFromDefinitions
                fields={SLOPE_FIELDS}
                details={details}
                editable={editable}
                setDetail={setDetail}
              />
            </div>

            <TrialCheck
              label="Metode dan peralatan uji memenuhi persyaratan"
              checked={flag(
                'methodEquipmentCompliant',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'methodEquipmentCompliant',
                  value,
                )
              }
            />

            <TrialCheck
              label="Data hasil uji telah diproses"
              checked={flag(
                'dataProcessed',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'dataProcessed',
                  value,
                )
              }
            />

            <TrialCheck
              label="Penilaian visual diperiksa personel penilai lain"
              checked={flag(
                'secondRaterChecked',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'secondRaterChecked',
                  value,
                )
              }
            />

            <TrialCheck
              label="Referensi lokasi konsisten dengan LRS"
              checked={
                test
                  .stationingConsistent
              }
              editable={editable}
              onChange={value =>
                onUpdate(
                  'stationingConsistent',
                  value,
                )
              }
            />
          </>
        )}

        {/* =====================================
            DRAINASE
            ===================================== */}

        {type === 'Drainase' && (
          <>
            <div className="wf-fields">
              <NumberField
                label="Panjang uji (km)"
                value={
                  test.trialKm
                }
                editable={editable}
                min={0}
                step={0.1}
                onChange={value =>
                  onUpdate(
                    'trialKm',
                    value,
                  )
                }
              />

              <FieldsFromDefinitions
                fields={
                  DRAINAGE_FIELDS
                }
                details={details}
                editable={editable}
                setDetail={setDetail}
              />
            </div>

            <TrialCheck
              label="Metode dan peralatan uji memenuhi persyaratan"
              checked={flag(
                'methodEquipmentCompliant',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'methodEquipmentCompliant',
                  value,
                )
              }
            />

            <TrialCheck
              label="Data hasil uji telah diproses"
              checked={flag(
                'dataProcessed',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'dataProcessed',
                  value,
                )
              }
            />

            <TrialCheck
              label="Penilaian visual diperiksa personel penilai lain"
              checked={flag(
                'secondRaterChecked',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'secondRaterChecked',
                  value,
                )
              }
            />

            <TrialCheck
              label="Referensi lokasi konsisten dengan LRS"
              checked={
                test
                  .stationingConsistent
              }
              editable={editable}
              onChange={value =>
                onUpdate(
                  'stationingConsistent',
                  value,
                )
              }
            />
          </>
        )}

        {/* =====================================
            LALU LINTAS
            ===================================== */}

        {type === 'Lalu Lintas' && (
          <>
            <div className="wf-fields">
              <NumberField
                label="Jumlah lokasi TC"
                value={
                  test.locations
                }
                editable={editable}
                min={0}
                onChange={value =>
                  onUpdate(
                    'locations',
                    value,
                  )
                }
              />

              <NumberField
                label="Durasi pengamatan (jam)"
                value={
                  test.trafficHours
                }
                editable={editable}
                min={0}
                onChange={value =>
                  onUpdate(
                    'trafficHours',
                    value,
                  )
                }
              />

              <FieldsFromDefinitions
                fields={
                  TRAFFIC_FIELDS
                }
                details={details}
                editable={editable}
                setDetail={setDetail}
              />

              <label className="wf-field">
                <span>Metode</span>

                <select
                  disabled={!editable}
                  value={String(
                    details.method ?? '',
                  )}
                  onChange={event =>
                    setDetail(
                      'method',
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Pilih metode
                  </option>

                  <option value="Manual">
                    Manual
                  </option>

                  <option value="Rekaman video / off-site">
                    Rekaman video /
                    off-site
                  </option>
                </select>
              </label>

              {[
                [
                  'motorcycleCount',
                  'Sepeda motor',
                ],
                [
                  'lightVehicleCount',
                  'Kendaraan ringan',
                ],
                [
                  'busCount',
                  'Bus',
                ],
                [
                  'truckCount',
                  'Truk',
                ],
                [
                  'otherVehicleCount',
                  'Kendaraan lainnya',
                ],
              ].map(
                ([key, label]) => (
                  <InputField
                    key={key}
                    field={{
                      key,
                      label,
                      type:
                        'number',
                    }}
                    value={
                      details[key]
                    }
                    editable={
                      editable
                    }
                    onChange={
                      value =>
                        setDetail(
                          key,
                          value,
                        )
                    }
                  />
                ),
              )}

              <InputField
                field={{
                  key:
                    'recapReference',
                  label:
                    'Rekap data pencacahan',
                }}
                value={
                  details
                    .recapReference
                }
                editable={editable}
                onChange={value =>
                  setDetail(
                    'recapReference',
                    value,
                  )
                }
              />

              {details.method ===
                'Rekaman video / off-site' && (
                <InputField
                  field={{
                    key:
                      'videoReference',
                    label:
                      'Bukti / referensi video',
                  }}
                  value={
                    details
                      .videoReference
                  }
                  editable={
                    editable
                  }
                  onChange={value =>
                    setDetail(
                      'videoReference',
                      value,
                    )
                  }
                />
              )}
            </div>

            <TrialCheck
              label="Metode dan peralatan uji memenuhi persyaratan"
              checked={flag(
                'methodEquipmentCompliant',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'methodEquipmentCompliant',
                  value,
                )
              }
            />

            <TrialCheck
              label="Data hasil uji telah diproses"
              checked={flag(
                'dataProcessed',
              )}
              editable={editable}
              onChange={value =>
                setDetail(
                  'dataProcessed',
                  value,
                )
              }
            />
          </>
        )}
      </div>
    </section>
  );
}