import {
  activityData,
  currentUser,
  getFormDetails,
  statsData,
  submissions as seedSubmissions,
  weeklyData,
} from '@/lib/data';

type DisplayStatus = 'Accepted' | 'Pending' | 'Rejected' | 'Expired';
type ActionType = 'approve' | 'reject' | 'sendback';

type MutableSubmission = {
  id: string;
  studentName: string;
  email: string;
  rollNo: string;
  department: string;
  formId: number;
  formTitle: string;
  submissionDate: string;
  deadline: string;
  status: DisplayStatus;
  overallStatus: string;
  currentLevel: number;
  totalLevels: number;
  currentVerifier: string;
  currentVerifierRole: string;
  myLevel: number | null;
  canAct: boolean;
};

type MockStore = {
  submissions: MutableSubmission[];
};

const WORKFLOW_ROLES = ['Caretaker', 'HOD', 'Dean', 'Accounts Office', 'Faculty Advisor'];

function parseRole(label: string): string {
  return label.split('-')[0].trim();
}

function formIdsFromSeed() {
  const ids = new Map<string, number>();
  let nextId = 1;

  for (const submission of seedSubmissions) {
    if (!ids.has(submission.formName)) {
      ids.set(submission.formName, nextId++);
    }
  }

  return ids;
}

function createInitialStore(): MockStore {
  const formIds = formIdsFromSeed();

  return {
    submissions: seedSubmissions.map((submission) => ({
      id: submission.id,
      studentName: submission.studentName,
      email: `${submission.rollNo.toLowerCase()}@iitrpr.ac.in`,
      rollNo: submission.rollNo,
      department: submission.department,
      formId: formIds.get(submission.formName) ?? 0,
      formTitle: submission.formName,
      submissionDate: submission.submissionDate,
      deadline: submission.deadline,
      status: submission.status,
      overallStatus: submission.status,
      currentLevel: submission.currentLevel,
      totalLevels: submission.totalLevels,
      currentVerifier: submission.currentVerifier,
      currentVerifierRole: parseRole(submission.currentVerifier),
      myLevel: submission.status === 'Pending' ? submission.currentLevel : null,
      canAct: submission.status === 'Pending',
    })),
  };
}

function getStore(): MockStore {
  const globalWithStore = globalThis as typeof globalThis & {
    __verifierMockStore?: MockStore;
  };

  if (!globalWithStore.__verifierMockStore) {
    globalWithStore.__verifierMockStore = createInitialStore();
  }

  return globalWithStore.__verifierMockStore;
}

function isExpired(deadline: string) {
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(23, 59, 59, 999);
  return deadlineDate.getTime() < Date.now();
}

function toDisplayStatus(submission: MutableSubmission): DisplayStatus {
  if (submission.overallStatus === 'Rejected') return 'Rejected';
  if (submission.overallStatus === 'Accepted') return 'Accepted';
  if (isExpired(submission.deadline)) return 'Expired';
  return 'Pending';
}

function toApiSubmission(submission: MutableSubmission) {
  const displayStatus = toDisplayStatus(submission);

  return {
    id: submission.id,
    studentName: submission.studentName,
    email: submission.email,
    formId: submission.formId,
    formTitle: submission.formTitle,
    submissionDate: submission.submissionDate,
    deadline: submission.deadline,
    isExpired: isExpired(submission.deadline),
    status: displayStatus,
    overallStatus: submission.overallStatus,
    currentLevel: submission.currentLevel,
    totalLevels: submission.totalLevels,
    currentVerifier: submission.currentVerifier,
    currentVerifierRole: submission.currentVerifierRole,
    myLevel: submission.myLevel,
    canAct: submission.canAct,
  };
}

function buildWorkflow(submission: MutableSubmission) {
  return Array.from({ length: submission.totalLevels }, (_, index) => {
    const level = index + 1;
    const role =
      level === submission.currentLevel && submission.overallStatus === 'Pending'
        ? submission.currentVerifierRole
        : WORKFLOW_ROLES[index] ?? `Level ${level}`;

    const verifierName =
      level === submission.currentLevel && submission.overallStatus === 'Pending'
        ? submission.currentVerifier
        : `${role} Reviewer`;

    const status =
      submission.overallStatus === 'Rejected' && level >= submission.currentLevel
        ? level === submission.currentLevel
          ? 'Current'
          : 'Pending'
        : level < submission.currentLevel
          ? 'Completed'
          : level === submission.currentLevel && submission.overallStatus === 'Pending'
            ? 'Current'
            : submission.overallStatus === 'Accepted' && level <= submission.totalLevels
              ? 'Completed'
              : 'Pending';

    return {
      level,
      verifierId: `verifier-${level}`,
      verifierName,
      role,
      department: submission.department,
      status,
      actionStatus: status === 'Completed' ? 'Approved' : null,
      remark: null,
      date: status === 'Completed' ? submission.submissionDate : null,
    };
  });
}

export function getDashboardPayload() {
  const store = getStore();
  const apiSubs = store.submissions.map(toApiSubmission);

  const stats = {
    allSubmissions: apiSubs.length,
    accepted: apiSubs.filter((item) => item.status === 'Accepted').length,
    rejected: apiSubs.filter((item) => item.status === 'Rejected').length,
    pending: apiSubs.filter((item) => item.status === 'Pending').length,
    expired: apiSubs.filter((item) => item.status === 'Expired').length,
  };

  return {
    data: {
      verifier: {
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        department: currentUser.department ?? 'CSE',
      },
      stats: stats.allSubmissions ? stats : statsData,
      weeklyData,
      recentSubmissions: apiSubs.slice(0, 5),
    },
  };
}

export function getAllSubmissions(filters: {
  status?: string;
  formId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  const store = getStore();
  let submissions = store.submissions.map(toApiSubmission);

  if (filters.status && filters.status !== 'All') {
    submissions = submissions.filter((item) => item.status === filters.status);
  }

  if (filters.formId) {
    submissions = submissions.filter((item) => String(item.formId) === filters.formId);
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    submissions = submissions.filter((item) =>
      item.studentName.toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term) ||
      item.formTitle.toLowerCase().includes(term)
    );
  }

  if (filters.startDate) {
    submissions = submissions.filter((item) => item.submissionDate >= filters.startDate!);
  }

  if (filters.endDate) {
    submissions = submissions.filter((item) => item.submissionDate <= filters.endDate!);
  }

  const allApiSubs = store.submissions.map(toApiSubmission);
  const formOptions = Array.from(
    new Map(allApiSubs.map((item) => [item.formId, { id: item.formId, title: item.formTitle }])).values()
  );

  return {
    submissions,
    stats: {
      total: allApiSubs.length,
      pending: allApiSubs.filter((item) => item.status === 'Pending').length,
      accepted: allApiSubs.filter((item) => item.status === 'Accepted').length,
      rejected: allApiSubs.filter((item) => item.status === 'Rejected').length,
      expired: allApiSubs.filter((item) => item.status === 'Expired').length,
    },
    formOptions,
  };
}

export function getPendingApprovals() {
  const store = getStore();
  const pending = store.submissions
    .map(toApiSubmission)
    .filter((item) => item.status === 'Pending');

  const urgent = pending.filter((item) => {
    const diff = new Date(item.deadline).getTime() - Date.now();
    return diff >= 0 && diff <= 2 * 24 * 60 * 60 * 1000;
  }).length;

  return {
    submissions: pending,
    stats: {
      total: pending.length,
      canActNow: pending.filter((item) => item.canAct).length,
      expired: pending.filter((item) => item.isExpired).length,
      urgent,
    },
  };
}

export function getSubmissionDetails(id: string) {
  const store = getStore();
  const submission = store.submissions.find((item) => item.id === id);

  if (!submission) {
    return null;
  }

  const formDetails = getFormDetails(id);
  const workflow = buildWorkflow(submission);
  const nextVerifier = workflow.find((stage) => stage.level === submission.currentLevel + 1) ?? null;

  return {
    submission: {
      id: submission.id,
      status: toDisplayStatus(submission),
      overallStatus: submission.overallStatus,
      currentLevel: submission.currentLevel,
      totalLevels: submission.totalLevels,
      submissionDate: submission.submissionDate,
    },
    student: {
      id: submission.rollNo,
      name: submission.studentName,
      email: submission.email,
    },
    form: {
      id: submission.formId,
      title: submission.formTitle,
      description: `${submission.formTitle} review request`,
      deadline: submission.deadline,
      isExpired: isExpired(submission.deadline),
    },
    fields: formDetails.fields.map((field) => ({
      ...field,
      type: 'text',
    })),
    workflow,
    verifierContext: {
      verifierId: `verifier-${submission.currentLevel}`,
      level: submission.myLevel,
      isCurrentVerifier: submission.canAct,
      isLastVerifier: submission.currentLevel >= submission.totalLevels,
      canAct: submission.canAct,
      nextVerifier,
    },
  };
}

export function performSubmissionAction(id: string, action: ActionType, remark?: string) {
  const store = getStore();
  const submission = store.submissions.find((item) => item.id === id);

  if (!submission) {
    return { ok: false, error: 'Submission not found' };
  }

  if (submission.overallStatus !== 'Pending') {
    return { ok: false, error: 'This submission is already closed' };
  }

  if (action === 'reject') {
    submission.status = 'Rejected';
    submission.overallStatus = 'Rejected';
    submission.canAct = false;
    submission.myLevel = null;
  } else if (action === 'sendback') {
    submission.currentLevel = Math.max(1, submission.currentLevel - 1);
    submission.currentVerifier = 'Student';
    submission.currentVerifierRole = 'Student';
    submission.canAct = false;
    submission.myLevel = null;
  } else if (submission.currentLevel >= submission.totalLevels) {
    submission.status = 'Accepted';
    submission.overallStatus = 'Accepted';
    submission.canAct = false;
    submission.myLevel = null;
  } else {
    submission.currentLevel += 1;
    submission.currentVerifierRole = WORKFLOW_ROLES[submission.currentLevel - 1] ?? `Level ${submission.currentLevel}`;
    submission.currentVerifier = `${submission.currentVerifierRole} Reviewer`;
    submission.canAct = false;
    submission.myLevel = null;
  }

  return {
    ok: true,
    action,
    remark: remark ?? null,
    submission: toApiSubmission(submission),
    activity: activityData[0] ?? null,
  };
}
