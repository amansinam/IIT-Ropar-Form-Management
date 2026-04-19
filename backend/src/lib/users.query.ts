interface GetUsersOptions {
  page?:      number;
  limit?:     number;
  search?:    string;
  sortBy?:    "createdAt" | "updatedAt" | "userName" | "email";
  sortOrder?: "asc" | "desc";
  from?:      Date;
  to?:        Date;
}

export async function getUsers(options: GetUsersOptions = {}) {
  const {
    page      = 1,
    limit     = 20,
    search,
    sortBy    = "createdAt",
    sortOrder = "desc",
    from,
    to,
  } = options;

  const params = new URLSearchParams();
  params.set("page",      String(page));
  params.set("limit",     String(limit));
  params.set("sortBy",    sortBy);
  params.set("sortOrder", sortOrder);

  if (search) params.set("search", search);
  if (from)   params.set("from",   from.toISOString());
  if (to)     params.set("to",     to.toISOString());

  const res  = await fetch(`/api/users?${params.toString()}`);
  const json = await res.json();

  if (!res.ok) throw new Error(json.message ?? "Failed to fetch users");

  return json as {
    success: boolean;
    data: {
      id:        string;
      userName:  string;
      email:     string;
      createdAt: string;
      updatedAt: string;
      _count: { formSubmissions: number };
    }[];
    meta: {
      total:       number;
      page:        number;
      limit:       number;
      totalPages:  number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}