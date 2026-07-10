import React from "react";
import { BookOpen, User, Award } from "lucide-react";
import "./CourseCard.css";

export const CourseCard = ({
  course,
  enrollment,
  onEnroll,
  onClick,
}) => {
  const {
    title,
    description,
    instructor,
    category,
    level,
    price,
    coverImageUrl,
    modules,
  } = course;

  const isEnrolled = !!enrollment;

  const getCoverImage = () => {
    if (!coverImageUrl)
      return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800";

    // Cloudinary and other full URLs
    if (coverImageUrl.startsWith("http://") || coverImageUrl.startsWith("https://")) {
      return coverImageUrl;
    }

    // Legacy local uploads (backward compatibility)
    if (coverImageUrl.startsWith("/uploads/")) {
      const serverUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : "http://localhost:5000";

      return `${serverUrl}${coverImageUrl}`;
    }

    return coverImageUrl;
  };

  return (
    <div
      className="glass-card course-card"
      onClick={onClick}
    >
      <div className="course-card-image-container">
        <img
          src={getCoverImage()}
          alt={title}
          className="course-card-image"
        />

        <span className="course-card-level-badge">
          {level}
        </span>
      </div>

      <div className="course-card-content">
        <span className="course-card-category">
          {category}
        </span>

        <h3 className="course-card-title">
          {title}
        </h3>

        <p className="course-card-desc">
          {description.substring(0, 85)}
          {description.length > 85 ? "..." : ""}
        </p>

        <div className="course-card-meta">
          <div className="course-card-meta-item">
            <User size={14} color="#94a3b8" />
            <span className="course-card-meta-text">
              {instructor?.name || "Educator"}
            </span>
          </div>

          <div className="course-card-meta-item">
            <BookOpen size={14} color="#94a3b8" />
            <span className="course-card-meta-text">
              {modules?.length || 0} Modules
            </span>
          </div>
        </div>

        {isEnrolled ? (
          <div className="course-card-enrolled-action" style={{ width: "100%", marginTop: "auto" }}>
            <button className="btn btn-secondary course-card-learn-btn" style={{ width: "100%" }}>
              Go to Course
            </button>
          </div>
        ) : (
          <div className="course-card-price-row">
            <span className="course-card-price">
              {price === 0
                ? "Free"
                : `₹${price}`}
            </span>

            {onEnroll && (
              <button
                className="btn btn-primary course-card-enroll-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnroll(course._id);
                }}
              >
                Enroll Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;