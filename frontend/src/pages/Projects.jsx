import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Plus,
  X,
  Search,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
} from "lucide-react";
import ProjectDetails from "./ProjectDetails";
const API_URL = "http://127.0.0.1:8000";

function Projects() {
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const getToken = () => localStorage.getItem("access_token");
  const [selectedProject, setSelectedProject] = useState(null);
  const fetchOrganizations = async () => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/api/organizations`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
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

      if (data.length > 0) {
        setSelectedOrg((current) => {
          if (
            current &&
            data.some((org) => String(org.id) === current)
          ) {
            return current;
          }

          return String(data[0].id);
        });
      } else {
        setSelectedOrg("");
        setProjects([]);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch organizations");
      setLoading(false);
    }
  };

  const fetchProjects = async (organizationId) => {
    if (!organizationId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/projects/organization/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.detail || "Failed to fetch projects"
        );
      }

      const data = await response.json();

      setProjects(data);
    } catch (err) {
      setError(err.message || "Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchProjects(selectedOrg);
    }
  }, [selectedOrg]);

  const selectedOrganization = organizations.find(
    (organization) =>
      String(organization.id) === String(selectedOrg)
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const projectName =
        project.name?.toLowerCase() || "";

      const projectDescription =
        project.description?.toLowerCase() || "";

      const projectId = String(project.id);

      return (
        projectName.includes(query) ||
        projectDescription.includes(query) ||
        projectId.includes(query)
      );
    });
  }, [projects, search]);

  const getInitials = (projectName) => {
    if (!projectName) {
      return "PR";
    }

    const words = projectName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  };

  const getStatusStyles = (status) => {
    const normalized = String(
      status || "ACTIVE"
    ).toUpperCase();

    if (normalized === "ACTIVE") {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }

    if (normalized === "PLANNING") {
      return "bg-amber-50 text-amber-700 border-amber-100";
    }

    if (normalized === "INACTIVE") {
      return "bg-slate-100 text-slate-600 border-slate-200";
    }

    return "bg-blue-50 text-blue-700 border-blue-100";
  };

  const handleOpenForm = () => {
    setName("");
    setDescription("");
    setError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (creating) {
      return;
    }

    setShowForm(false);
    setName("");
    setDescription("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!selectedOrg) {
      setError("Please select an organization");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          organization_id: Number(selectedOrg),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        let message = "Failed to create project";

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

      await fetchProjects(selectedOrg);
    } catch (err) {
      setError(
        err.message || "Failed to create project"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = async () => {
    await fetchProjects(selectedOrg);
  };

  if (projectDetails) {
    return (
      <ProjectDetails
        project={projectDetails}
        organization={selectedOrganization}
        onBack={() => setProjectDetails(null)}
      />
    );
  }

  return (
    <section className="min-h-full bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =========================================================
            PAGE HEADER
        ========================================================= */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
              <FolderKanban size={14} />
              Workspace
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Projects
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Manage software projects, configurations, changes,
              and releases across your organizations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenForm}
            disabled={!selectedOrg}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            New Project
          </button>
        </div>

        {/* =========================================================
            ERROR BANNER
        ========================================================= */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={17}
            />

            <div className="flex-1">
              <p className="font-medium">
                Something went wrong
              </p>

              <p className="mt-0.5 text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-md p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =========================================================
            ORGANIZATION CONTEXT
        ========================================================= */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Building2 size={19} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Organization Context
                </p>

                <h2 className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedOrganization?.name ||
                    "No organization selected"}
                </h2>

                {selectedOrganization && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Organization #{selectedOrganization.id}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full lg:w-80">
              <label className="mb-2 block text-xs font-medium text-slate-500">
                Switch organization
              </label>

              <select
                value={selectedOrg}
                onChange={(e) => {
                  setSelectedOrg(e.target.value);
                  setSearch("");
                }}
                disabled={organizations.length === 0}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  Select organization
                </option>

                {organizations.map((org) => (
                  <option
                    key={org.id}
                    value={org.id}
                  >
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* =========================================================
            SUMMARY CARDS
        ========================================================= */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">

          {/* Total Projects */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Total Projects
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {projects.length}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  In the selected organization
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FolderKanban size={19} />
              </div>
            </div>
          </div>

          {/* Visible Results */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Visible Results
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {filteredProjects.length}
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

        {/* =========================================================
            PROJECT DIRECTORY
        ========================================================= */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Project Directory
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Software projects available in the selected
                organization.
              </p>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search projects..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || !selectedOrg}
                title="Refresh projects"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    loading ? "animate-spin" : ""
                  }
                />
              </button>
            </div>
          </div>

          {/* =====================================================
              LOADING STATE
          ===================================================== */}
          {loading ? (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex gap-4">

                    <div className="h-11 w-11 rounded-xl bg-slate-100" />

                    <div className="flex-1">
                      <div className="h-4 w-44 rounded bg-slate-100" />

                      <div className="mt-3 h-3 w-full rounded bg-slate-100" />

                      <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />

                      <div className="mt-5 h-3 w-24 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : !selectedOrg ? (

            /* =====================================================
               NO ORGANIZATION
            ===================================================== */
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Building2 size={25} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                Select an organization
              </h3>

              <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
                Choose an organization above to view its software
                projects.
              </p>
            </div>

          ) : filteredProjects.length === 0 ? (

            /* =====================================================
               EMPTY / SEARCH STATE
            ===================================================== */
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {search ? (
                  <Search size={25} />
                ) : (
                  <FolderKanban size={25} />
                )}
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                {search
                  ? "No matching projects"
                  : "No projects yet"}
              </h3>

              <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
                {search
                  ? "Try a different project name, description, or ID."
                  : `Create the first project for ${
                      selectedOrganization?.name ||
                      "this organization"
                    }.`}
              </p>

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Create Project
                </button>
              )}
            </div>

          ) : (

            /* =====================================================
               PROJECT CARDS
            ===================================================== */
            <div className="grid gap-4 p-5 md:grid-cols-2">

              {filteredProjects.map((project) => {
                const status = String(
                  project.status || "ACTIVE"
                ).toUpperCase();

                return (
                  <div
                    key={project.id}
                    className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">

                      {/* Project Avatar */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                        {getInitials(project.name)}
                      </div>

                      <div className="min-w-0 flex-1">

                        {/* Project Header */}
                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {project.name}
                            </h3>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2">

                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusStyles(
                                  status
                                )}`}
                              >
                                {status}
                              </span>

                              <span className="text-[11px] text-slate-400">
                                Project #{project.id}
                              </span>
                            </div>
                          </div>

                          {/* Project Details */}
                          <button
                            type="button"
                            title="Project details"
                            onClick={() => {
                              setError("");
                              setProjectDetails(project);
                            }}
                            className="rounded-lg p-1.5 text-slate-300 transition group-hover:text-blue-500 hover:bg-blue-50"
                          >
                            <ArrowUpRight size={16} />
                          </button>
                        </div>

                        {/* Description */}
                        <p className="mt-4 min-h-[40px] text-sm leading-5 text-slate-500">
                          {project.description ||
                            "No description provided for this project."}
                        </p>

                        {/* Metadata */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Building2 size={12} />

                            <span className="max-w-[180px] truncate">
                              {selectedOrganization?.name ||
                                "Organization"}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400">
                            MedRelease
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =====================================================
              FOOTER
          ===================================================== */}
          {!loading && filteredProjects.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-400">
                Showing {filteredProjects.length} of{" "}
                {projects.length} projects
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===========================================================
          CREATE PROJECT MODAL
      =========================================================== */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-[2px]">

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FolderKanban size={18} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Create Project
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Add a project to the selected organization.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                disabled={creating}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreate}>

              <div className="space-y-5 px-6 py-6">

                {/* Organization */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Organization
                  </label>

                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">

                    <Building2
                      size={17}
                      className="text-slate-400"
                    />

                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {selectedOrganization?.name ||
                          "No organization selected"}
                      </p>

                      {selectedOrganization && (
                        <p className="text-[11px] text-slate-400">
                          Organization #
                          {selectedOrganization.id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Project Name
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="e.g. Hospital Management System"
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Enter a clear name for the software project.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    placeholder="Briefly describe the project..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Optional. This description helps identify the
                    project's purpose.
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
                  disabled={creating || !selectedOrg}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Project
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

export default Projects;