import { useEffect, useState } from "react";
import {
  ArrowLeft,
  GitPullRequest,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  Package,
  Loader2,
  AlertTriangle,
} from "lucide-react";

function getStatusStyles(status) {
  switch (String(status || "").toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-100";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getPriorityStyles(priority) {
  switch (String(priority || "").toUpperCase()) {
    case "HIGH":
      return "bg-red-50 text-red-700 border-red-100";
    case "LOW":
      return "bg-slate-50 text-slate-600 border-slate-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-100";
  }
}

function getImpactStyles(impactType) {
  switch (String(impactType || "").toUpperCase()) {
    case "DIRECT":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "INDIRECT":
      return "bg-amber-50 text-amber-700 border-amber-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function formatDate(date) {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getToken() {
  return localStorage.getItem("access_token");
}

export default function ChangeRequestDetails({
  changeRequest,
  onBack,
}) {
  const [affectedCIs, setAffectedCIs] = useState([]);
  const [loadingAffectedCIs, setLoadingAffectedCIs] = useState(true);
  const [affectedCIError, setAffectedCIError] = useState("");

  const [approvals, setApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [approvalError, setApprovalError] = useState("");

  // Fetch affected configuration items
  useEffect(() => {
    if (!changeRequest?.id) return;

    const fetchAffectedCIs = async () => {
      setLoadingAffectedCIs(true);
      setAffectedCIError("");

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/change-request-cis/change-request/${changeRequest.id}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        if (!response.ok) {
  throw new Error(
    `Failed to load affected configuration items. HTTP ${response.status}`
  );
}

        const data = await response.json();
        setAffectedCIs(Array.isArray(data) ? data : []);
      } catch (error) {
        setAffectedCIError(
          error.message ||
            "Unable to load affected configuration items."
        );
      } finally {
        setLoadingAffectedCIs(false);
      }
    };

    fetchAffectedCIs();
  }, [changeRequest?.id]);

  // Fetch approval history
  useEffect(() => {
    if (!changeRequest?.id) return;

    const fetchApprovals = async () => {
      setLoadingApprovals(true);
      setApprovalError("");

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/approvals/change-request/${changeRequest.id}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        if (!response.ok) {
  throw new Error(
    `Failed to load approval history. HTTP ${response.status}`
  );
}

        const data = await response.json();
        setApprovals(Array.isArray(data) ? data : []);
      } catch (error) {
        setApprovalError(
          error.message || "Unable to load approval history."
        );
      } finally {
        setLoadingApprovals(false);
      }
    };

    fetchApprovals();
  }, [changeRequest?.id]);

  if (!changeRequest) return null;

  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Project
      </button>

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <GitPullRequest size={22} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {changeRequest.title}
                  </h1>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyles(
                      changeRequest.status
                    )}`}
                  >
                    {changeRequest.status}
                  </span>
                </div>

                <p className="mt-1.5 text-sm text-slate-500">
                  Change Request #{changeRequest.id}
                </p>
              </div>
            </div>

            <span
              className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${getPriorityStyles(
                changeRequest.priority
              )}`}
            >
              {changeRequest.priority} PRIORITY
            </span>
          </div>
        </div>

        {/* Overview */}
        <div className="grid border-b border-slate-100 sm:grid-cols-3">
          <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Request ID
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              CR #{changeRequest.id}
            </p>
          </div>

          <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Requested By
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-800">
              User #{changeRequest.requested_by_id ?? "—"}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Created
            </p>

            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <CalendarDays
                size={14}
                className="text-slate-400"
              />

              {formatDate(changeRequest.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Details */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="space-y-6">
          {/* Change Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <GitPullRequest
                size={17}
                className="text-blue-600"
              />

              <h2 className="font-semibold text-slate-950">
                Change Description
              </h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {changeRequest.description ||
                "No description provided."}
            </p>
          </div>

          {/* Reason */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <AlertCircle
                size={17}
                className="text-amber-600"
              />

              <h2 className="font-semibold text-slate-950">
                Reason for Change
              </h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {changeRequest.reason || "No reason provided."}
            </p>
          </div>

          {/* Affected Configuration Items */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package
                  size={17}
                  className="text-blue-600"
                />

                <h2 className="font-semibold text-slate-950">
                  Affected Configuration Items
                </h2>
              </div>

              {!loadingAffectedCIs && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {affectedCIs.length}
                </span>
              )}
            </div>

            {loadingAffectedCIs ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                <Loader2
                  size={16}
                  className="animate-spin"
                />

                Loading affected configuration items...
              </div>
            ) : affectedCIError ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                <AlertTriangle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Unable to load affected items
                  </p>

                  <p className="mt-1 text-xs text-red-600">
                    {affectedCIError}
                  </p>
                </div>
              </div>
            ) : affectedCIs.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
                <Package
                  size={22}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-2 text-sm font-medium text-slate-600">
                  No configuration items linked
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  No affected configuration items have been
                  associated with this change request.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {affectedCIs.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Configuration Item #
                          {item.configuration_item_id}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Affected by Change Request #
                          {item.change_request_id}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${getImpactStyles(
                          item.impact_type
                        )}`}
                      >
                        {item.impact_type || "UNSPECIFIED"} IMPACT
                      </span>
                    </div>

                    {item.notes && (
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Impact Notes
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approval History */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={17}
                  className="text-emerald-600"
                />

                <h2 className="font-semibold text-slate-950">
                  Approval History
                </h2>
              </div>

              {!loadingApprovals && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {approvals.length}
                </span>
              )}
            </div>

            {loadingApprovals ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                <Loader2
                  size={16}
                  className="animate-spin"
                />

                Loading approval history...
              </div>
            ) : approvalError ? (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                {approvalError}
              </div>
            ) : approvals.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center">
                <ShieldCheck
                  size={22}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-2 text-sm font-medium text-slate-600">
                  No approvals recorded
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  This change request has not received an
                  approval decision yet.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Approval #{approval.id}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Approver User #{approval.approver_id}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyles(
                          approval.decision
                        )}`}
                      >
                        {approval.decision}
                      </span>
                    </div>

                    {approval.comments && (
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Comments
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {approval.comments}
                        </p>
                      </div>
                    )}

                    <p className="mt-3 text-[11px] text-slate-400">
                      {formatDate(approval.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={17}
              className="text-emerald-600"
            />

            <h2 className="font-semibold text-slate-950">
              Change Status
            </h2>
          </div>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Current Status
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {changeRequest.status}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              This change request is currently in{" "}
              {changeRequest.status?.toLowerCase() ||
                "current"}{" "}
              state.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}