// lib/data.ts - Mock data for the entire application

export const currentUser = {
  id: 'u1',
  name: 'Dr. Priya Sharma',
  email: 'priya.sharma@iitrpr.ac.in',
  role: 'HOD - Computer Science',
  department: 'Computer Science & Engineering',
  avatar: 'PS',
  formsHandled: 142,
  approvalsCompleted: 118,
  rejections: 14,
};

export const statsData = {
  allSubmissions: 248,
  accepted: 142,
  rejected: 28,
  pending: 67,
  expired: 11,
};

export const weeklyData = [
  { day: 'Mon', submissions: 12, accepted: 8, rejected: 2 },
  { day: 'Tue', submissions: 19, accepted: 14, rejected: 3 },
  { day: 'Wed', submissions: 8, accepted: 5, rejected: 1 },
  { day: 'Thu', submissions: 24, accepted: 18, rejected: 4 },
  { day: 'Fri', submissions: 16, accepted: 11, rejected: 2 },
  { day: 'Sat', submissions: 7, accepted: 4, rejected: 1 },
  { day: 'Sun', submissions: 3, accepted: 2, rejected: 0 },
];

export const pieData = [
  { name: 'Accepted', value: 142, color: '#22C55E' },
  { name: 'Pending', value: 67, color: '#F59E0B' },
  { name: 'Rejected', value: 28, color: '#EF4444' },
  { name: 'Expired', value: 11, color: '#94A3B8' },
];

export type Submission = {
  id: string;
  studentName: string;
  rollNo: string;
  formName: string;
  formType: string;
  department: string;
  submissionDate: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  currentVerifier: string;
  currentLevel: number;
  totalLevels: number;
  deadline: string;
};

export const submissions: Submission[] = [
  { id: 's1', studentName: 'Arjun Verma', rollNo: '2021CSB001', formName: 'No Dues Certificate', formType: 'Certificate', department: 'CSE', submissionDate: '2024-03-14', status: 'Pending', currentVerifier: 'HOD CSE', currentLevel: 2, totalLevels: 4, deadline: '2024-03-18' },
  { id: 's2', studentName: 'Sneha Patel', rollNo: '2021EEB022', formName: 'Leave Application', formType: 'Leave', department: 'EE', submissionDate: '2024-03-13', status: 'Accepted', currentVerifier: 'Dean Academic', currentLevel: 4, totalLevels: 4, deadline: '2024-03-17' },
  { id: 's3', studentName: 'Rahul Singh', rollNo: '2022CSB015', formName: 'Hostel Allotment', formType: 'Hostel', department: 'CSE', submissionDate: '2024-03-12', status: 'Rejected', currentVerifier: 'Caretaker', currentLevel: 1, totalLevels: 2, deadline: '2024-03-16' },
  { id: 's4', studentName: 'Priya Gupta', rollNo: '2021MEB008', formName: 'Scholarship Form', formType: 'Scholarship', department: 'ME', submissionDate: '2024-03-11', status: 'Pending', currentVerifier: 'HOD CSE', currentLevel: 2, totalLevels: 5, deadline: '2024-03-19' },
  { id: 's5', studentName: 'Karan Mehta', rollNo: '2022PHB003', formName: 'Project Approval', formType: 'Academic', department: 'PH', submissionDate: '2024-03-10', status: 'Expired', currentVerifier: 'Faculty Advisor', currentLevel: 1, totalLevels: 3, deadline: '2024-03-10' },
  { id: 's6', studentName: 'Ananya Krishnan', rollNo: '2021CSB034', formName: 'No Dues Certificate', formType: 'Certificate', department: 'CSE', submissionDate: '2024-03-09', status: 'Pending', currentVerifier: 'HOD CSE', currentLevel: 2, totalLevels: 4, deadline: '2024-03-20' },
  { id: 's7', studentName: 'Vikram Joshi', rollNo: '2022EEB011', formName: 'Fee Waiver Request', formType: 'Finance', department: 'EE', submissionDate: '2024-03-08', status: 'Accepted', currentVerifier: 'Accounts Office', currentLevel: 3, totalLevels: 3, deadline: '2024-03-15' },
  { id: 's8', studentName: 'Deepika Rao', rollNo: '2021CHB007', formName: 'Research Grant Form', formType: 'Research', department: 'CH', submissionDate: '2024-03-07', status: 'Pending', currentVerifier: 'HOD CSE', currentLevel: 2, totalLevels: 4, deadline: '2024-03-21' },
  { id: 's9', studentName: 'Akash Sharma', rollNo: '2023CSB002', formName: 'Leave Application', formType: 'Leave', department: 'CSE', submissionDate: '2024-03-06', status: 'Accepted', currentVerifier: 'Faculty Advisor', currentLevel: 2, totalLevels: 2, deadline: '2024-03-14' },
  { id: 's10', studentName: 'Neha Agarwal', rollNo: '2021MEB019', formName: 'Scholarship Form', formType: 'Scholarship', department: 'ME', submissionDate: '2024-03-05', status: 'Rejected', currentVerifier: 'HOD CSE', currentLevel: 2, totalLevels: 5, deadline: '2024-03-12' },
];

export type AssignedForm = {
  id: string;
  formName: string;
  formType: string;
  totalSubmissions: number;
  pending: number;
  accepted: number;
  rejected: number;
  expired: number;
  status: 'Active' | 'Closed';
  deadline: string;
};

export const assignedForms: AssignedForm[] = [
  { id: 'f1', formName: 'No Dues Certificate', formType: 'Certificate', totalSubmissions: 48, pending: 12, accepted: 32, rejected: 3, expired: 1, status: 'Active', deadline: '2024-03-30' },
  { id: 'f2', formName: 'Leave Application', formType: 'Leave', totalSubmissions: 67, pending: 18, accepted: 44, rejected: 5, expired: 0, status: 'Active', deadline: '2024-04-05' },
  { id: 'f3', formName: 'Scholarship Form', formType: 'Scholarship', totalSubmissions: 34, pending: 9, accepted: 22, rejected: 2, expired: 1, status: 'Active', deadline: '2024-03-25' },
  { id: 'f4', formName: 'Hostel Allotment', formType: 'Hostel', totalSubmissions: 52, pending: 15, accepted: 30, rejected: 7, expired: 0, status: 'Active', deadline: '2024-04-10' },
  { id: 'f5', formName: 'Research Grant Form', formType: 'Research', totalSubmissions: 23, pending: 8, accepted: 14, rejected: 1, expired: 0, status: 'Active', deadline: '2024-04-01' },
];

export type VerificationStage = {
  level: number;
  role: string;
  verifierName: string;
  status: 'Completed' | 'Current' | 'Pending';
  date?: string;
  comment?: string;
};

export const getVerificationWorkflow = (submissionId: string): VerificationStage[] => {
  return [
    { level: 1, role: 'Caretaker', verifierName: 'Mr. Ramesh Kumar', status: 'Completed', date: '2024-03-12', comment: 'Documents verified. All in order.' },
    { level: 2, role: 'HOD - CSE', verifierName: 'Dr. Priya Sharma', status: 'Current' },
    { level: 3, role: 'Dean Academic', verifierName: 'Prof. Anil Gupta', status: 'Pending' },
    { level: 4, role: 'Accounts Office', verifierName: 'Ms. Sunita Devi', status: 'Pending' },
  ];
};

export const getFormDetails = (submissionId: string) => {
  const sub = submissions.find(s => s.id === submissionId) || submissions[0];
  return {
    ...sub,
    fields: [
      { label: 'Student Name', value: sub.studentName },
      { label: 'Roll Number', value: sub.rollNo },
      { label: 'Department', value: sub.department },
      { label: 'Email', value: `${sub.rollNo.toLowerCase()}@iitrpr.ac.in` },
      { label: 'Contact Number', value: '+91 98765 43210' },
      { label: 'Academic Year', value: '2023-24' },
      { label: 'Semester', value: '6th Semester' },
      { label: 'Category', value: 'General' },
      { label: 'Purpose', value: 'Required for campus placement process and off-campus job applications.' },
      { label: 'Hostel / Day Scholar', value: 'Hostel (H3 - Room 204)' },
    ],
    documents: [
      { name: 'Identity Proof.pdf', type: 'pdf', size: '1.2 MB' },
      { name: 'Fee Receipt.pdf', type: 'pdf', size: '0.8 MB' },
      { name: 'Photograph.jpg', type: 'image', size: '0.3 MB' },
    ],
    workflow: getVerificationWorkflow(submissionId),
  };
};

export const activityData = [
  { id: 'a1', type: 'approved', message: 'Dr. Priya Sharma approved No Dues Certificate for Arjun Verma', time: '2 minutes ago', icon: 'check', color: 'green' },
  { id: 'a2', type: 'rejected', message: 'Caretaker Ramesh Kumar rejected Hostel Allotment for Rahul Singh', time: '1 hour ago', icon: 'x', color: 'red' },
  { id: 'a3', type: 'submitted', message: 'New Leave Application submitted by Ananya Krishnan', time: '3 hours ago', icon: 'file', color: 'blue' },
  { id: 'a4', type: 'approved', message: 'HOD approved Scholarship Form for Deepika Rao', time: '5 hours ago', icon: 'check', color: 'green' },
  { id: 'a5', type: 'sent-back', message: 'Leave Application sent back to Vikram Joshi for corrections', time: '1 day ago', icon: 'refresh', color: 'orange' },
  { id: 'a6', type: 'submitted', message: 'Research Grant Form submitted by Neha Agarwal', time: '1 day ago', icon: 'file', color: 'blue' },
  { id: 'a7', type: 'expired', message: 'Project Approval form for Karan Mehta marked as expired', time: '2 days ago', icon: 'clock', color: 'gray' },
  { id: 'a8', type: 'approved', message: 'Dean Academic approved Fee Waiver for Sneha Patel', time: '2 days ago', icon: 'check', color: 'green' },
];
