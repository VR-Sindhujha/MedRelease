import { useEffect, useState } from "react";
import { Settings, Trash2 } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

function ConfigurationItems() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [ciType, setCiType] = useState("");
  const [version, setVersion] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [repositoryPath, setRepositoryPath] = useState("");
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
      setLoading(true);
      setError("");

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
    }
  }, [selectedProject]);

  const handleDelete = async (itemId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this configuration item?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/configuration-items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Failed to delete configuration item"
        );
      }

      await fetchItems(selectedProject);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      setError("Please select a project");
      return;
    }

    if (!name.trim()) {
      setError("Configuration item name is required");
      return;
    }

    if (!ciType.trim()) {
      setError("CI type is required");
      return;
    }

    if (!version.trim()) {
      setError("Version is required");
      return;
    }

    if (!ownerId) {
      setError("Owner ID is required");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/configuration-items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project_id: Number(selectedProject),
            name: name.trim(),
            ci_type: ciType.trim(),
            version: version.trim(),
            owner_id: Number(ownerId),
            status: status,
            repository_path: repositoryPath.trim(),
            description: description.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Failed to create configuration item"
        );
      }

      setName("");
      setCiType("");
      setVersion("");
      setOwnerId("");
      setStatus("ACTIVE");
      setRepositoryPath("");
      setDescription("");
      setShowForm(false);

      await fetchItems(selectedProject);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="p-8">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">
            Configuration Items
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Manage software components belonging to your projects.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setError("");
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + New Configuration Item
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
          className="w-full max-w-lg rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select project</option>

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h3 className="font-semibold text-slate-800">
              Create Configuration Item
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Add a software component to the selected project.
            </p>
          </div>

          <form onSubmit={handleCreate}>

            <div className="grid grid-cols-2 gap-5">

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Patient Registration"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* CI Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  CI Type
                </label>

                <input
                  type="text"
                  value={ciType}
                  onChange={(e) => setCiType(e.target.value)}
                  placeholder="e.g. Backend Service"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Version */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Version
                </label>

                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.0.0"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Owner ID */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Owner ID
                </label>

                <input
                  type="number"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Repository Path */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Repository Path
                </label>

                <input
                  type="text"
                  value={repositoryPath}
                  onChange={(e) => setRepositoryPath(e.target.value)}
                  placeholder="e.g. services/patient-registration"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this configuration item"
                  rows="3"
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
                Create Configuration Item
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

      {/* Loading / Items */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading configuration items...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Settings size={26} />
          </div>

          <h3 className="mt-4 font-semibold text-slate-800">
            No configuration items yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            This project does not have any configuration items.
          </p>

        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">

          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Settings size={21} />
                </div>

                <div className="flex-1">

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.description || "No description provided"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete configuration item"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">

                    {item.ci_type && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {item.ci_type}
                      </span>
                    )}

                    {item.version && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                        v{item.version}
                      </span>
                    )}

                    {item.status && (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        {item.status}
                      </span>
                    )}

                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    Configuration Item ID: {item.id}
                  </p>

                </div>
              </div>
            </div>
          ))}

        </div>
      )}

    </section>
  );
}

export default ConfigurationItems;