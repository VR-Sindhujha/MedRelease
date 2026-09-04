import { useEffect, useState } from "react";

function ChangeRequestCIs() {
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [configurationItems, setConfigurationItems] = useState([]);
  const [linkedCIs, setLinkedCIs] = useState([]);

  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedChangeRequest, setSelectedChangeRequest] = useState("");
  const [selectedCI, setSelectedCI] = useState("");

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
      setSelectedChangeRequest("");
      setChangeRequests([]);
      setConfigurationItems([]);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!selectedProject) {
      setChangeRequests([]);
      setConfigurationItems([]);
      setSelectedChangeRequest("");
      setSelectedCI("");
      return;
    }

    fetchChangeRequests();
    fetchConfigurationItems();
  }, [selectedProject]);

  const fetchChangeRequests = async () => {
    try {
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
    }
  };

  const fetchConfigurationItems = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/configuration-items/project/${selectedProject}`,
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
      setConfigurationItems(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!selectedChangeRequest) {
      setLinkedCIs([]);
      return;
    }

    fetchLinkedCIs();
  }, [selectedChangeRequest]);

  const fetchLinkedCIs = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/change-request-cis/change-request/${selectedChangeRequest}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch linked configuration items");
      }

      const data = await response.json();
      setLinkedCIs(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLinkCI = async (e) => {
    e.preventDefault();

    if (!selectedChangeRequest || !selectedCI) {
      setError("Please select a change request and configuration item");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/change-request-cis",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            change_request_id: Number(selectedChangeRequest),
            configuration_item_id: Number(selectedCI),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to link configuration item"
        );
      }

      setSelectedCI("");
      await fetchLinkedCIs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCIName = (ciId) => {
    const ci = configurationItems.find((item) => item.id === ciId);
    return ci ? ci.name : `CI #${ciId}`;
  };

  const getCIType = (ciId) => {
    const ci = configurationItems.find((item) => item.id === ciId);
    return ci ? ci.ci_type : "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Change Request CIs
        </h2>

        <p className="text-gray-500 mt-1">
          Link configuration items to change requests
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

      {/* Change Request Selection */}
      {selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Select Change Request
          </h3>

          <select
            value={selectedChangeRequest}
            onChange={(e) => setSelectedChangeRequest(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select change request</option>

            {changeRequests.map((request) => (
              <option key={request.id} value={request.id}>
                #{request.id} - {request.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Link Configuration Item */}
      {selectedChangeRequest && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Link Configuration Item
          </h3>

          <form onSubmit={handleLinkCI} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuration Item
              </label>

              <select
                value={selectedCI}
                onChange={(e) => setSelectedCI(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select configuration item</option>

                {configurationItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — CI #{item.id}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Linking..." : "Link Configuration Item"}
            </button>
          </form>
        </div>
      )}

      {/* Linked CIs */}
      {selectedChangeRequest && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Linked Configuration Items
            </h3>

            <span className="text-sm text-gray-500">
              {linkedCIs.length} item
              {linkedCIs.length !== 1 ? "s" : ""}
            </span>
          </div>

          {linkedCIs.length === 0 ? (
            <p className="text-gray-500">
              No configuration items linked to this change request.
            </p>
          ) : (
            <div className="space-y-3">
              {linkedCIs.map((link) => (
                <div
                  key={link.id}
                  className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {getCIName(link.configuration_item_id)}
                    </h4>

                    <p className="text-sm text-gray-500 mt-1">
                      CI ID: {link.configuration_item_id}
                    </p>

                    <p className="text-sm text-gray-500">
                      Type: {getCIType(link.configuration_item_id)}
                    </p>
                  </div>

                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    Linked
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChangeRequestCIs;