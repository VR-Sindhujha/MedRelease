import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function ReleaseReadiness() {
  const token = localStorage.getItem("access_token");

  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [releases, setReleases] = useState([]);

  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedRelease, setSelectedRelease] = useState("");

  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // Fetch organizations
  useEffect(() => {
    fetch(`${API}/api/organizations`, {
      headers,
    })
      .then((res) => res.json())
      .then((data) => {
        setOrganizations(data);
      })
      .catch((error) => {
        console.error(error);
        setMessage("Failed to load organizations.");
      });
  }, []);

  // Fetch projects
  useEffect(() => {
    if (!selectedOrganization) {
      setProjects([]);
      setSelectedProject("");
      setReleases([]);
      setSelectedRelease("");
      setReadiness(null);
      return;
    }

    fetch(
      `${API}/api/projects/organization/${selectedOrganization}`,
      {
        headers,
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setSelectedProject("");
        setReleases([]);
        setSelectedRelease("");
        setReadiness(null);
      })
      .catch((error) => {
        console.error(error);
        setMessage("Failed to load projects.");
      });
  }, [selectedOrganization]);

  // Fetch releases
  useEffect(() => {
    if (!selectedProject) {
      setReleases([]);
      setSelectedRelease("");
      setReadiness(null);
      return;
    }

    fetch(`${API}/api/releases/project/${selectedProject}`, {
      headers,
    })
      .then((res) => res.json())
      .then((data) => {
        setReleases(data);
        setSelectedRelease("");
        setReadiness(null);
      })
      .catch((error) => {
        console.error(error);
        setMessage("Failed to load releases.");
      });
  }, [selectedProject]);

  const checkReadiness = async () => {
    if (!selectedRelease) {
      setMessage("Please select a release.");
      return;
    }

    setLoading(true);
    setMessage("");
    setReadiness(null);

    try {
      const response = await fetch(
        `${API}/api/releases/${selectedRelease}/readiness`,
        {
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail || "Failed to check release readiness.";

        throw new Error(errorMessage);
      }

      setReadiness(data);
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Release Readiness
        </h1>

        <p className="mt-1 text-slate-500">
          Check whether a release is ready for deployment
        </p>
      </div>

      {/* Select Project */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Select Release
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Organization
            </label>

            <select
              value={selectedOrganization}
              onChange={(e) =>
                setSelectedOrganization(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Select organization</option>

              {organizations.map((organization) => (
                <option
                  key={organization.id}
                  value={organization.id}
                >
                  {organization.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project
            </label>

            <select
              value={selectedProject}
              onChange={(e) =>
                setSelectedProject(e.target.value)
              }
              disabled={!selectedOrganization}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
            >
              <option value="">Select project</option>

              {projects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Release */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Release
            </label>

            <select
              value={selectedRelease}
              onChange={(e) => {
                setSelectedRelease(e.target.value);
                setReadiness(null);
              }}
              disabled={!selectedProject}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
            >
              <option value="">Select release</option>

              {releases.map((release) => (
                <option
                  key={release.id}
                  value={release.id}
                >
                  {release.name} — v{release.version}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={checkReadiness}
          disabled={loading || !selectedRelease}
          className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check Readiness"}
        </button>

        {message && (
          <p className="mt-4 text-sm text-red-600">
            {message}
          </p>
        )}
      </div>

      {/* Readiness Result */}
      {readiness && (
        <div
          className={`rounded-xl border p-6 shadow-sm ${
            readiness.ready
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`text-2xl font-bold ${
                readiness.ready
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {readiness.ready ? "✓ READY" : "✕ NOT READY"}
            </div>
          </div>

          <p
            className={`text-sm ${
              readiness.ready
                ? "text-green-700"
                : "text-red-700"
            }`}
          >
            {readiness.message}
          </p>

          <p className="mt-3 text-sm text-slate-600">
            Release ID: {readiness.release_id}
          </p>
        </div>
      )}
    </section>
  );
}