import {
  INITIAL_WORKFLOW,
  SURVEY_TYPES,
  type CorrectionCase,
  type OperationalWorkflowState,
  type SurveyType,
  type WorkflowRole,
} from './model';

/*
 * v2 sengaja digunakan untuk development M11.
 *
 * Tujuannya agar seed Package A/B yang lama di localStorage
 * tidak mengalahkan struktur workflow terbaru.
 *
 * Saat backend nyata terhubung, package store lokal ini
 * akan digantikan repository/service API.
 */
export const PACKAGE_STORE_KEY =
  'jala-mutu-package-store-v3';

export type WorkflowPackageStore = {
  activePackageId: string | null;
  activeRole: WorkflowRole;
  packages: Record<
    string,
    OperationalWorkflowState
  >;
};

const clone = <T,>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

const falseMap = <T extends string>(
  items: readonly T[],
) =>
  Object.fromEntries(
    items.map(item => [item, false]),
  ) as Record<T, boolean>;

const trueMap = <T extends string>(
  items: readonly T[],
) =>
  Object.fromEntries(
    items.map(item => [item, true]),
  ) as Record<T, boolean>;

/* =========================================================
   PACKAGE A
   Medan-Binjai
   Mulai dari Tahap 0
   ========================================================= */

function packageA(): OperationalWorkflowState {
  const state = clone(INITIAL_WORKFLOW);

  state.role =
    'Penyedia Jasa / Ketua Tim';

  state.project = {
    ...state.project,

    id: 'PAKET-DEMO-001',

    packageName:
      'Paket QA/QC Medan-Binjai 2027',

    contractor:
      'PT Penyedia Demo Infrastruktur',

    balai:
      'Balai Sumatera Utara',

    satker:
      'P2JN Sumatera Utara',

    ppk:
      'PPK 1.1',

    routes: [
      'Medan-Binjai',
    ],

    surveyTypes: [
      'IRI',
      'PCI',
      'Jembatan',
      'Drainase',
      'RNI',
    ],

    preparation: {
      ...state.project.preparation,

      sourceReviews:
        Object.fromEntries(
          Object.keys(
            state.project.preparation
              .sourceReviews,
          ).map(key => [
            key,
            false,
          ]),
        ),

      fieldPlan:
        Object.fromEntries(
          Object.keys(
            state.project.preparation
              .fieldPlan,
          ).map(key => [
            key,
            false,
          ]),
        ),

      coordination:
        Object.fromEntries(
          Object.keys(
            state.project.preparation
              .coordination,
          ).map(key => [
            key,
            false,
          ]),
        ),

      documents:
        Object.fromEntries(
          Object.keys(
            state.project.preparation
              .documents,
          ).map(key => [
            key,
            false,
          ]),
        ),

      reportApproval: 'Draft',

      reviewerNote: '',
    },
  };

  /* Tahap 1 belum dimulai */
  state.calibrations = [];

  state.calibrationChecklist =
    falseMap(SURVEY_TYPES);

  /* Tahap 2 belum dimulai */
  state.productionApproval =
    'Draft';

  state.productionApprovalBa =
    '';

  state.productionApprovalNote =
    '';

  state.bridgeInspectionPermit =
    false;

  /* Tahap 3 belum ada data */
  state.dailyRecords = [];

  state.cycle = {
    ...state.cycle,

    selectedTypes: [],

    periodCompleted: false,

    heldRecordIds: [],

    checkedProtocols: {},

    iriCoefficientVariation:
      null,

    pciAiStandardDeviation:
      null,

    reRatingStatus:
      'Belum Diperiksa',

    consistency:
      'Belum Diperiksa',

    bridgeFieldValidation:
      false,

    finalPeriodValidation:
      false,

    certificateId: '',

    userReview:
      'Belum Diperiksa',

    userReviewNote: '',

    bridgeValidatedPercent:
      0,

    bridgeValidationReport: '',

    finalValidationLocation: '',

    finalToolUnchanged:
      false,
  };

  /* Tahap 4 */
  state.submission = {
    ...state.submission,

    validationStatus:
      'Draft',

    validationMessage:
      'Belum diajukan',

    requiredDocuments: {},

    internalAudit: {},

    internalAuditBa: '',
  };

  /* Tahap 5 */
  state.audits = [
    {
      ...state.audits[0],
      status: 'Belum Dimulai',
      sampleIds: [],
      decisionNote: '',
      baNumber: '',
      reviewChecks: {},
    },

    {
      ...state.audits[1],
      status: 'Belum Dimulai',
      sampleIds: [],
      decisionNote: '',
      baNumber: '',
      reviewChecks: {},
    },

    {
      ...state.audits[2],
      status: 'Belum Dimulai',
      sampleIds: [],
      decisionNote: '',
      baNumber: '',
      reviewChecks: {},
    },
  ];

  /* Tahap 6 */
  state.acceptance = {
    ...state.acceptance,

    partialReceipts: [],

    terms:
      state.acceptance.terms.map(
        term => ({
          ...term,
          complete: false,
          progress: 0,
        }),
      ),

    semesterTwoRevalidation:
      false,

    finalReport: false,

    finalAcceptance: false,

    finalAcceptanceBa: '',

    acceptanceCriteria: {},

    acceptanceDecision:
      'Belum Diperiksa',

    acceptanceRejectionReason:
      '',
  };

  state.corrections = [];
  state.events = [];

  return state;
}

/* =========================================================
   PACKAGE B
   Bandung-Cileunyi

   Development scenario:
   Tahap 0   = selesai
   Tahap 1   = siap
   Tahap 2   = disetujui
   Tahap 3A  = sudah ada kegiatan
   Tahap 3B  = AKTIF + ada temuan

   Ini hanya seed development.
   Bukan state teleport pada workflow user.
   ========================================================= */

function packageB(): OperationalWorkflowState {
  const state =
    clone(INITIAL_WORKFLOW);

  state.role =
    'Penyedia Jasa / Ketua Tim';

  state.project = {
    ...state.project,

    id:
      'PAKET-DEMO-002',

    packageName:
      'Paket QA/QC Bandung-Cileunyi 2027',

    contractor:
      'PT Penyedia Demo Infrastruktur',

    balai:
      'Balai Jawa Barat',

    satker:
      'P2JN Jawa Barat',

    ppk:
      'PPK 2.2',

    routes: [
      'Bandung-Cileunyi',
    ],

    surveyTypes: [
      'IRI',
      'PCI',
      'Lendutan',
      'Lereng',
      'Lalu Lintas',
    ],
  };

  /* =======================================================
     TAHAP 0
     Persiapan sudah selesai dan telah direview Balai.
     ======================================================= */

  state.project.preparation = {
    ...state.project.preparation,

    reportApproval:
      'Disetujui',

    reviewerNote:
      'Persiapan paket telah direview PIC Balai.',
  };

  /* =======================================================
     TAHAP 1
     Semua jenis survei pada lingkup mempunyai
     penugasan alat/personel siap.
     ======================================================= */

  const equipmentMap:
    Partial<
      Record<
        SurveyType,
        string
      >
    > = {
    IRI:
      'Profilometer Laser',

    PCI:
      'Kamera Survei',

    Lendutan:
      'FWD Dynatest',

    Lereng:
      'GPS Navigasi',

    'Lalu Lintas':
      'Traffic Counter',
  };

  const baseCalibration =
    state.calibrations[0];

  state.calibrations =
    state.project.surveyTypes.map(
      (
        surveyType,
        index,
      ) => {
        if (baseCalibration) {
          return {
            ...clone(
              baseCalibration,
            ),

            id:
              `CAL-JBR-${index + 1}`,

            surveyType,

            equipment:
              equipmentMap[
                surveyType
              ] ||
              baseCalibration
                .equipment,

            serialNumber:
              `JBR-${surveyType
                .replace(
                  /\s+/g,
                  '-',
                )
                .toUpperCase()}-${index + 1}`,

            year: 2027,

            condition: 'Baik',

            lastCalibrated:
              '2027-05-01',

            dueDate:
              '2027-12-31',

            personInCharge:
              `Personel ${surveyType}`,

            qualificationValid:
              true,

            trainingVerified:
              true,

            standardReference:
              'Dokumen kalibrasi dan validasi paket',

            certificateReference:
              `CERT-JBR-${index + 1}`,
          };
        }

        /*
         * Fallback seed hanya dipakai bila INITIAL_WORKFLOW
         * belum mempunyai contoh calibration record.
         */
        return {
          id:
            `CAL-JBR-${index + 1}`,

          equipment:
            equipmentMap[
              surveyType
            ] ||
            'Peralatan Survei',

          serialNumber:
            `JBR-${index + 1}`,

          year: 2027,

          condition: 'Baik',

          calibrationKind:
            'Referensi tahunan',

          lastCalibrated:
            '2027-05-01',

          dueDate:
            '2027-12-31',

          personInCharge:
            `Personel ${surveyType}`,

          qualificationValid:
            true,

          trainingVerified:
            true,

          standardReference:
            'Dokumen kalibrasi dan validasi paket',

          certificateReference:
            `CERT-JBR-${index + 1}`,

          surveyType,
        } as OperationalWorkflowState[
          'calibrations'
        ][number];
      },
    );

  state.calibrationChecklist = {
    ...state.calibrationChecklist,

    ...trueMap(
      state.project.surveyTypes,
    ),
  };

  /* =======================================================
     TAHAP 2
     Uji coba sudah direview PIC Balai.
     ======================================================= */

  state.productionApproval =
    'Disetujui';

  state.productionApprovalBa =
    'BA-VAL-PROD-JABAR-2027';

  state.productionApprovalNote =
    'Hasil uji coba dan metode kerja telah direview PIC Balai.';

  /* =======================================================
     TAHAP 3A
     Harus ada minimal satu rekaman lapangan.
     ======================================================= */

  const baseDaily =
    state.dailyRecords[0];

  if (baseDaily) {
    state.dailyRecords =
      state.project.surveyTypes.map(
        (
          surveyType,
          index,
        ) => ({
          ...clone(
            baseDaily,
          ),

          id:
            `JBR-HARIAN-${index + 1}`,

          date:
            `2027-06-${String(
              index + 1,
            ).padStart(2, '0')}`,

          time:
            '08:00',

          surveyType,

          road:
            'Bandung-Cileunyi',

          tool:
            equipmentMap[
              surveyType
            ] ||
            baseDaily.tool,

          operator:
            `Operator ${surveyType}`,

          state:
            'Tercatat',
        }),
      );
  } else {
    /*
     * Fallback development record.
     * Digunakan hanya bila INITIAL_WORKFLOW
     * tidak mempunyai rekaman contoh.
     */
    state.dailyRecords = [
      {
        id:
          'JBR-HARIAN-001',

        date:
          '2027-06-01',

        time:
          '08:00',

        surveyType:
          'IRI',

        road:
          'Bandung-Cileunyi',

        lengthKm:
          10,

        trafficDurationMinutes:
          0,

        lane:
          'Lajur 1',

        direction:
          'Normal',

        weather:
          'Cerah',

        surfaceDry:
          true,

        glareFree:
          true,

        speedAndLaneCompliant:
          true,

        tool:
          'Profilometer Laser',

        operator:
          'Operator IRI',

        driver:
          'Pengemudi Survei',

        poi:
          'STA 12+400',

        disturbances:
          '',

        eventNotes:
          '',

        dailyToolCheck: {},

        rawValue:
          '2.10',

        cleanedValue:
          '2.10',

        cleaningReason:
          '',

        state:
          'Tercatat',

        technicalData: {},
      } as OperationalWorkflowState[
        'dailyRecords'
      ][number],
    ];
  }

  /* =======================================================
     TAHAP 3B
     Paket sengaja berada di checkpoint 14 hari
     dengan satu temuan aktif.
     ======================================================= */

  state.cycle = {
    ...state.cycle,

    selectedTypes: [
      ...state.project
        .surveyTypes,
    ],

    periodCompleted:
      true,

    consistency:
      'Tidak Konsisten',

    userReview:
      'Temuan',

    userReviewNote:
      'Terdapat hasil repeatability yang perlu ditindaklanjuti.',

    certificateId:
      '',

    heldRecordIds:
      state.dailyRecords
        .slice(0, 1)
        .map(
          record => record.id,
        ),
  };

  const finding:
    CorrectionCase = {
    id:
      'KOR-JBR-001',

    source:
      'Verval 14 hari',

    blockedStage:
      'Verval 14 hari',

    road:
      'Bandung-Cileunyi',

    stationing:
      'STA 12+400 - 12+900',

    rejectionReason:
      'Hasil pemeriksaan berkala belum konsisten dan perlu bukti perbaikan.',

    severity:
      'Mayor',

    owner:
      'Ketua Tim Penyedia',

    dueDate:
      '2027-06-20',

    rootCause:
      '',

    fieldDataValid:
      '',

    surveyType:
      'PCI',

    actionType:
      '',

    evidence:
      '',

    originalValue:
      'Data sumber tetap dipertahankan. Koreksi dilakukan pada sistem sumber bila diperlukan.',

    proposedValue:
      '',

    approval:
      'Draft',

    retest:
      'Belum Diuji',

    status:
      'Terbuka',

    returnStage:
      'Verval 14 hari',

    linkedRecordId:
      state.dailyRecords[0]
        ?.id,

    verification: {
      surveyor: false,
      teamLeader: false,
      balai: false,
    },

    reviewNote:
      '',
  };

  state.corrections = [
    finding,
  ];

  /* =======================================================
     TAHAP 4 belum boleh selesai karena temuan 3B.
     ======================================================= */

  state.submission = {
    ...state.submission,

    validationStatus:
      'Draft',

    validationMessage:
      'Tahap persiapan data menunggu penyelesaian temuan Verval Berkala.',
  };

  /* =======================================================
     TAHAP 5 belum dimulai.
     ======================================================= */

  state.audits = [
    {
      ...state.audits[0],
      status:
        'Belum Dimulai',
      sampleIds: [],
      decisionNote: '',
      baNumber: '',
      reviewChecks: {},
    },

    {
      ...state.audits[1],
      status:
        'Belum Dimulai',
      sampleIds: [],
      decisionNote: '',
      baNumber: '',
      reviewChecks: {},
    },

    {
      ...state.audits[2],
      status:
        'Belum Dimulai',
      sampleIds: [],
      decisionNote: '',
      baNumber: '',
      reviewChecks: {},
    },
  ];

  /* =======================================================
     TAHAP 6 belum dimulai.
     ======================================================= */

  state.acceptance = {
    ...state.acceptance,

    finalAcceptance:
      false,

    finalReport:
      false,

    semesterTwoRevalidation:
      false,

    finalAcceptanceBa:
      '',

    acceptanceDecision:
      'Belum Diperiksa',

    acceptanceRejectionReason:
      '',
  };

  return state;
}

/* =========================================================
   INITIAL STORE
   ========================================================= */

export function createInitialPackageStore():
  WorkflowPackageStore {
  return {
    activePackageId:
      null,

    activeRole:
      'Penyedia Jasa / Ketua Tim',

    packages: {
      'PAKET-DEMO-001':
        packageA(),

      'PAKET-DEMO-002':
        packageB(),
    },
  };
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function normalizePackage(
  state: OperationalWorkflowState,
  role: WorkflowRole,
): OperationalWorkflowState {
  return {
    ...state,

    role,

    project: {
      ...state.project,

      surveyTypes:
        (
          state.project
            .surveyTypes || []
        ) as SurveyType[],
    },
  };
}

/* =========================================================
   LOAD STORE
   ========================================================= */

export function loadWorkflowPackageStore():
  WorkflowPackageStore {
  const fallback =
    createInitialPackageStore();

  if (
    typeof window ===
    'undefined'
  ) {
    return fallback;
  }

  try {
    const raw =
      window.localStorage.getItem(
        PACKAGE_STORE_KEY,
      );

    if (!raw) {
      return fallback;
    }

    const parsed =
      JSON.parse(
        raw,
      ) as Partial<
        WorkflowPackageStore
      >;

    if (
      !parsed.packages ||
      !Object.keys(
        parsed.packages,
      ).length
    ) {
      return fallback;
    }

    const activeRole =
      parsed.activeRole ??
      fallback.activeRole;

    const packages =
      Object.fromEntries(
        Object.entries(
          parsed.packages,
        ).map(
          ([
            id,
            state,
          ]) => [
            id,

            normalizePackage(
              state as OperationalWorkflowState,
              activeRole,
            ),
          ],
        ),
      ) as Record<
        string,
        OperationalWorkflowState
      >;

    for (
      const [
        id,
        state,
      ] of Object.entries(
        fallback.packages,
      )
    ) {
      if (!packages[id]) {
        packages[id] =
          normalizePackage(
            state,
            activeRole,
          );
      }
    }

    return {
      activePackageId:
        parsed.activePackageId &&
        packages[
          parsed.activePackageId
        ]
          ? parsed.activePackageId
          : null,

      activeRole,

      packages,
    };
  } catch {
    return fallback;
  }
}

/* =========================================================
   PACKAGE STAGE
   ========================================================= */

export function derivePackageStage(
  state: OperationalWorkflowState,
): string {
  /* Tahap 0 */
  if (
    state.project.preparation
      .reportApproval !==
    'Disetujui'
  ) {
    return 'Tahap 0';
  }

  /* Tahap 1 */
  const calibrationReady =
    state.project.surveyTypes
      .length > 0 &&
    state.project.surveyTypes.every(
      type =>
        !!state
          .calibrationChecklist[
          type
        ] &&
        state.calibrations.some(
          record =>
            record.surveyType ===
              type &&
            record.condition ===
              'Baik' &&
            record
              .qualificationValid &&
            record
              .trainingVerified &&
            record.dueDate >=
              state.simulationDate,
        ),
    );

  if (!calibrationReady) {
    return 'Tahap 1';
  }

  /* Tahap 2 */
  if (
    state.productionApproval !==
    'Disetujui'
  ) {
    return 'Tahap 2';
  }

  /* Tahap 3A */
  if (
    !state.dailyRecords.length
  ) {
    return 'Tahap 3A';
  }

  /* Tahap 3B */
  if (
    state.corrections.some(
      item =>
        item.status !==
        'Ditutup',
    ) ||
    state.cycle.consistency !==
      'Konsisten' ||
    state.cycle.userReview !==
      'Sesuai'
  ) {
    return 'Tahap 3B';
  }

  /* Tahap 4 */
  if (
    state.submission
      .validationStatus !==
    'VALID'
  ) {
    return 'Tahap 4';
  }

  /* Tahap 5 */
  if (
    state.audits.some(
      item =>
        item.status !==
        'Lulus',
    )
  ) {
    return 'Tahap 5';
  }

  /* Tahap 6 */
  if (
    !state.acceptance
      .finalAcceptance
  ) {
    return 'Tahap 6';
  }

  return 'Selesai';
}

/* =========================================================
   MENUNGGU ROLE
   ========================================================= */

export function packageWaitingFor(
  state: OperationalWorkflowState,
): string {
  if (
    state.project.preparation
      .reportApproval ===
    'Diajukan'
  ) {
    return 'PIC Balai';
  }

  if (
    state.project.preparation
      .reportApproval ===
      'Perlu Revisi' ||
    state.project.preparation
      .reportApproval ===
      'Draft'
  ) {
    return 'Penyedia';
  }

  if (
    state.productionApproval ===
    'Diajukan'
  ) {
    return 'PIC Balai';
  }

  if (
    state.productionApproval ===
      'Perlu Revisi' ||
    state.productionApproval ===
      'Draft'
  ) {
    return 'Penyedia';
  }

  if (
    state.corrections.some(
      item =>
        item.status !==
        'Ditutup',
    )
  ) {
    return 'Penyedia';
  }

  if (
    state.cycle.userReview !==
    'Sesuai'
  ) {
    return 'PIC Balai';
  }

  if (
    state.audits[0].status !==
    'Lulus'
  ) {
    return 'Penyedia';
  }

  if (
    state.audits[1].status !==
    'Lulus'
  ) {
    return 'PIC Balai';
  }

  if (
    state.audits[2].status !==
    'Lulus'
  ) {
    return 'Direktorat';
  }

  if (
    !state.acceptance
      .finalAcceptance
  ) {
    return 'PIC Balai';
  }

  return '-';
}

/* =========================================================
   STATUS PAKET
   ========================================================= */

export function packageStatus(
  state: OperationalWorkflowState,
): string {
  if (
    state.corrections.some(
      item =>
        item.status !==
        'Ditutup',
    )
  ) {
    return 'Perlu tindak lanjut';
  }

  const stage =
    derivePackageStage(
      state,
    );

  if (
    stage ===
    'Selesai'
  ) {
    return 'Diterima';
  }

  if (
    state.project.preparation
      .reportApproval ===
      'Diajukan' ||
    state.productionApproval ===
      'Diajukan'
  ) {
    return 'Dalam review';
  }

  return 'Berjalan';
}