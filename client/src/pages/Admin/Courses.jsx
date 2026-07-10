import React, { useState, useEffect } from "react";
import {
  getCourses,
  deleteCourse,
} from "../../api/courseApi";
import { useAuth } from "../../hooks/useAuth";
import { Loader } from "../../components/Loader";
import { Trash2 } from "lucide-react";
import "./Courses.css";

export const Courses = () => {
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (token) {
      loadAllCourses();
    }
  }, [token]);

  const loadAllCourses = async () => {
    try {
      const data = await getCourses({}, token);
      setCourses(data.courses);
    } catch (err) {
      setError(
        err.message ||
          "Failed to retrieve platform courses registry."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    courseId,
    title
  ) => {
    if (
      !window.confirm(
        `Warning: You are deleting the course "${title}" as an administrator. This deletes the course structure and all active enrollments. Continue?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteCourse(courseId, token);

      setSuccess(
        `Course "${title}" successfully removed.`
      );

      await loadAllCourses();
    } catch (err) {
      setError(
        err.message ||
          "Failed to remove course."
      );
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-wrapper">
      <div className="courses-header">
        <h1 className="courses-title">
          All Platform Courses
        </h1>

        <p className="courses-subtitle">
          Master index of authored courses.
          Review curricula layouts or execute
          deletions.
        </p>
      </div>

      {error && (
        <div className="courses-error-alert">
          {error}
        </div>
      )}

      {success && (
        <div className="courses-success-alert">
          {success}
        </div>
      )}

      <div className="glass-card courses-card">
        {courses.length === 0 ? (
          <p className="courses-empty">
            No courses authored on platform.
          </p>
        ) : (
          <table className="courses-table">
            <thead>
              <tr className="courses-th-row">
                <th className="courses-th">
                  Curriculum Title
                </th>
                <th className="courses-th">
                  Instructor
                </th>
                <th className="courses-th">
                  Category / Level
                </th>
                <th className="courses-th">
                  Syllabus Modules
                </th>
                <th className="courses-th">
                  Status
                </th>
                <th className="courses-th">
                  Administrative Action
                </th>
              </tr>
            </thead>

            <tbody>
              {courses.map((c) => (
                <tr
                  key={c._id}
                  className="courses-tr"
                >
                  <td className="courses-td">
                    <div className="courses-course-cell">
                      <img
                        src={
                          c.coverImageUrl ||
                          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
                        }
                        alt={c.title}
                        className="courses-thumb"
                      />

                      <span className="courses-name">
                        {c.title}
                      </span>
                    </div>
                  </td>

                  <td className="courses-td">
                    {c.instructor?.name ||
                      "Educator"}
                  </td>

                  <td className="courses-td">
                    <div className="courses-category">
                      {c.category}
                    </div>

                    <div className="courses-level">
                      {c.level}
                    </div>
                  </td>

                  <td className="courses-td">
                    {c.modules?.length || 0} Lessons
                  </td>

                  <td className="courses-td">
                    <span
                      className={`courses-status ${
                        c.isPublished
                          ? "published"
                          : "draft"
                      }`}
                    >
                      {c.isPublished
                        ? "Published"
                        : "Draft"}
                    </span>
                  </td>

                  <td className="courses-td">
                    <button
                      className="courses-delete-btn"
                      onClick={() =>
                        handleDelete(
                          c._id,
                          c.title
                        )
                      }
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Courses;