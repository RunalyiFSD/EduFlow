import React, { useState, useEffect } from "react";
import { getAdminAuditLogs } from "../../api/userApi.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Loader } from "../../components/Loader";
import { Search } from "lucide-react";
import "./AuditLogs.css";

export const AuditLogs = () => {
  const { token } = useAuth();

  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      loadLogs();
    }
  }, [token]);

  const loadLogs = async () => {
    try {
      const data = await getAdminAuditLogs(token);
      setLogs(data.logs);
    } catch (err) {
      setError(
        err.message ||
          "Failed to populate system audit trails."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();

    return (
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      (log.user &&
        log.user.name.toLowerCase().includes(term)) ||
      (log.user &&
        log.user.email.toLowerCase().includes(term))
    );
  });

  if (loading) return <Loader />;

  return (
    <div className="page-wrapper">
      <div className="audit-header">
        <h1 className="audit-title">
          System Audit Trails
        </h1>

        <p className="audit-subtitle">
          Cryptographic operations monitoring,
          account creations, updates, and login
          audits.
        </p>
      </div>

      {error && (
        <div className="audit-error-alert">
          {error}
        </div>
      )}

      <div className="form-group audit-search-container">
        <Search
          size={18}
          className="audit-search-icon"
        />

        <input
          type="text"
          className="form-input audit-search-input"
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          placeholder="Filter by action type, email, details message..."
        />
      </div>

      <div className="glass-card audit-card">
        {filteredLogs.length === 0 ? (
          <p className="audit-empty-state">
            No audit records matched your filter
            terms.
          </p>
        ) : (
          <div className="audit-table-scroll">
            <table className="audit-table">
              <thead>
                <tr className="audit-th-row">
                  <th className="audit-th">
                    Timestamp
                  </th>
                  <th className="audit-th">
                    Action
                  </th>
                  <th className="audit-th">
                    User Account
                  </th>
                  <th className="audit-th">
                    Detailed Message
                  </th>
                  <th className="audit-th">
                    IP Address
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    className="audit-tr"
                  >
                    <td className="audit-td">
                      <div className="audit-date-text">
                        {new Date(
                          log.timestamp
                        ).toLocaleDateString()}
                      </div>

                      <div className="audit-time-text">
                        {new Date(
                          log.timestamp
                        ).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="audit-td">
                      <span className="audit-action-tag">
                        {log.action}
                      </span>
                    </td>

                    <td className="audit-td">
                      {log.user ? (
                        <div>
                          <div className="audit-user-name">
                            {log.user.name}
                          </div>

                          <div className="audit-user-email">
                            {log.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="audit-system-tag">
                          EduFlow Service
                        </span>
                      )}
                    </td>

                    <td className="audit-td">
                      <div className="audit-details-box">
                        {log.details}
                      </div>
                    </td>

                    <td className="audit-td">
                      <code className="audit-ip-text">
                        {log.ipAddress ||
                          "127.0.0.1"}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;