// Mock API service — replace with real API calls when backend is ready

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "email" | "date" | "dropdown" | "textarea" | "checkbox" | "file";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormDefinition {
  id: string;
  form_name: string;
  description: string;
  department: string;
  category: string;
  fields: FormField[];
  required_documents: string[];
  signature_required: boolean;
  template: string;
  workflow: WorkflowStep[];
}

export interface WorkflowStep {
  step: number;
  authority: string;
  status: "completed" | "pending" | "upcoming";
  comment?: string;
  date?: string;
}

export interface Submission {
  id: string;
  form_name: string;
  form_id: string;
  submitted_date: string;
  submitted_time: string;
  status: "Approved" | "Pending" | "Rejected" | "Under Review";
  current_authority: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  employee_code: string;
  avatar?: string;
  stats: {
    total_submitted: number;
    pending: number;
    approved: number;
  };
}

export interface Comment {
  id: string;
  authority: string;
  role: string;
  message: string;
  date: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockForms: FormDefinition[] = [
  {
    id: "med-claim-outdoor",
    form_name: "Medical Claim Form - Outdoor Treatment",
    description: "Claim reimbursement for outdoor medical expenses",
    department: "Medical",
    category: "Medical Forms",
    fields: [
      { id: "name", label: "Name & Designation of Govt. Servant (In Block Letters)", type: "text", required: true },
      { id: "marital_status", label: "Whether married or unmarried", type: "dropdown", required: true, options: ["Married", "Unmarried"] },
      { id: "spouse_place", label: "If married, place where wife/husband is employed", type: "text", required: false },
      { id: "emp_code", label: "Employee Code No.", type: "text", required: true },
      { id: "dept_section", label: "Dept. & Section", type: "text", required: true },
      { id: "pay_level", label: "Pay of Govt. Servant (Pay Level)", type: "text", required: true },
      { id: "address", label: "Residential Address", type: "textarea", required: true },
      { id: "patient_name", label: "Name of the patient & relationship with Govt. Servant", type: "text", required: true },
      { id: "place_fell_ill", label: "Place at which the patient fell ill", type: "text", required: true },
      { id: "amount_claimed", label: "Details of the amount claimed", type: "number", required: true },
      { id: "contact_no", label: "Contact No. of Employee", type: "text", required: true },
      { id: "bank_details", label: "Bank Details (Account No. & IFSC Code)", type: "text", required: true },
      { id: "total_amount", label: "Total Amount Claimed (Rs.)", type: "number", required: true },
      { id: "net_amount", label: "Net Amount Claimed (Rs.)", type: "number", required: true },
    ],
    required_documents: ["Medical Bills (Original)", "Prescription Copy", "Discharge Summary (if applicable)"],
    signature_required: true,
    template: "medical-claim",
    workflow: [
      { step: 1, authority: "Employee", status: "completed" },
      { step: 2, authority: "Section Officer", status: "completed" },
      { step: 3, authority: "Accounts Office", status: "pending" },
      { step: 4, authority: "Finance Office", status: "upcoming" },
    ],
  },
  {
    id: "leave-application",
    form_name: "Leave Application Form",
    description: "Apply for casual, earned, or medical leave",
    department: "Administration",
    category: "Administrative Forms",
    fields: [
      { id: "name", label: "Name of the Employee", type: "text", required: true },
      { id: "emp_code", label: "Employee Code", type: "text", required: true },
      { id: "department", label: "Department", type: "text", required: true },
      { id: "leave_type", label: "Type of Leave", type: "dropdown", required: true, options: ["Casual Leave", "Earned Leave", "Medical Leave", "Special Leave"] },
      { id: "from_date", label: "From Date", type: "date", required: true },
      { id: "to_date", label: "To Date", type: "date", required: true },
      { id: "reason", label: "Reason for Leave", type: "textarea", required: true },
      { id: "address_during", label: "Address during Leave", type: "textarea", required: false },
      { id: "contact", label: "Contact Number", type: "text", required: true },
    ],
    required_documents: [],
    signature_required: true,
    template: "leave-application",
    workflow: [
      { step: 1, authority: "Employee", status: "completed" },
      { step: 2, authority: "HOD", status: "pending" },
      { step: 3, authority: "Registrar", status: "upcoming" },
    ],
  },
  {
    id: "no-dues",
    form_name: "No Dues Certificate",
    description: "Request no dues clearance from all departments",
    department: "Administration",
    category: "Administrative Forms",
    fields: [
      { id: "name", label: "Full Name", type: "text", required: true },
      { id: "roll_no", label: "Roll Number / Employee Code", type: "text", required: true },
      { id: "department", label: "Department", type: "text", required: true },
      { id: "reason", label: "Purpose", type: "dropdown", required: true, options: ["Graduation", "Transfer", "Resignation", "Retirement"] },
      { id: "last_date", label: "Last Working Day", type: "date", required: true },
    ],
    required_documents: ["ID Card Copy"],
    signature_required: false,
    template: "no-dues",
    workflow: [
      { step: 1, authority: "Student/Employee", status: "completed" },
      { step: 2, authority: "Library", status: "pending" },
      { step: 3, authority: "Hostel Office", status: "upcoming" },
      { step: 4, authority: "Accounts", status: "upcoming" },
      { step: 5, authority: "Department", status: "upcoming" },
    ],
  },
  {
    id: "hostel-allotment",
    form_name: "Hostel Room Allotment Form",
    description: "Apply for hostel room allotment or change",
    department: "Hostel",
    category: "Hostel Forms",
    fields: [
      { id: "name", label: "Student Name", type: "text", required: true },
      { id: "roll_no", label: "Roll Number", type: "text", required: true },
      { id: "program", label: "Program", type: "dropdown", required: true, options: ["B.Tech", "M.Tech", "M.S.", "Ph.D.", "MBA"] },
      { id: "department", label: "Department", type: "text", required: true },
      { id: "year", label: "Year of Study", type: "dropdown", required: true, options: ["1st", "2nd", "3rd", "4th", "5th"] },
      { id: "current_hostel", label: "Current Hostel (if any)", type: "text", required: false },
      { id: "preferred_hostel", label: "Preferred Hostel", type: "text", required: false },
      { id: "reason", label: "Reason for Request", type: "textarea", required: true },
      { id: "contact", label: "Contact Number", type: "text", required: true },
      { id: "parent_contact", label: "Parent/Guardian Contact", type: "text", required: true },
    ],
    required_documents: ["Fee Receipt", "ID Card Copy"],
    signature_required: true,
    template: "hostel-allotment",
    workflow: [
      { step: 1, authority: "Student", status: "completed" },
      { step: 2, authority: "Warden", status: "pending" },
      { step: 3, authority: "Dean Student Affairs", status: "upcoming" },
    ],
  },
  {
    id: "thesis-submission",
    form_name: "Thesis/Dissertation Submission Form",
    description: "Submit thesis or dissertation for evaluation",
    department: "Academic",
    category: "Academic Forms",
    fields: [
      { id: "name", label: "Student Name", type: "text", required: true },
      { id: "roll_no", label: "Roll Number", type: "text", required: true },
      { id: "program", label: "Program", type: "dropdown", required: true, options: ["M.Tech", "M.S.", "Ph.D."] },
      { id: "department", label: "Department", type: "text", required: true },
      { id: "thesis_title", label: "Title of Thesis/Dissertation", type: "textarea", required: true },
      { id: "supervisor", label: "Name of Supervisor", type: "text", required: true },
      { id: "co_supervisor", label: "Name of Co-Supervisor (if any)", type: "text", required: false },
      { id: "submission_date", label: "Date of Submission", type: "date", required: true },
      { id: "num_copies", label: "Number of Hard Copies Submitted", type: "number", required: true },
    ],
    required_documents: ["Thesis Soft Copy (PDF)", "Plagiarism Report", "No Dues Certificate"],
    signature_required: true,
    template: "thesis-submission",
    workflow: [
      { step: 1, authority: "Student", status: "completed" },
      { step: 2, authority: "Supervisor", status: "pending" },
      { step: 3, authority: "Department PG Committee", status: "upcoming" },
      { step: 4, authority: "Dean Academic Affairs", status: "upcoming" },
    ],
  },
  {
    id: "travel-reimbursement",
    form_name: "Travel Reimbursement Form",
    description: "Claim reimbursement for official travel expenses",
    department: "Finance",
    category: "Finance Forms",
    fields: [
      { id: "name", label: "Name of Employee", type: "text", required: true },
      { id: "emp_code", label: "Employee Code", type: "text", required: true },
      { id: "department", label: "Department", type: "text", required: true },
      { id: "purpose", label: "Purpose of Travel", type: "textarea", required: true },
      { id: "destination", label: "Destination", type: "text", required: true },
      { id: "from_date", label: "Travel From Date", type: "date", required: true },
      { id: "to_date", label: "Travel To Date", type: "date", required: true },
      { id: "mode", label: "Mode of Travel", type: "dropdown", required: true, options: ["Air", "Train", "Bus", "Own Vehicle"] },
      { id: "fare", label: "Travel Fare (Rs.)", type: "number", required: true },
      { id: "total", label: "Total Amount Claimed (Rs.)", type: "number", required: true },
      { id: "net_claim", label: "Net Amount Claimed (Rs.)", type: "number", required: true },
      { id: "bank_details", label: "Bank Account & IFSC", type: "text", required: true },
    ],
    required_documents: ["Tickets / Boarding Pass", "Hotel Bills", "Approval Letter"],
    signature_required: true,
    template: "travel-reimbursement",
    workflow: [
      { step: 1, authority: "Employee", status: "completed" },
      { step: 2, authority: "HOD", status: "pending" },
      { step: 3, authority: "Accounts Office", status: "upcoming" },
      { step: 4, authority: "Finance Office", status: "upcoming" },
    ],
  },
];

const mockSubmissions: Submission[] = [
  {
    id: "sub-001",
    form_name: "Medical Claim Form - Outdoor Treatment",
    form_id: "med-claim-outdoor",
    submitted_date: "2026-03-05",
    submitted_time: "14:30",
    status: "Under Review",
    current_authority: "Accounts Office",
  },
  {
    id: "sub-002",
    form_name: "Leave Application Form",
    form_id: "leave-application",
    submitted_date: "2026-03-03",
    submitted_time: "10:15",
    status: "Approved",
    current_authority: "Registrar",
  },
  {
    id: "sub-003",
    form_name: "Travel Reimbursement Form",
    form_id: "travel-reimbursement",
    submitted_date: "2026-02-28",
    submitted_time: "16:45",
    status: "Pending",
    current_authority: "HOD",
  },
  {
    id: "sub-004",
    form_name: "No Dues Certificate",
    form_id: "no-dues",
    submitted_date: "2026-02-20",
    submitted_time: "09:00",
    status: "Rejected",
    current_authority: "Library",
  },
  {
    id: "sub-005",
    form_name: "Hostel Room Allotment Form",
    form_id: "hostel-allotment",
    submitted_date: "2026-02-15",
    submitted_time: "11:30",
    status: "Approved",
    current_authority: "Dean Student Affairs",
  },
];

const mockProfile: UserProfile = {
  name: "Dr. Rajesh Kumar",
  email: "rajesh.kumar@iitrpr.ac.in",
  role: "Faculty",
  department: "Computer Science & Engineering",
  employee_code: "CSE-2019-042",
  stats: {
    total_submitted: 24,
    pending: 3,
    approved: 19,
  },
};

const mockComments: Comment[] = [
  {
    id: "c1",
    authority: "Section Officer",
    role: "Administration",
    message: "Please attach original bills for the claimed amount. Photocopies will not be accepted.",
    date: "2026-03-06",
  },
  {
    id: "c2",
    authority: "Accounts Office",
    role: "Finance",
    message: "Form received. Under review. Please ensure bank details are correct.",
    date: "2026-03-07",
  },
];

export const mockApi = {
  login: async (_email: string, _password: string) => {
    await delay(800);
    return { success: true, user: mockProfile };
  },

  getRecentSubmissions: async (): Promise<Submission[]> => {
    await delay(500);
    return mockSubmissions.slice(0, 5);
  },

  getForms: async (): Promise<FormDefinition[]> => {
    await delay(500);
    return mockForms;
  },

  getFormById: async (formId: string): Promise<FormDefinition | undefined> => {
    await delay(400);
    return mockForms.find((f) => f.id === formId);
  },

  getSubmissionStatus: async (submissionId: string) => {
    await delay(400);
    const sub = mockSubmissions.find((s) => s.id === submissionId);
    const form = sub ? mockForms.find((f) => f.id === sub.form_id) : undefined;
    return {
      submission: sub,
      workflow: form?.workflow || [],
    };
  },

  getComments: async (_submissionId: string): Promise<Comment[]> => {
    await delay(300);
    return mockComments;
  },

  getHistory: async (): Promise<Submission[]> => {
    await delay(500);
    return mockSubmissions;
  },

  getProfile: async (): Promise<UserProfile> => {
    await delay(400);
    return mockProfile;
  },

  submitForm: async (_payload: Record<string, unknown>) => {
    await delay(1000);
    return { success: true, submission_id: "sub-" + Date.now() };
  },
};
