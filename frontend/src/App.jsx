import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Organizations from "./pages/Organizations";
import Projects from "./pages/Projects";
import ConfigurationItems from "./pages/ConfigurationItems";
import Dependencies from "./pages/Dependencies";
import ChangeRequests from "./pages/ChangeRequests";
import ChangeRequestCIs from "./pages/ChangeRequestCIs";
import Approvals from "./pages/Approvals";
import Releases from "./pages/Releases";
import ReleaseChangeRequests from "./pages/ReleaseChangeRequests";
import ReleaseReadiness from "./pages/ReleaseReadiness";

import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Settings,
  Package,
  CheckCircle2,
  Clock3,
  PackageCheck,
  AlertTriangle,
  ChevronRight,
  Activity,
  GitBranch,
  GitPullRequest,
  Search,
  Bell,
  UserCircle,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ArrowUpRight,
  CircleDot,
  Check,
} from "lucide-react";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
const [active, setActive] = useState("Dashboard");
const [mobileOpen, setMobileOpen] = useState(false);

const [dashboardData, setDashboardData] = useState({
  organizations: [],
  projects: [],
  configurationItems: [],
  changeRequests: [],
  releases: [],
  readiness: [],
});

const [dashboardLoading, setDashboardLoading] = useState(false);
useEffect(() => {
  if (!loggedIn || active !== "Dashboard") return;

  const loadDashboard = async () => {
    try {
      setDashboardLoading(true);

      const token = localStorage.getItem("access_token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Organizations
      const organizationsResponse = await fetch(
        "http://127.0.0.1:8000/api/organizations",
        { headers }
      );

      if (!organizationsResponse.ok) {
        throw new Error("Failed to load organizations");
      }

      const organizations = await organizationsResponse.json();

      // Projects across all organizations
      const projectResults = await Promise.all(
        organizations.map(async (organization) => {
          const response = await fetch(
            `http://127.0.0.1:8000/api/projects/organization/${organization.id}`,
            { headers }
          );

          if (!response.ok) {
            throw new Error("Failed to load projects");
          }

          return response.json();
        })
      );

      const projects = projectResults.flat();

      // Load project-level data
      const projectData = await Promise.all(
        projects.map(async (project) => {
          const [ciResponse, crResponse, releaseResponse] =
            await Promise.all([
              fetch(
                `http://127.0.0.1:8000/api/configuration-items/project/${project.id}`,
                { headers }
              ),
              fetch(
                `http://127.0.0.1:8000/api/change-requests/project/${project.id}`,
                { headers }
              ),
              fetch(
                `http://127.0.0.1:8000/api/releases/project/${project.id}`,
                { headers }
              ),
            ]);

          if (
            !ciResponse.ok ||
            !crResponse.ok ||
            !releaseResponse.ok
          ) {
            throw new Error("Failed to load dashboard project data");
          }

          const configurationItems = await ciResponse.json();
          const changeRequests = await crResponse.json();
          const releases = await releaseResponse.json();

          return {
            configurationItems,
            changeRequests,
            releases,
          };
        })
      );

      const configurationItems = projectData.flatMap(
        (data) => data.configurationItems
      );

      const changeRequests = projectData.flatMap(
        (data) => data.changeRequests
      );

      const releases = projectData
        .flatMap((data) => data.releases)
        .sort(
          (a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

      // Check readiness for every release
      const readiness = await Promise.all(
        releases.map(async (release) => {
          try {
            const response = await fetch(
              `http://127.0.0.1:8000/api/releases/${release.id}/readiness`,
              { headers }
            );

            if (!response.ok) {
              return {
                releaseId: release.id,
                ready: false,
                message: "Readiness check unavailable",
              };
            }

            const result = await response.json();

            return {
              releaseId: release.id,
              ready: result.ready,
              message: result.message,
            };
          } catch {
            return {
              releaseId: release.id,
              ready: false,
              message: "Readiness check unavailable",
            };
          }
        })
      );

      setDashboardData({
        organizations,
        projects,
        configurationItems,
        changeRequests,
        releases,
        readiness,
      });
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  loadDashboard();
}, [loggedIn, active]);
  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const navigationGroups = [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "Workspace",
      items: [
        { name: "Organizations", icon: Building2 },
        { name: "Projects", icon: FolderKanban },
        { name: "Configuration Items", icon: Settings },
        { name: "Dependencies", icon: GitBranch },
      ],
    },
    {
      label: "Change Management",
      items: [
        { name: "Change Requests", icon: GitPullRequest },
        { name: "Change Request CIs", icon: GitBranch },
        { name: "Approvals", icon: ShieldCheck },
      ],
    },
    {
      label: "Release Management",
      items: [
        { name: "Releases", icon: Package },
        { name: "Release Change Requests", icon: GitPullRequest },
        { name: "Release Readiness", icon: PackageCheck },
      ],
    },
  ];

  const activeProjects = dashboardData.projects.length;

  const pendingChanges = dashboardData.changeRequests.filter(
    (request) => request.status === "PENDING"
  ).length;

  const activeReleases = dashboardData.releases.filter(
    (release) =>
      release.status === "PLANNED" ||
      release.status === "IN_PROGRESS"
  ).length;

  const readyReleases = dashboardData.readiness.filter(
    (item) => item.ready
  ).length;

  const stats = [
    {
      title: "Active Projects",
      value: dashboardLoading ? "—" : String(activeProjects),
      subtitle: "Across your workspace",
      icon: FolderKanban,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: dashboardData.organizations.length,
      trendText: "organizations",
    },
    {
      title: "Pending Changes",
      value: dashboardLoading ? "—" : String(pendingChanges),
      subtitle: "Awaiting approval",
      icon: Clock3,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      trend: pendingChanges > 0 ? "Review" : "Clear",
      trendText:
        pendingChanges > 0 ? "required" : "no pending changes",
    },
    {
      title: "Active Releases",
      value: dashboardLoading ? "—" : String(activeReleases),
      subtitle: "Currently in pipeline",
      icon: Activity,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      trend: activeReleases,
      trendText: "in pipeline",
    },
    {
      title: "Ready for Deployment",
      value: dashboardLoading ? "—" : String(readyReleases),
      subtitle: "Passed readiness checks",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      trend: dashboardData.releases.length
        ? `${Math.round(
            (readyReleases / dashboardData.releases.length) * 100
          )}%`
        : "0%",
      trendText: "ready",
    },
  ];

  const releases = dashboardData.releases
  .slice(0, 5)
  .map((release) => {
    const readiness = dashboardData.readiness.find(
      (item) => item.releaseId === release.id
    );

    const project = dashboardData.projects.find(
      (item) => item.id === release.project_id
    );

    const statusConfig = {
      RELEASED: {
        statusClass:
          "bg-emerald-50 text-emerald-700 border-emerald-100",
        icon: CheckCircle2,
        iconClass: "bg-emerald-50 text-emerald-600",
      },
      IN_PROGRESS: {
        statusClass:
          "bg-amber-50 text-amber-700 border-amber-100",
        icon: Activity,
        iconClass: "bg-amber-50 text-amber-600",
      },
      PLANNED: {
        statusClass:
          "bg-blue-50 text-blue-700 border-blue-100",
        icon: Package,
        iconClass: "bg-blue-50 text-blue-600",
      },
      FAILED: {
        statusClass:
          "bg-red-50 text-red-700 border-red-100",
        icon: AlertTriangle,
        iconClass: "bg-red-50 text-red-600",
      },
      CANCELLED: {
        statusClass:
          "bg-slate-100 text-slate-600 border-slate-200",
        icon: AlertTriangle,
        iconClass: "bg-slate-100 text-slate-500",
      },
    };

    const config =
      statusConfig[release.status] || statusConfig.PLANNED;

    return {
      ...release,
      project: project?.name || "Unknown project",
      readiness,
      ...config,
    };
  });

  const latestRelease = dashboardData.releases[0];

  const latestReadiness = latestRelease
    ? dashboardData.readiness.find(
        (item) => item.releaseId === latestRelease.id
      )
    : null;

  const latestReleaseReady = latestReadiness?.ready === true;

  const workflow = [
    {
      label: "Planned",
      description: "Release created",
      icon: Package,
      completed: Boolean(latestRelease),
    },
    {
      label: "In Progress",
      description: "Implementation active",
      icon: Activity,
      completed:
        latestRelease?.status === "IN_PROGRESS" ||
        latestRelease?.status === "RELEASED",
    },
    {
      label: "Released",
      description: "Production deployment",
      icon: CheckCircle2,
      completed: latestRelease?.status === "RELEASED",
    },
  ];

  const handleNavigation = (name) => {
    setActive(name);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setLoggedIn(false);
  };

  const renderPage = () => {
    if (active === "Organizations") return <Organizations />;
    if (active === "Projects") return <Projects />;
    if (active === "Configuration Items") return <ConfigurationItems />;
    if (active === "Dependencies") return <Dependencies />;
    if (active === "Change Requests") return <ChangeRequests />;
    if (active === "Change Request CIs") return <ChangeRequestCIs />;
    if (active === "Approvals") return <Approvals />;
    if (active === "Releases") return <Releases />;
    if (active === "Release Change Requests") {
      return <ReleaseChangeRequests />;
    }
    if (active === "Release Readiness") return <ReleaseReadiness />;

    return (
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Workspace overview
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Good evening, Admin
              <span className="ml-2">👋</span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor your configuration, change requests and release
              pipeline from one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm sm:flex">
              <CircleDot size={14} className="text-emerald-500" />
              System operational
            </div>

            <button
              onClick={() => setActive("Releases")}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <Package size={16} />
              View releases
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}
                  >
                    <Icon size={21} />
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                    <ArrowUpRight size={13} />
                    {stat.trend}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>

                  <div className="mt-1 flex items-end gap-2">
                    <p className="text-3xl font-bold tracking-tight text-slate-950">
                      {stat.value}
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    {stat.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          {/* Recent Releases */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Package size={16} />
                  </div>

                  <h2 className="font-semibold text-slate-950">
                    Recent Releases
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Latest activity across your release pipeline
                </p>
              </div>

              <button
                onClick={() => setActive("Releases")}
                className="hidden items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 sm:flex"
              >
                View all
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {releases.map((release) => {
                const Icon = release.icon;

                return (
                  <button
                    key={release.name}
                    onClick={() => setActive("Releases")}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${release.iconClass}`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {release.name}
                          </p>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${release.statusClass}`}
                          >
                            {release.status}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          Version {release.version} · {release.project}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      size={17}
                      className="shrink-0 text-slate-300 transition group-hover:text-slate-500"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Readiness */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <PackageCheck size={16} />
                  </div>

                  <h2 className="font-semibold text-slate-950">
                    Release Readiness
                  </h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Production deployment validation
                </p>
              </div>

              <button
                onClick={() => setActive("Release Readiness")}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <ArrowUpRight size={17} />
              </button>
            </div>

            <div
              className={`mt-6 rounded-2xl p-4 ${
                latestReleaseReady
                  ? "border border-emerald-100 bg-emerald-50/70"
                  : "border border-amber-100 bg-amber-50/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    latestReleaseReady
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {latestReleaseReady ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <AlertTriangle size={22} />
                  )}
                </div>

                <div>
                  <p
                    className={`text-sm font-bold ${
                      latestReleaseReady
                        ? "text-emerald-800"
                        : "text-amber-800"
                    }`}
                  >
                    {latestRelease
                      ? latestReleaseReady
                        ? "Ready for deployment"
                        : "Not ready for deployment"
                      : "No releases available"}
                  </p>

                  <p
                    className={`mt-0.5 text-xs ${
                      latestReleaseReady
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {latestReadiness?.message ||
                      "Create a release to begin readiness validation"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                [
                  "Change requests",
                  latestRelease
                    ? latestReleaseReady
                      ? "Passed"
                      : "Review required"
                    : "—",
                  latestRelease ? latestReleaseReady : false,
                ],
                [
                  "Approvals",
                  latestRelease
                    ? latestReleaseReady
                      ? "Passed"
                      : "Review required"
                    : "—",
                  latestRelease ? latestReleaseReady : false,
                ],
                [
                  "Dependencies",
                  latestRelease
                    ? latestReleaseReady
                      ? "Passed"
                      : "Review required"
                    : "—",
                  latestRelease ? latestReleaseReady : false,
                ],
                [
                  "Validation",
                  latestRelease
                    ? latestReleaseReady
                      ? "Passed"
                      : "Review required"
                    : "—",
                  latestRelease ? latestReleaseReady : false,
                ],
              ].map(([label, value, passed]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        passed
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Check size={13} />
                    </div>

                    <span className="text-xs font-medium text-slate-600">
                      {label}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-900">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActive("Release Readiness")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Open readiness checks
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Workflow */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Activity size={18} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Release Lifecycle
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Track a release through its controlled lifecycle
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-6 md:grid-cols-3">
              {workflow.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.label}
                    className="relative flex items-center gap-4 md:block"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          step.completed
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <div className="md:mt-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {step.label}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {index < workflow.length - 1 && (
                      <div className="hidden h-px bg-slate-200 md:absolute md:left-12 md:right-[-25%] md:top-[22px] md:block">
                        <div className="h-full w-full bg-blue-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* System notice */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:flex-row sm:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertTriangle size={19} />
          </div>

          <div>
            <p className="text-sm font-semibold text-amber-900">
              Controlled release workflow
            </p>

            <p className="mt-1 max-w-3xl text-xs leading-5 text-amber-800/80">
              Releases can only move through valid lifecycle transitions.
              Production release requires the configured readiness checks to
              pass before deployment.
            </p>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <button
            onClick={() => handleNavigation("Dashboard")}
            className="flex items-center gap-3 text-left"
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white/10" />
              <span className="relative text-lg font-extrabold">M</span>
            </div>

            <div>
              <p className="text-[15px] font-bold tracking-tight text-slate-950">
                MedRelease
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                SCM Platform
              </p>
            </div>
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace selector */}
        <div className="px-4 pt-4">
          <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
              C
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                CityCare Hospital
              </p>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                Current organization
              </p>
            </div>

            <ChevronRight
              size={14}
              className="rotate-90 text-slate-400"
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navigationGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {group.label}
              </p>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.name;

                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.name)}
                      className={`group relative flex w-full items-center rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-blue-600" />
                      )}

                      <Icon
                        size={17}
                        strokeWidth={isActive ? 2.3 : 1.9}
                        className={`shrink-0 ${
                          isActive
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />

                      <span className="ml-3 truncate">{item.name}</span>

                      {isActive && (
                        <ChevronRight
                          size={14}
                          className="ml-auto text-blue-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              A
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                Admin
              </p>
              <p className="truncate text-[10px] text-slate-400">
                admin@medrelease.com
              </p>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-500"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="min-h-screen lg:pl-[270px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div className="min-w-0">
              <div className="hidden items-center gap-2 text-[11px] font-medium text-slate-400 sm:flex">
                <span>MedRelease</span>
                <ChevronRight size={12} />
                <span className="text-slate-600">{active}</span>
              </div>

              <h2 className="mt-0.5 truncate text-base font-bold tracking-tight text-slate-950 sm:text-lg">
                {active}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 md:flex md:w-52 lg:w-64">
              <Search size={15} className="text-slate-400" />

              <input
                type="text"
                placeholder="Search workspace..."
                className="ml-2 w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
              />

              <span className="ml-2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                /
              </span>
            </div>

            {/* Notifications */}
            <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
              <Bell size={17} />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>

            {/* User */}
            <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                A
              </div>

              <div className="text-left">
                <p className="text-[11px] font-semibold text-slate-800">
                  Admin
                </p>
                <p className="text-[9px] text-slate-400">
                  Administrator
                </p>
              </div>

              <UserCircle size={15} className="ml-1 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Content */}
        {renderPage()}
      </main>
    </div>
  );
}

export default App;