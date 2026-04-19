import { mockApi, type FormDefinition, type Submission, type UserProfile, type Comment } from "./mockApi";

// Set to true to use mock data, false when backend is ready
const USE_MOCK = false;

const apiGet = async (path: string) => {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

const apiPost = async (path: string, body: unknown) => {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export const formsService = {
  getRecent: async (): Promise<Submission[]> => {
    if (USE_MOCK) return mockApi.getRecentSubmissions();
    return apiGet("/forms/recent");
  },

  getAll: async (): Promise<FormDefinition[]> => {
    if (USE_MOCK) return mockApi.getForms();
    return apiGet("/forms");
  },

  getById: async (formId: string): Promise<FormDefinition | undefined> => {
    if (USE_MOCK) return mockApi.getFormById(formId);
    return apiGet(`/forms/${formId}`);
  },

  submit: async (payload: Record<string, unknown>) => {
    if (USE_MOCK) return mockApi.submitForm(payload);
    return apiPost("/forms/submit", payload);
  },

  getStatus: async (submissionId: string) => {
    if (USE_MOCK) return mockApi.getSubmissionStatus(submissionId);
    return apiGet(`/forms/${submissionId}/status`);
  },

  getComments: async (submissionId: string): Promise<Comment[]> => {
    if (USE_MOCK) return mockApi.getComments(submissionId);
    return apiGet(`/forms/${submissionId}/comments`);
  },
};

export const historyService = {
  getAll: async (): Promise<Submission[]> => {
    if (USE_MOCK) return mockApi.getHistory();
    
    try {
      const response = await apiGet("/submissions/getMySubmissions?limit=100");
      
      // Transform backend response to match Submission interface
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((submission: any) => {
          const createdAt = new Date(submission.createdAt);
          const submitted_date = createdAt.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const submitted_time = createdAt.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });

          // Get current authority from verification actions or form verifiers list
          let current_authority = "Pending Review";
          if (submission.verificationActions && submission.verificationActions.length > 0) {
            const lastAction = submission.verificationActions[submission.verificationActions.length - 1];
            current_authority = lastAction.verifier?.userName || "System";
          } else if (submission.form?.verifiersList && submission.form.verifiersList.length > 0) {
            const currentVerifier = submission.form.verifiersList.find(
              (v: any) => v.level === submission.currentLevel
            );
            current_authority = currentVerifier?.verifier?.userName || "Pending Review";
          }

          return {
            id: submission.id,
            form_name: submission.form?.title || "Unknown Form",
            form_id: submission.form?.id || "",
            submitted_date,
            submitted_time,
            status: submission.overallStatus || "Pending",
            current_authority,
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching user history:", error);
      return [];
    }
  },
};

export const userService = {
  login: async (email: string, password: string) => {
    if (USE_MOCK) return mockApi.login(email, password);
    return apiPost("/auth/login", { email, password });
  },

  getProfile: async (): Promise<UserProfile> => {
    if (USE_MOCK) return mockApi.getProfile();
    
    try {
      const response = await apiGet("/user/profile");
      
      // Extract the 'data' field from the API response and return it
      if (response.data) {
        return response.data as UserProfile;
      }
      
      // Fallback: if data is not nested, return response directly
      return response as UserProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },
};
