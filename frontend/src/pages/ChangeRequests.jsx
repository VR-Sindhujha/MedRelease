import { useEffect, useState } from "react";

function ChangeRequests() {
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);

  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  // Fetch organizations
  useEffect(() => {
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

    fetchOrganizations();
  }, [token]);

  // Fetch projects when organization changes
  useEffect(() => {
    if (!selectedOrganization) {
      setProjects([]);
      setSelectedProject("");
      return;
    }

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
        setChangeRequests([]);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProjects();
  }, [selectedOrganization, token]);

  // Fetch change requests when project changes
  useEffect(() => {
    if (!selectedProject) {
      setChangeRequests([]);
      return;
    }

    fetchChangeRequests();
  }, [selectedProject]);

  const fetchChangeRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/api/change-requests/project/${selectedProject}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch change requests");
      }

      const data = await response.json();
      setChangeRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create change request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProject) {
      setError("Please select a project");
      return;
    }

    if (!title.trim() || !description.trim() || !reason.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/change-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project_id: Number(selectedProject),
            title: title.trim(),
            description: description.trim(),
            reason: reason.trim(),
            priority: priority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create change request");
      }

      setTitle("");
      setDescription("");
      setReason("");
      setPriority("MEDIUM");

      await fetchChangeRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyle = (value) => {
    if (value === "HIGH") {
      return "bg-red-100 text-red-700";
    }

    if (value === "LOW") {
      return "bg-green-100 text-green-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  const getStatusStyle = (value) => {
    if (value === "APPROVED") {
      return "bg-green-100 text-green-700";
    }

    if (value === "REJECTED") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Change Requests
        </h2>
        <p className="text-gray-500 mt-1">
          Create and manage software configuration changes
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

      {/* Create Change Request */}
      {selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Create Change Request
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter change request title"
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
                placeholder="Describe the requested change"
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this change required?"
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Change Request"}
            </button>
          </form>
        </div>
      )}

      {/* Change Request List */}
      {selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Change Requests
            </h3>

            <span className="text-sm text-gray-500">
              {changeRequests.length} request
              {changeRequests.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading && changeRequests.length === 0 ? (
            <p className="text-gray-500">Loading...</p>
          ) : changeRequests.length === 0 ? (
            <p className="text-gray-500">
              No change requests found for this project.
            </p>
          ) : (
            <div className="space-y-4">
              {changeRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {request.title}
                      </h4>

                      <p className="text-sm text-gray-500 mt-1">
                        Change Request ID: {request.id}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityStyle(
                          request.priority
                        )}`}
                      >
                        {request.priority}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">
                      Description
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      {request.description}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">
                      Reason
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      {request.reason}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Requested by User ID: {request.requested_by_id}
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

export default ChangeRequests;