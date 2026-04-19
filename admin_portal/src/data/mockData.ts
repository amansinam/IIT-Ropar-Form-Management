export type SubmissionStatus = 'Approved' | 'Pending' | 'Rejected';
export type FormStatus = 'Active' | 'Draft';
export type FormFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'file'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'textarea'
  | 'email'
  | 'tel';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  authMethod: string;
  registeredDate: string;
  formsSubmitted: number;
}

export interface MockFormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  isCustom?: boolean;
}

export interface MockForm {
  id: string;
  name: string;
  createdDate: string;
  status: FormStatus;
  deadline: string;
  submissionsCount: number;
  description: string;
  category: string;
  lastUpdated: string;
  verificationFlow: string[];
  fields: MockFormField[];
}

export interface MockSubmission {
  id: string;
  formId: string;
  user: string;
  userEmail: string;
  rollNumber: string;
  department: string;
  formName: string;
  dateSubmitted: string;
  status: SubmissionStatus;
  verifierLevel: string;
  currentVerifier: string;
  responses: Record<string, string>;
}

export interface MockMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  joinedDate: string;
  office: string;
  activeFormsHandled: number;
  avatar: string;
}

function createMemberAvatar(initials: string, start: string, end: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="36" fill="url(#g)" />
      <circle cx="80" cy="62" r="28" fill="rgba(255,255,255,0.22)" />
      <path d="M38 130c10-22 31-34 42-34s32 12 42 34" fill="rgba(255,255,255,0.18)" />
      <text x="80" y="146" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const mockUsers: MockUser[] = [
  { id: 'u1', name: 'Arjun Sharma', email: 'arjun.sharma@iitrpr.ac.in', authMethod: 'Google', registeredDate: '2024-08-01', formsSubmitted: 5 },
  { id: 'u2', name: 'Priya Patel', email: 'priya.patel@iitrpr.ac.in', authMethod: 'Email', registeredDate: '2024-08-05', formsSubmitted: 3 },
  { id: 'u3', name: 'Rahul Kumar', email: 'rahul.kumar@iitrpr.ac.in', authMethod: 'Google', registeredDate: '2024-08-10', formsSubmitted: 8 },
  { id: 'u4', name: 'Sneha Gupta', email: 'sneha.gupta@iitrpr.ac.in', authMethod: 'Email', registeredDate: '2024-08-12', formsSubmitted: 2 },
  { id: 'u5', name: 'Vikram Singh', email: 'vikram.singh@iitrpr.ac.in', authMethod: 'Google', registeredDate: '2024-08-15', formsSubmitted: 6 },
  { id: 'u6', name: 'Ananya Mishra', email: 'ananya.mishra@iitrpr.ac.in', authMethod: 'Email', registeredDate: '2024-08-18', formsSubmitted: 4 },
  { id: 'u7', name: 'Karan Verma', email: 'karan.verma@iitrpr.ac.in', authMethod: 'Google', registeredDate: '2024-09-01', formsSubmitted: 7 },
  { id: 'u8', name: 'Divya Nair', email: 'divya.nair@iitrpr.ac.in', authMethod: 'Email', registeredDate: '2024-09-05', formsSubmitted: 1 },
  { id: 'u9', name: 'Amit Joshi', email: 'amit.joshi@iitrpr.ac.in', authMethod: 'Google', registeredDate: '2024-09-10', formsSubmitted: 9 },
  { id: 'u10', name: 'Pooja Reddy', email: 'pooja.reddy@iitrpr.ac.in', authMethod: 'Email', registeredDate: '2024-09-15', formsSubmitted: 3 },
];

export const mockForms: MockForm[] = [
  {
    id: 'f1',
    name: 'Hostel Leave Application',
    createdDate: '2024-08-01',
    status: 'Active',
    deadline: '2025-12-31',
    submissionsCount: 34,
    description: 'Collect leave requests from hostel residents with parent contact and stay details.',
    category: 'Student Affairs',
    lastUpdated: '2025-03-11',
    verificationFlow: ['Caretaker', 'HOD', 'Dean'],
    fields: [
      { id: 'name', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter full name' },
      { id: 'roll', label: 'Roll Number', type: 'text', required: true, placeholder: 'Enter roll number' },
      { id: 'from', label: 'Leave Start Date', type: 'date', required: true },
      { id: 'to', label: 'Leave End Date', type: 'date', required: true },
      { id: 'reason', label: 'Reason', type: 'textarea', required: true, placeholder: 'Explain the reason for leave' },
    ],
  },
  {
    id: 'f2',
    name: 'NOC for Internship',
    createdDate: '2024-08-10',
    status: 'Active',
    deadline: '2025-06-30',
    submissionsCount: 21,
    description: 'Used by students applying for institute approval before starting internships.',
    category: 'Academics',
    lastUpdated: '2025-03-09',
    verificationFlow: ['Faculty', 'HOD', 'Dean'],
    fields: [
      { id: 'student', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter full name' },
      { id: 'company', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name' },
      { id: 'duration', label: 'Internship Duration', type: 'text', required: true, placeholder: 'e.g. 8 weeks' },
      { id: 'offer', label: 'Offer Letter', type: 'file', required: true },
    ],
  },
  {
    id: 'f3',
    name: 'Fee Waiver Request',
    createdDate: '2024-08-20',
    status: 'Draft',
    deadline: '2025-03-31',
    submissionsCount: 0,
    description: 'Fee waiver request form for students requesting financial consideration.',
    category: 'Finance',
    lastUpdated: '2025-02-26',
    verificationFlow: ['Admin', 'Dean'],
    fields: [
      { id: 'student', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter full name' },
      { id: 'income', label: 'Family Income', type: 'number', required: true, placeholder: 'Enter annual income' },
      { id: 'proof', label: 'Income Proof', type: 'file', required: true },
      { id: 'note', label: 'Supporting Note', type: 'textarea', required: false, placeholder: 'Optional explanation' },
    ],
  },
  {
    id: 'f4',
    name: 'Sports Event Participation',
    createdDate: '2024-09-01',
    status: 'Active',
    deadline: '2025-02-28',
    submissionsCount: 15,
    description: 'Registration and approval form for participation in institute sports events.',
    category: 'Sports',
    lastUpdated: '2025-03-01',
    verificationFlow: ['Faculty', 'Admin'],
    fields: [
      { id: 'name', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter full name' },
      { id: 'event', label: 'Event Name', type: 'select', required: true, options: ['Football', 'Cricket', 'Athletics', 'Badminton'] },
      { id: 'experience', label: 'Previous Experience', type: 'textarea', required: false, placeholder: 'Mention relevant experience' },
    ],
  },
  {
    id: 'f5',
    name: 'Lab Access Request',
    createdDate: '2024-09-15',
    status: 'Active',
    deadline: '2025-12-31',
    submissionsCount: 42,
    description: 'Request controlled access to research labs with faculty approval.',
    category: 'Research',
    lastUpdated: '2025-03-10',
    verificationFlow: ['Faculty', 'Admin'],
    fields: [
      { id: 'name', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter full name' },
      { id: 'lab', label: 'Requested Lab', type: 'text', required: true, placeholder: 'Enter lab name' },
      { id: 'slot', label: 'Preferred Time Slot', type: 'text', required: true, placeholder: 'e.g. 4 PM to 6 PM' },
      { id: 'purpose', label: 'Purpose', type: 'textarea', required: true, placeholder: 'Why do you need access?' },
    ],
  },
  {
    id: 'f6',
    name: 'Project Funding Application',
    createdDate: '2024-10-01',
    status: 'Draft',
    deadline: '2025-05-31',
    submissionsCount: 0,
    description: 'Apply for project funding with budget and expected outcomes.',
    category: 'Research',
    lastUpdated: '2025-02-15',
    verificationFlow: ['Faculty', 'Dean'],
    fields: [
      { id: 'title', label: 'Project Title', type: 'text', required: true, placeholder: 'Enter project title' },
      { id: 'budget', label: 'Budget Required', type: 'number', required: true, placeholder: 'Enter budget amount' },
      { id: 'proposal', label: 'Proposal Summary', type: 'textarea', required: true, placeholder: 'Summarize the proposal' },
    ],
  },
  {
    id: 'f7',
    name: 'Medical Leave Form',
    createdDate: '2024-10-10',
    status: 'Active',
    deadline: '2025-12-31',
    submissionsCount: 28,
    description: 'Medical leave request with attachments for prescriptions and medical notes.',
    category: 'Student Affairs',
    lastUpdated: '2025-03-08',
    verificationFlow: ['HOD', 'Admin'],
    fields: [
      { id: 'name', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter full name' },
      { id: 'from', label: 'Leave Start Date', type: 'date', required: true },
      { id: 'to', label: 'Leave End Date', type: 'date', required: true },
      { id: 'certificate', label: 'Medical Certificate', type: 'file', required: true },
    ],
  },
  {
    id: 'f8',
    name: 'Scholarship Application',
    createdDate: '2024-10-20',
    status: 'Active',
    deadline: '2025-01-31',
    submissionsCount: 19,
    description: 'Apply for institute scholarship programs with academic and income details.',
    category: 'Finance',
    lastUpdated: '2025-02-27',
    verificationFlow: ['Faculty', 'Dean', 'Admin'],
    fields: [
      { id: 'name', label: 'Student Name', type: 'text', required: true, placeholder: 'Enter full name' },
      { id: 'cgpa', label: 'Current CGPA', type: 'number', required: true, placeholder: 'Enter CGPA' },
      { id: 'income', label: 'Family Income', type: 'number', required: true, placeholder: 'Enter annual income' },
      { id: 'essay', label: 'Scholarship Essay', type: 'textarea', required: true, placeholder: 'Describe why you should be considered' },
    ],
  },
];

export const mockSubmissions: MockSubmission[] = [
  {
    id: 's1',
    formId: 'f1',
    user: 'Arjun Sharma',
    userEmail: 'arjun.sharma@iitrpr.ac.in',
    rollNumber: '2023CS1012',
    department: 'Computer Science',
    formName: 'Hostel Leave Application',
    dateSubmitted: '2025-02-20',
    status: 'Pending',
    verifierLevel: 'HOD',
    currentVerifier: 'HOD',
    responses: {
      'Student Name': 'Arjun Sharma',
      'Roll Number': '2023CS1012',
      'Leave Start Date': '2025-02-25',
      'Leave End Date': '2025-02-28',
      Reason: 'Family function in Jaipur.',
    },
  },
  {
    id: 's2',
    formId: 'f2',
    user: 'Priya Patel',
    userEmail: 'priya.patel@iitrpr.ac.in',
    rollNumber: '2022EE1041',
    department: 'Electrical Engineering',
    formName: 'NOC for Internship',
    dateSubmitted: '2025-02-21',
    status: 'Approved',
    verifierLevel: 'Dean',
    currentVerifier: 'Dean',
    responses: {
      'Student Name': 'Priya Patel',
      'Company Name': 'Texas Instruments',
      'Internship Duration': '10 weeks',
      'Offer Letter': 'offer-letter-priya.pdf',
    },
  },
  {
    id: 's3',
    formId: 'f3',
    user: 'Rahul Kumar',
    userEmail: 'rahul.kumar@iitrpr.ac.in',
    rollNumber: '2021ME1089',
    department: 'Mechanical Engineering',
    formName: 'Fee Waiver Request',
    dateSubmitted: '2025-02-22',
    status: 'Rejected',
    verifierLevel: 'Admin',
    currentVerifier: 'Admin',
    responses: {
      'Student Name': 'Rahul Kumar',
      'Family Income': '420000',
      'Income Proof': 'income-proof-rahul.pdf',
      'Supporting Note': 'Requesting partial waiver due to medical expenses.',
    },
  },
  {
    id: 's4',
    formId: 'f4',
    user: 'Sneha Gupta',
    userEmail: 'sneha.gupta@iitrpr.ac.in',
    rollNumber: '2023CH1021',
    department: 'Chemical Engineering',
    formName: 'Sports Event Participation',
    dateSubmitted: '2025-02-23',
    status: 'Pending',
    verifierLevel: 'Caretaker',
    currentVerifier: 'Caretaker',
    responses: {
      'Student Name': 'Sneha Gupta',
      'Event Name': 'Athletics',
      'Previous Experience': 'Represented hostel team in 400m race.',
    },
  },
  {
    id: 's5',
    formId: 'f5',
    user: 'Vikram Singh',
    userEmail: 'vikram.singh@iitrpr.ac.in',
    rollNumber: '2022PH1034',
    department: 'Physics',
    formName: 'Lab Access Request',
    dateSubmitted: '2025-02-24',
    status: 'Approved',
    verifierLevel: 'Faculty',
    currentVerifier: 'Faculty',
    responses: {
      'Student Name': 'Vikram Singh',
      'Requested Lab': 'Photonics Lab',
      'Preferred Time Slot': '4 PM to 6 PM',
      Purpose: 'Testing optical sensor setup.',
    },
  },
  {
    id: 's6',
    formId: 'f7',
    user: 'Ananya Mishra',
    userEmail: 'ananya.mishra@iitrpr.ac.in',
    rollNumber: '2024CE1017',
    department: 'Civil Engineering',
    formName: 'Medical Leave Form',
    dateSubmitted: '2025-02-25',
    status: 'Pending',
    verifierLevel: 'HOD',
    currentVerifier: 'HOD',
    responses: {
      'Student Name': 'Ananya Mishra',
      'Leave Start Date': '2025-02-25',
      'Leave End Date': '2025-03-01',
      'Medical Certificate': 'ananya-certificate.pdf',
    },
  },
  {
    id: 's7',
    formId: 'f8',
    user: 'Karan Verma',
    userEmail: 'karan.verma@iitrpr.ac.in',
    rollNumber: '2022CS1033',
    department: 'Computer Science',
    formName: 'Scholarship Application',
    dateSubmitted: '2025-02-26',
    status: 'Approved',
    verifierLevel: 'Dean',
    currentVerifier: 'Dean',
    responses: {
      'Student Name': 'Karan Verma',
      'Current CGPA': '9.1',
      'Family Income': '300000',
      'Scholarship Essay': 'Seeking support to continue advanced research work.',
    },
  },
  {
    id: 's8',
    formId: 'f1',
    user: 'Divya Nair',
    userEmail: 'divya.nair@iitrpr.ac.in',
    rollNumber: '2021HS1024',
    department: 'Humanities',
    formName: 'Hostel Leave Application',
    dateSubmitted: '2025-02-27',
    status: 'Rejected',
    verifierLevel: 'Caretaker',
    currentVerifier: 'Caretaker',
    responses: {
      'Student Name': 'Divya Nair',
      'Roll Number': '2021HS1024',
      'Leave Start Date': '2025-03-03',
      'Leave End Date': '2025-03-05',
      Reason: 'Personal travel request.',
    },
  },
  {
    id: 's9',
    formId: 'f2',
    user: 'Amit Joshi',
    userEmail: 'amit.joshi@iitrpr.ac.in',
    rollNumber: '2023EE1020',
    department: 'Electrical Engineering',
    formName: 'NOC for Internship',
    dateSubmitted: '2025-03-01',
    status: 'Pending',
    verifierLevel: 'Faculty',
    currentVerifier: 'Faculty',
    responses: {
      'Student Name': 'Amit Joshi',
      'Company Name': 'NVIDIA',
      'Internship Duration': '8 weeks',
      'Offer Letter': 'amit-offer.pdf',
    },
  },
  {
    id: 's10',
    formId: 'f5',
    user: 'Pooja Reddy',
    userEmail: 'pooja.reddy@iitrpr.ac.in',
    rollNumber: '2022BT1015',
    department: 'Biomedical Engineering',
    formName: 'Lab Access Request',
    dateSubmitted: '2025-03-02',
    status: 'Approved',
    verifierLevel: 'Admin',
    currentVerifier: 'Admin',
    responses: {
      'Student Name': 'Pooja Reddy',
      'Requested Lab': 'Bioinstrumentation Lab',
      'Preferred Time Slot': '10 AM to 12 PM',
      Purpose: 'Prototype testing for capstone project.',
    },
  },
];

export const mockMembers: MockMember[] = [
  { id: 'm1', name: 'Dr. Suresh Kumar', email: 'suresh.kumar@iitrpr.ac.in', role: 'HOD', department: 'Computer Science', phone: '+91 98765 43210', joinedDate: '2023-07-15', office: 'Room C-214', activeFormsHandled: 14, avatar: createMemberAvatar('SK', '#1d4ed8', '#06b6d4') },
  { id: 'm2', name: 'Prof. Anita Singh', email: 'anita.singh@iitrpr.ac.in', role: 'Dean', department: 'Academic Affairs', phone: '+91 98765 43211', joinedDate: '2022-04-08', office: 'Admin Block 301', activeFormsHandled: 10, avatar: createMemberAvatar('AS', '#7c3aed', '#ec4899') },
  { id: 'm3', name: 'Mr. Rajesh Verma', email: 'rajesh.verma@iitrpr.ac.in', role: 'Caretaker', department: 'Hostel Affairs', phone: '+91 98765 43212', joinedDate: '2024-01-12', office: 'Hostel Office 02', activeFormsHandled: 18, avatar: createMemberAvatar('RV', '#0f766e', '#14b8a6') },
  { id: 'm4', name: 'Dr. Meena Sharma', email: 'meena.sharma@iitrpr.ac.in', role: 'Faculty', department: 'Electrical Engineering', phone: '+91 98765 43213', joinedDate: '2021-11-21', office: 'EE Block 118', activeFormsHandled: 9, avatar: createMemberAvatar('MS', '#d97706', '#f59e0b') },
  { id: 'm5', name: 'Mr. Anil Kumar', email: 'anil.kumar@iitrpr.ac.in', role: 'Admin', department: 'Administration', phone: '+91 98765 43214', joinedDate: '2020-06-01', office: 'Admin Block 112', activeFormsHandled: 22, avatar: createMemberAvatar('AK', '#b91c1c', '#ef4444') },
  { id: 'm6', name: 'Dr. Pradeep Gupta', email: 'pradeep.gupta@iitrpr.ac.in', role: 'HOD', department: 'Mechanical Engineering', phone: '+91 98765 43215', joinedDate: '2023-01-09', office: 'ME Block 204', activeFormsHandled: 11, avatar: createMemberAvatar('PG', '#4338ca', '#6366f1') },
  { id: 'm7', name: 'Prof. Kavita Rao', email: 'kavita.rao@iitrpr.ac.in', role: 'Faculty', department: 'Physics', phone: '+91 98765 43216', joinedDate: '2022-09-18', office: 'Physics Wing 15', activeFormsHandled: 8, avatar: createMemberAvatar('KR', '#0f766e', '#22c55e') },
  { id: 'm8', name: 'Mr. Deepak Mishra', email: 'deepak.mishra@iitrpr.ac.in', role: 'Caretaker', department: 'Hostel Affairs', phone: '+91 98765 43217', joinedDate: '2024-02-05', office: 'Hostel Office 04', activeFormsHandled: 13, avatar: createMemberAvatar('DM', '#0891b2', '#38bdf8') },
];

export const mockActivityLogs = [
  { id: 'a1', timestamp: '2025-03-05 09:15:32', admin: 'Admin User', action: 'Approved Leave Application', target: 'Form #S1023' },
  { id: 'a2', timestamp: '2025-03-05 09:45:10', admin: 'Admin User', action: 'Created Hostel Leave Form', target: 'Form #F0012' },
  { id: 'a3', timestamp: '2025-03-04 14:22:05', admin: 'Dr. Suresh Kumar', action: 'Rejected Fee Waiver Request', target: 'Form #S1019' },
  { id: 'a4', timestamp: '2025-03-04 11:05:44', admin: 'Prof. Anita Singh', action: 'Edited NOC for Internship Form', target: 'Form #F0008' },
  { id: 'a5', timestamp: '2025-03-03 16:30:22', admin: 'Admin User', action: 'Added New Member', target: 'Mr. Deepak Mishra' },
  { id: 'a6', timestamp: '2025-03-03 13:15:00', admin: 'Dr. Suresh Kumar', action: 'Approved Medical Leave Form', target: 'Form #S1018' },
  { id: 'a7', timestamp: '2025-03-02 10:50:15', admin: 'Admin User', action: 'Deactivated Sports Event Form', target: 'Form #F0004' },
  { id: 'a8', timestamp: '2025-03-02 09:20:33', admin: 'Prof. Anita Singh', action: 'Exported Users List', target: 'CSV Export' },
  { id: 'a9', timestamp: '2025-03-01 15:45:00', admin: 'Admin User', action: 'Bulk Approved 5 Submissions', target: 'Forms #S1010-S1015' },
  { id: 'a10', timestamp: '2025-03-01 11:30:00', admin: 'Dr. Meena Sharma', action: 'Deleted Member Profile', target: 'Staff #M0022' },
  { id: 'a11', timestamp: '2025-02-28 14:10:22', admin: 'Admin User', action: 'Updated Form Settings', target: 'Form #F0007' },
  { id: 'a12', timestamp: '2025-02-27 09:00:05', admin: 'Mr. Anil Kumar', action: 'Reset User Password', target: 'User arjun.sharma' },
  { id: 'a13', timestamp: '2025-03-06 10:18:41', admin: 'Mr. Rajesh Verma', action: 'Approved Hostel Leave Application', target: 'Form #S1034' },
  { id: 'a14', timestamp: '2025-03-06 12:05:19', admin: 'Dr. Meena Sharma', action: 'Approved Lab Access Request', target: 'Form #S1037' },
  { id: 'a15', timestamp: '2025-03-05 16:44:08', admin: 'Prof. Kavita Rao', action: 'Edited Scholarship Review Notes', target: 'Form #S1031' },
  { id: 'a16', timestamp: '2025-03-05 11:11:27', admin: 'Mr. Deepak Mishra', action: 'Verified Hostel Exit Entry', target: 'Form #S1028' },
  { id: 'a17', timestamp: '2025-03-04 17:05:53', admin: 'Dr. Pradeep Gupta', action: 'Approved Medical Leave Form', target: 'Form #S1021' },
  { id: 'a18', timestamp: '2025-03-04 10:20:15', admin: 'Prof. Anita Singh', action: 'Approved NOC for Internship', target: 'Form #S1016' },
];

export const chartSubmissionsData = [
  { day: 'Mon', submissions: 12, approved: 8, rejected: 2 },
  { day: 'Tue', submissions: 19, approved: 14, rejected: 3 },
  { day: 'Wed', submissions: 8, approved: 5, rejected: 1 },
  { day: 'Thu', submissions: 27, approved: 20, rejected: 4 },
  { day: 'Fri', submissions: 22, approved: 17, rejected: 3 },
  { day: 'Sat', submissions: 6, approved: 4, rejected: 1 },
  { day: 'Sun', submissions: 3, approved: 2, rejected: 0 },
];

export const chartStatusData = [
  { name: 'Approved', value: 63, color: '#22C55E' },
  { name: 'Pending', value: 24, color: '#F59E0B' },
  { name: 'Rejected', value: 13, color: '#EF4444' },
];

export function getFormById(formId: string) {
  return mockForms.find((form) => form.id === formId);
}

export function getSubmissionById(submissionId: string) {
  return mockSubmissions.find((submission) => submission.id === submissionId);
}

export function getSubmissionsForForm(formId: string) {
  return mockSubmissions.filter((submission) => submission.formId === formId);
}

export function getSubmissionStats(submissions: MockSubmission[]) {
  return {
    total: submissions.length,
    approved: submissions.filter((submission) => submission.status === 'Approved').length,
    pending: submissions.filter((submission) => submission.status === 'Pending').length,
    rejected: submissions.filter((submission) => submission.status === 'Rejected').length,
  };
}

export function getRecentSubmissions(formId?: string, limit = 6) {
  const records = formId ? getSubmissionsForForm(formId) : mockSubmissions;
  return [...records]
    .sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime())
    .slice(0, limit);
}

export function getMemberById(memberId: string) {
  return mockMembers.find((member) => member.id === memberId);
}

export function getActivitiesForAdmin(admin: string) {
  return mockActivityLogs.filter((log) => log.admin === admin);
}
