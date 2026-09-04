import { useEffect, useState } from "react";

function Releases() {
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [releases, setReleases] = useState([]);

  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/organizations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }

      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!selectedOrganization) {
      setProjects([]);
      setSelectedProject("");
      setReleases([]);
      return;
    }

    fetchProjects();
  }, [selectedOrganization]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/projects/organization/${selectedOrganization}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();

      setProjects(data);
      setSelectedProject("");
      setReleases([]);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!selectedProject) {
      setReleases([]);
      return;
    }

    fetchReleases();
  }, [selectedProject]);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/api/releases/project/${selectedProject}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch releases");
      }

      const data = await response.json();
      setReleases(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      setError("Please select a project");
      return;
    }

    if (!name.trim() || !version.trim() || !description.trim() || !plannedDate) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/releases",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project_id: Number(selectedProject),
            name: name.trim(),
            version: version.trim(),
            description: description.trim(),
            planned_date: new Date(plannedDate).toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Failed to create release";

        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail
            .map((item) => item.msg)
            .join(", ");
        }

        throw new Error(errorMessage);
      }

      setName("");
      setVersion("");
      setDescription("");
      setPlannedDate("");

      await fetchReleases();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "RELEASED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "IN_PROGRESS") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "FAILED") {
      return "bg-red-100 text-red-700";
    }

    if (status === "CANCELLED") {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Releases
        </h2>

        <p className="text-gray-500 mt-1">
          Plan and manage software releases
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Project Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Select Project
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization
            </label>

            <select
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select organization</option>

              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={!selectedOrganization}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select project</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Create Release */}
      {selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Create Release
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Release Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter release name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>

              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0.0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this release"
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planned Date
              </label>

              <input
                type="datetime-local"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Release"}
            </button>
          </form>
        </div>
      )}

      {/* Releases List */}
      {selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Releases
            </h3>

            <span className="text-sm text-gray-500">
              {releases.length} release
              {releases.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading && releases.length === 0 ? (
            <p className="text-gray-500">Loading...</p>
          ) : releases.length === 0 ? (
            <p className="text-gray-500">
              No releases found for this project.
            </p>
          ) : (
            <div className="space-y-4">
              {releases.map((release) => (
                <div
                  key={release.id}
                  className="border border-gray-200 rounded-lg p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {release.name}
                      </h4>

                      <p className="text-sm text-gray-500 mt-1">
                        Release ID: {release.id}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                        v{release.version}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                          release.status
                        )}`}
                      >
                        {release.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">
                      Description
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      {release.description}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">
                      Planned Date
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(release.planned_date).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Created by User ID: {release.created_by_id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Releases;