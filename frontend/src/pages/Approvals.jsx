import { useEffect, useState } from "react";

function Approvals() {
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [approvals, setApprovals] = useState([]);

  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedChangeRequest, setSelectedChangeRequest] = useState("");
  const selectedRequest = changeRequests.find(
  (request) => String(request.id) === String(selectedChangeRequest)
);

  const [decision, setDecision] = useState("APPROVED");
  const [comments, setComments] = useState("");

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
      setSelectedChangeRequest("");
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
      setApprovals([]);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!selectedProject) {
      setChangeRequests([]);
      setSelectedChangeRequest("");
      setApprovals([]);
      return;
    }

    fetchChangeRequests();
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
      setSelectedChangeRequest("");
      setApprovals([]);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!selectedChangeRequest) {
      setApprovals([]);
      return;
    }

    fetchApprovals();
  }, [selectedChangeRequest]);

  const fetchApprovals = async () => {
    try {
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/api/approvals/change-request/${selectedChangeRequest}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch approvals");
      }

      const data = await response.json();
      setApprovals(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedChangeRequest) {
      setError("Please select a change request");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/approvals",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            change_request_id: Number(selectedChangeRequest),
            decision: decision,
            comments: comments.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Failed to create approval";

        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail
            .map((item) => item.msg)
            .join(", ");
        }

        throw new Error(errorMessage);
      }

      setComments("");
      setDecision("APPROVED");

      await fetchApprovals();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Approvals
        </h2>

        <p className="text-gray-500 mt-1">
          Manage approvals for change requests
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

      {/* Create Approval */}
{selectedChangeRequest && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

    {selectedRequest && (
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Current Change Request Status
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-800">
          {selectedRequest.status}
        </p>
      </div>
    )}

    <h3 className="text-lg font-semibold text-gray-800 mb-4">
      Create Approval
    </h3>

          {selectedRequest &&
(selectedRequest.status === "APPROVED" ||
  selectedRequest.status === "REJECTED") ? (
  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
    <p className="text-sm font-medium text-gray-700">
      Approval action unavailable
    </p>

    <p className="text-sm text-gray-500 mt-1">
      This change request has already reached a final status.
      No additional approval can be submitted.
    </p>
  </div>
) : (
  <form onSubmit={handleSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Decision
      </label>

      <select
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="APPROVED">APPROVED</option>
        <option value="REJECTED">REJECTED</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Comments
      </label>

      <textarea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder="Enter approval comments"
        rows="3"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
    >
      {loading ? "Submitting..." : "Submit Approval"}
    </button>
  </form>
)}
        </div>
      )}

      {/* Existing Approvals */}
      {selectedChangeRequest && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Existing Approvals
            </h3>

            <span className="text-sm text-gray-500">
              {approvals.length} approval
              {approvals.length !== 1 ? "s" : ""}
            </span>
          </div>

          {approvals.length === 0 ? (
            <p className="text-gray-500">
              No approvals found for this change request.
            </p>
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Approval #{approval.id}
                      </h4>

                      <p className="text-sm text-gray-500 mt-1">
                        Approver ID: {approval.approver_id}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        approval.decision === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {approval.decision}
                    </span>
                  </div>

                  {approval.comments && (
                    <p className="text-sm text-gray-600 mt-3">
                      {approval.comments}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Approvals;