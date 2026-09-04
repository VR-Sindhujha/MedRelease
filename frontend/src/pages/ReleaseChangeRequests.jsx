import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function ReleaseChangeRequests() {
  const token = localStorage.getItem("access_token");

  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [releases, setReleases] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [linkedChangeRequests, setLinkedChangeRequests] = useState([]);

  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedRelease, setSelectedRelease] = useState("");
  const [selectedChangeRequest, setSelectedChangeRequest] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const headers = {
    "Content-Type": "application/json",
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

  // Fetch projects when organization changes
  useEffect(() => {
    if (!selectedOrganization) {
      setProjects([]);
      setSelectedProject("");
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
        setChangeRequests([]);
        setSelectedRelease("");
        setSelectedChangeRequest("");
      })
      .catch((error) => {
        console.error(error);
        setMessage("Failed to load projects.");
      });
  }, [selectedOrganization]);

  // Fetch releases and change requests when project changes
  useEffect(() => {
    if (!selectedProject) {
      setReleases([]);
      setChangeRequests([]);
      setSelectedRelease("");
      setSelectedChangeRequest("");
      return;
    }

    Promise.all([
      fetch(`${API}/api/releases/project/${selectedProject}`, {
        headers,
      }).then((res) => res.json()),

      fetch(`${API}/api/change-requests/project/${selectedProject}`, {
        headers,
      }).then((res) => res.json()),
    ])
      .then(([releaseData, changeRequestData]) => {
        setReleases(releaseData);
        setChangeRequests(changeRequestData);
        setSelectedRelease("");
        setSelectedChangeRequest("");
      })
      .catch((error) => {
        console.error(error);
        setMessage("Failed to load releases or change requests.");
      });
  }, [selectedProject]);

  // Fetch linked change requests when release changes
  useEffect(() => {
    if (!selectedRelease) {
      setLinkedChangeRequests([]);
      return;
    }

    fetch(
      `${API}/api/release-change-requests/release/${selectedRelease}`,
      {
        headers,
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setLinkedChangeRequests(data);
      })
      .catch((error) => {
        console.error(error);
        setMessage("Failed to load linked change requests.");
      });
  }, [selectedRelease]);

  const handleLinkChangeRequest = async (e) => {
    e.preventDefault();

    if (!selectedRelease || !selectedChangeRequest) {
      setMessage("Please select a release and change request.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/api/release-change-requests`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            release_id: Number(selectedRelease),
            change_request_id: Number(selectedChangeRequest),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail || "Failed to link change request.";

        throw new Error(errorMessage);
      }

      setMessage("Change request linked successfully.");

      setSelectedChangeRequest("");

      // Refresh linked change requests
      const refreshResponse = await fetch(
        `${API}/api/release-change-requests/release/${selectedRelease}`,
        {
          headers,
        }
      );

      const refreshData = await refreshResponse.json();
      setLinkedChangeRequests(refreshData);
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getChangeRequest = (changeRequestId) => {
    return changeRequests.find(
      (item) => item.id === changeRequestId
    );
  };

  return (
    <section className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Release Change Requests
        </h1>

        <p className="mt-1 text-slate-500">
          Link change requests to software releases
        </p>
      </div>

      {/* Project Selection */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Select Project
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Link Change Request */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Link Change Request
        </h2>

        <form
          onSubmit={handleLinkChangeRequest}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Release
            </label>

            <select
              value={selectedRelease}
              onChange={(e) =>
                setSelectedRelease(e.target.value)
              }
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Change Request
            </label>

            <select
              value={selectedChangeRequest}
              onChange={(e) =>
                setSelectedChangeRequest(e.target.value)
              }
              disabled={!selectedProject}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100"
            >
              <option value="">Select change request</option>

              {changeRequests.map((changeRequest) => (
                <option
                  key={changeRequest.id}
                  value={changeRequest.id}
                >
                  #{changeRequest.id} — {changeRequest.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={
                loading ||
                !selectedRelease ||
                !selectedChangeRequest
              }
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Linking..." : "Link Change Request"}
            </button>
          </div>
        </form>

        {message && (
          <p className="mt-4 text-sm text-slate-600">
            {message}
          </p>
        )}
      </div>

      {/* Linked Change Requests */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Linked Change Requests
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Change requests included in the selected release
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {linkedChangeRequests.length}{" "}
            {linkedChangeRequests.length === 1
              ? "request"
              : "requests"}
          </span>
        </div>

        {!selectedRelease ? (
          <p className="text-slate-500">
            Select a release to view linked change requests.
          </p>
        ) : linkedChangeRequests.length === 0 ? (
          <p className="text-slate-500">
            No change requests linked to this release.
          </p>
        ) : (
          <div className="space-y-3">
            {linkedChangeRequests.map((link) => {
              const changeRequest = getChangeRequest(
                link.change_request_id
              );

              return (
                <div
                  key={link.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {changeRequest
                          ? changeRequest.title
                          : `Change Request #${link.change_request_id}`}
                      </h3>

                      <p className="text-sm text-slate-500 mt-1">
                        Change Request ID:{" "}
                        {link.change_request_id}
                      </p>

                      {changeRequest && (
                        <p className="text-sm text-slate-600 mt-2">
                          {changeRequest.description}
                        </p>
                      )}
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      Link ID: {link.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}