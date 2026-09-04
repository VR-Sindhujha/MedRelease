import { useEffect, useState } from "react";
import { GitBranch, Trash2 } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function Dependencies() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [items, setItems] = useState([]);
  const [dependencies, setDependencies] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [sourceCI, setSourceCI] = useState("");
  const [targetCI, setTargetCI] = useState("");
  const [dependencyType, setDependencyType] = useState("DEPENDS_ON");
  const [description, setDescription] = useState("");

  const token = localStorage.getItem("access_token");

  const fetchProjects = async () => {
    try {
      setError("");

      const organizationsResponse = await fetch(
        `${API_URL}/api/organizations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!organizationsResponse.ok) {
        throw new Error("Failed to fetch organizations");
      }

      const organizations = await organizationsResponse.json();

      let allProjects = [];

      for (const organization of organizations) {
        const response = await fetch(
          `${API_URL}/api/projects/organization/${organization.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          allProjects = [...allProjects, ...data];
        }
      }

      setProjects(allProjects);

      if (allProjects.length > 0) {
        setSelectedProject(String(allProjects[0].id));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchItems = async (projectId) => {
    if (!projectId) {
      setItems([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/configuration-items/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch configuration items");
      }

      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDependencies = async (projectId) => {
    if (!projectId) {
      setDependencies([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/dependencies/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dependencies");
      }

      const data = await response.json();
      setDependencies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchItems(selectedProject);
      fetchDependencies(selectedProject);
    }
  }, [selectedProject]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      setError("Please select a project");
      return;
    }

    if (!sourceCI) {
      setError("Please select a source configuration item");
      return;
    }

    if (!targetCI) {
      setError("Please select a target configuration item");
      return;
    }

    if (sourceCI === targetCI) {
      setError("Source and target configuration items must be different");
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/api/dependencies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          source_ci_id: Number(sourceCI),
          target_ci_id: Number(targetCI),
          dependency_type: dependencyType,
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Failed to create dependency"
        );
      }

      setSourceCI("");
      setTargetCI("");
      setDependencyType("DEPENDS_ON");
      setDescription("");
      setShowForm(false);

      await fetchDependencies(selectedProject);
    } catch (err) {
      setError(err.message);
    }
  };

  const getCIName = (id) => {
    const item = items.find((ci) => ci.id === id);

    return item ? item.name : `Configuration Item ${id}`;
  };

  return (
    <section className="p-8">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">
            Dependencies
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Manage relationships between configuration items.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setError("");
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + New Dependency
        </button>
      </div>

      {/* Project Selector */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Project
        </label>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full max-w-lg rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select project</option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create Dependency Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h3 className="font-semibold text-slate-800">
              Create Dependency
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Define a dependency between two configuration items.
            </p>
          </div>

          <form onSubmit={handleCreate}>

            <div className="grid grid-cols-2 gap-5">

              {/* Source CI */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Source Configuration Item
                </label>

                <select
                  value={sourceCI}
                  onChange={(e) => setSourceCI(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select source CI
                  </option>

                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target CI */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Target Configuration Item
                </label>

                <select
                  value={targetCI}
                  onChange={(e) => setTargetCI(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select target CI
                  </option>

                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dependency Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Dependency Type
                </label>

                <select
                  value={dependencyType}
                  onChange={(e) => setDependencyType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="DEPENDS_ON">
                    DEPENDS_ON
                  </option>

                  <option value="USES">
                    USES
                  </option>

                  <option value="CALLS">
                    CALLS
                  </option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Service requires database"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

            {/* Buttons */}
            <div className="mt-5 flex justify-end gap-3">

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create Dependency
              </button>

            </div>

          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Dependencies */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading dependencies...
          </p>
        </div>
      ) : dependencies.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <GitBranch size={26} />
          </div>

          <h3 className="mt-4 font-semibold text-slate-800">
            No dependencies yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            This project does not have any dependency relationships.
          </p>

        </div>
      ) : (
        <div className="space-y-4">

          {dependencies.map((dependency) => (
            <div
              key={dependency.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <div className="flex items-center gap-5">

                {/* Source */}
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Source
                  </p>

                  <h3 className="mt-1 font-semibold text-slate-800">
                    {getCIName(dependency.source_ci_id)}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    CI ID: {dependency.source_ci_id}
                  </p>
                </div>

                {/* Relationship */}
                <div className="flex flex-col items-center gap-1">
                  <GitBranch size={20} className="text-blue-600" />

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {dependency.dependency_type}
                  </span>
                </div>

                {/* Target */}
                <div className="flex-1 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Target
                  </p>

                  <h3 className="mt-1 font-semibold text-slate-800">
                    {getCIName(dependency.target_ci_id)}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    CI ID: {dependency.target_ci_id}
                  </p>
                </div>

              </div>

              {dependency.description && (
                <p className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  {dependency.description}
                </p>
              )}

              <p className="mt-3 text-xs text-slate-400">
                Dependency ID: {dependency.id}
              </p>

            </div>
          ))}

        </div>
      )}

    </section>
  );
}

export default Dependencies;