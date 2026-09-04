import { useEffect, useState } from "react";
import ChangeRequestDetails from "./ChangeRequestDetails";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  GitBranch,
  GitPullRequest,
  Package,
  Settings,
  ShieldCheck,
  Loader2,
} from "lucide-react";

function getStatusStyles(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "ACTIVE" || normalized === "RELEASED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "PLANNING" || normalized === "IN_PROGRESS") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "FAILED" || normalized === "CANCELLED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectDetails({ project, organization, onBack }) {
      const [configurationItems, setConfigurationItems] = useState([]);
      const [loadingConfigurationItems, setLoadingConfigurationItems] =
            useState(true);
      const [dependencies, setDependencies] = useState([]);
const [loadingDependencies, setLoadingDependencies] = useState(true);
      const [changeRequests, setChangeRequests] = useState([]);
const [loadingChangeRequests, setLoadingChangeRequests] = useState(true);
const [releases, setReleases] = useState([]);
const [loadingReleases, setLoadingReleases] = useState(true);
const [changeRequestDetails, setChangeRequestDetails] = useState(null);

        const API_URL = "http://127.0.0.1:8000";

  const getToken = () => localStorage.getItem("access_token");

  useEffect(() => {
    const fetchConfigurationItems = async () => {
      try {
        setLoadingConfigurationItems(true);

        const response = await fetch(
          `${API_URL}/api/configuration-items/project/${project.id}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch configuration items");
        }

        const data = await response.json();
        setConfigurationItems(data);
      } catch (error) {
        console.error("Configuration items error:", error);
        setConfigurationItems([]);
      } finally {
        setLoadingConfigurationItems(false);
      }
    };

    fetchConfigurationItems();
  }, [project.id]);
    useEffect(() => {
    const fetchDependencies = async () => {
      try {
        setLoadingDependencies(true);

        const response = await fetch(
          `${API_URL}/api/dependencies/project/${project.id}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dependencies");
        }

        const data = await response.json();
        setDependencies(data);
      } catch (error) {
        console.error("Dependencies error:", error);
        setDependencies([]);
      } finally {
        setLoadingDependencies(false);
      }
    };

    fetchDependencies();
  }, [project.id]);
  useEffect(() => {
  const fetchChangeRequests = async () => {
    try {
      setLoadingChangeRequests(true);

      const response = await fetch(
        `${API_URL}/api/change-requests/project/${project.id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch change requests");
      }

      const data = await response.json();
      setChangeRequests(data);
    } catch (error) {
      console.error("Change requests error:", error);
      setChangeRequests([]);
    } finally {
      setLoadingChangeRequests(false);
    }
  };

  fetchChangeRequests();
}, [project.id]);
  useEffect(() => {
  const fetchReleases = async () => {
    try {
      setLoadingReleases(true);

      const response = await fetch(
        `${API_URL}/api/releases/project/${project.id}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch releases");
      }

      const data = await response.json();
      setReleases(data);
    } catch (error) {
      console.error("Releases error:", error);
      setReleases([]);
    } finally {
      setLoadingReleases(false);
    }
  };

  fetchReleases();
}, [project.id]);
    if (!project) {
    return (
      <div className="min-h-full bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShieldCheck size={22} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Project not found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              The selected project could not be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (changeRequestDetails) {
    return (
      <ChangeRequestDetails
        changeRequest={changeRequestDetails}
        onBack={() => setChangeRequestDetails(null)}
      />
    );
  }

  const status = String(project.status || "UNKNOWN").toUpperCase();

  return (
    <div className="min-h-full bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2 text-xs text-slate-400">
          <span>MedRelease</span>
          <span>›</span>
          <button
            type="button"
            onClick={onBack}
            className="transition hover:text-blue-600"
          >
            Projects
          </button>
          <span>›</span>
          <span className="text-slate-600">{project.name}</span>
        </div>

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </button>

        {/* Project Hero */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-600">
                  {String(project.name || "P")
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                      {project.name}
                    </h1>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusStyles(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Project #{project.id}
                  </p>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    {project.description ||
                      "No description has been provided for this project."}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Settings size={15} />
                  Project Settings
                </button>
              </div>
            </div>
          </div>

          {/* Project metadata */}
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <Building2 size={17} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Organization
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {organization?.name || "Organization"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <CalendarDays size={17} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Created
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {formatDate(project.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <Package size={17} />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Current Version
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {project.current_version || "Not released"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <GitBranch size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Repository
                </p>
                <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
                  {project.github_repository || "Not connected"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Overview */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <GitBranch size={18} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Configuration & Release Overview
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Manage the software lifecycle for this project.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
<div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-slate-500">
      <Settings size={15} />
      <span className="text-xs font-medium">
        Configuration Items
      </span>
    </div>

    {!loadingConfigurationItems && (
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
        {configurationItems.length}
      </span>
    )}
  </div>

  {loadingConfigurationItems ? (
    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
      <Loader2 size={14} className="animate-spin" />
      Loading configuration items...
    </div>
  ) : configurationItems.length === 0 ? (
    <div className="mt-4">
      <p className="text-sm font-semibold text-slate-800">
        No configuration items
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        No configuration items are currently registered for this project.
      </p>
    </div>
  ) : (
    <div className="mt-4 space-y-2">
      {configurationItems.slice(0, 3).map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-semibold text-slate-800">
              {item.name}
            </p>

            <span className="shrink-0 text-[10px] font-medium text-slate-400">
              v{item.version}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate text-[10px] text-slate-400">
              {item.ci_type}
            </span>

            <span className="text-[10px] font-semibold text-emerald-600">
              {item.status}
            </span>
          </div>
        </div>
      ))}

      {configurationItems.length > 3 && (
        <p className="pt-1 text-[10px] font-medium text-slate-400">
          +{configurationItems.length - 3} more configuration items
        </p>
      )}
    </div>
  )}
</div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-slate-500">
      <GitBranch size={15} />
      <span className="text-xs font-medium">
        Dependencies
      </span>
    </div>

    {!loadingDependencies && (
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
        {dependencies.length}
      </span>
    )}
  </div>

  {loadingDependencies ? (
    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
      <Loader2 size={14} className="animate-spin" />
      Loading dependencies...
    </div>
  ) : dependencies.length === 0 ? (
    <div className="mt-4">
      <p className="text-sm font-semibold text-slate-800">
        No dependencies
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        No component dependencies are currently registered for this project.
      </p>
    </div>
  ) : (
    <div className="mt-4 space-y-2">
      {dependencies.slice(0, 3).map((dependency) => {
        const sourceCI = configurationItems.find(
          (item) => item.id === dependency.source_ci_id
        );

        const targetCI = configurationItems.find(
          (item) => item.id === dependency.target_ci_id
        );

        return (
          <div
            key={dependency.id}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <p className="min-w-0 truncate text-xs font-semibold text-slate-800">
                {sourceCI?.name || `CI #${dependency.source_ci_id}`}
              </p>

              <span className="shrink-0 text-[10px] font-bold text-blue-500">
                →
              </span>

              <p className="min-w-0 truncate text-xs font-semibold text-slate-800">
                {targetCI?.name || `CI #${dependency.target_ci_id}`}
              </p>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-slate-400">
                {dependency.dependency_type}
              </span>

              <span className="text-[10px] text-slate-400">
                Dependency #{dependency.id}
              </span>
            </div>

            {dependency.description && (
              <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
                {dependency.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>
<div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-slate-500">
      <GitPullRequest size={15} />
      <span className="text-xs font-medium">
        Change Management
      </span>
    </div>

    {!loadingChangeRequests && (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
        {changeRequests.length}
      </span>
    )}
  </div>

  {loadingChangeRequests ? (
    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
      <Loader2 size={14} className="animate-spin" />
      Loading change requests...
    </div>
  ) : changeRequests.length === 0 ? (
    <div className="mt-4">
      <p className="text-sm font-semibold text-slate-800">
        No change requests
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        No change requests are currently registered for this project.
      </p>
    </div>
  ) : (
    <div className="mt-4 space-y-2">
      {changeRequests.slice(0, 3).map((changeRequest) => (
        <button
  key={changeRequest.id}
  type="button"
  onClick={() => {
  setChangeRequestDetails(changeRequest);
}}
  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
>
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 truncate text-xs font-semibold text-slate-800">
              {changeRequest.title}
            </p>

            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
              {changeRequest.status}
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-slate-400">
              {changeRequest.priority}
            </span>

            <span className="text-[10px] text-slate-400">
              CR #{changeRequest.id}
            </span>
          </div>

          {changeRequest.description && (
            <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500">
              {changeRequest.description}
            </p>
          )}
        </button>
      ))}
    </div>
  )}
</div>

<div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-slate-500">
      <CheckCircle2 size={15} />
      <span className="text-xs font-medium">
        Release Management
      </span>
    </div>

    {!loadingReleases && (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
        {releases.length}
      </span>
    )}
  </div>

  {loadingReleases ? (
    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
      <Loader2 size={14} className="animate-spin" />
      Loading releases...
    </div>
  ) : releases.length === 0 ? (
    <div className="mt-4">
      <p className="text-sm font-semibold text-slate-800">
        No releases
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        No releases are currently registered for this project.
      </p>
    </div>
  ) : (
    <div className="mt-4 space-y-2">
      {releases.slice(0, 3).map((release) => (
        <div
          key={release.id}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {release.name}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Version {release.version}
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
              {release.status}
            </span>
          </div>

          {release.description && (
            <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500">
              {release.description}
            </p>
          )}

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">
              Release #{release.id}
            </span>

            {release.planned_date && (
              <span className="text-[10px] text-slate-400">
                {formatDate(release.planned_date)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
            </div>
          </section>

          {/* Project information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Project Information
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Project ID
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  #{project.id}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Organization ID
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  #{project.organization_id}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Project Manager
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {project.project_manager_id
                    ? `User #${project.project_manager_id}`
                    : "Not assigned"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Repository
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-700">
                  {project.github_repository || "Not connected"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Created On
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {formatDate(project.created_at)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}