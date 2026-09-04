import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  X,
  Search,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/api/organizations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.detail || "Failed to fetch organizations"
        );
      }

      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const filteredOrganizations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return organizations;
    }

    return organizations.filter((organization) => {
      const organizationName = organization.name?.toLowerCase() || "";
      const organizationDescription =
        organization.description?.toLowerCase() || "";
      const organizationId = String(organization.id);

      return (
        organizationName.includes(query) ||
        organizationDescription.includes(query) ||
        organizationId.includes(query)
      );
    });
  }, [organizations, search]);

  const getInitials = (organizationName) => {
    if (!organizationName) return "OR";

    const words = organizationName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  };

  const handleOpenForm = () => {
    setName("");
    setDescription("");
    setError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (creating) return;

    setShowForm(false);
    setName("");
    setDescription("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Organization name is required");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/api/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        let message = "Failed to create organization";

        if (Array.isArray(data.detail)) {
          message = data.detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(", ");
        } else if (typeof data.detail === "string") {
          message = data.detail;
        }

        throw new Error(message);
      }

      setName("");
      setDescription("");
      setShowForm(false);

      await fetchOrganizations();
    } catch (err) {
      setError(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="min-h-full bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
              <Building2 size={14} />
              Workspace
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Organizations
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Manage the healthcare organizations and workspaces
              connected to MedRelease.
            </p>
          </div>

          <button
            onClick={handleOpenForm}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <Plus size={17} />
            New Organization
          </button>
        </div>

        {/* Summary Card */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Total Organizations
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {organizations.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Available in your workspace
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Building2 size={19} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Visible Results
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredOrganizations.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Matching your current search
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Search size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={17} />

            <div className="flex-1">
              <p className="font-medium">Something went wrong</p>
              <p className="mt-0.5 text-red-600">{error}</p>
            </div>

            <button
              onClick={() => setError("")}
              className="rounded-md p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Organization Workspace */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Organization Directory
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Select and manage organizations available to your account.
              </p>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search organizations..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={fetchOrganizations}
                disabled={loading}
                title="Refresh organizations"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex gap-4">
                    <div className="h-11 w-11 rounded-lg bg-slate-100" />

                    <div className="flex-1">
                      <div className="h-4 w-40 rounded bg-slate-100" />
                      <div className="mt-3 h-3 w-full rounded bg-slate-100" />
                      <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOrganizations.length === 0 ? (
            /* Empty State */
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {search ? (
                  <Search size={25} />
                ) : (
                  <Building2 size={25} />
                )}
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {search
                  ? "No matching organizations"
                  : "No organizations yet"}
              </h3>

              <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
                {search
                  ? "Try a different organization name, description, or ID."
                  : "Create your first organization to start managing projects and releases."}
              </p>

              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              ) : (
                <button
                  onClick={handleOpenForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Create Organization
                </button>
              )}
            </div>
          ) : (
            /* Organization Cards */
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {filteredOrganizations.map((organization) => (
                <div
                  key={organization.id}
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                      {getInitials(organization.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900">
                            {organization.name}
                          </h3>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                              Active
                            </span>

                            <span className="text-[11px] text-slate-400">
                              ID #{organization.id}
                            </span>
                          </div>
                        </div>

                        <button
                          title="Organization details"
                          className="rounded-lg p-1.5 text-slate-300 transition group-hover:text-blue-500 hover:bg-blue-50"
                        >
                          <ArrowUpRight size={16} />
                        </button>
                      </div>

                      <p className="mt-4 min-h-[40px] text-sm leading-5 text-slate-500">
                        {organization.description ||
                          "No description provided for this organization."}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[11px] font-medium text-slate-400">
                          MedRelease workspace
                        </span>

                        <span className="text-[11px] text-slate-400">
                          Organization #{organization.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {!loading && filteredOrganizations.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-400">
                Showing {filteredOrganizations.length} of{" "}
                {organizations.length} organizations
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Building2 size={18} />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Create Organization
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Add a new workspace to MedRelease.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseForm}
                disabled={creating}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate}>
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Organization Name
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apollo Hospitals"
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Use the official organization name.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe this organization..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Optional. This helps identify the workspace later.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={creating}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Organization
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Organizations;