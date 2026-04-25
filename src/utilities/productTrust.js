export const formatEuro = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Price unavailable";
  }

  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
      }).format(number)
    : "Price unavailable";
};

export const getSourceLabel = (source) => {
  switch (source) {
    case "user":
      return "User submitted";
    case "scraper":
      return "Collected";
    case "api":
      return "API sourced";
    case "admin":
      return "Admin added";
    default:
      return "Legacy record";
  }
};

export const getApprovalLabel = (status) => {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending":
      return "Pending review";
    case "rejected":
      return "Rejected";
    default:
      return "Unverified";
  }
};

export const getFreshnessLabel = (dateValue) => {
  if (!dateValue) return "Last checked unknown";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Last checked unknown";

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Last checked less than 1h ago";
  if (diffHours < 24) return `Last checked ${diffHours}h ago`;
  if (diffDays === 1) return "Last checked yesterday";
  if (diffDays < 14) return `Last checked ${diffDays} days ago`;

  return `Last checked ${date.toLocaleDateString()}`;
};

export const getTrustClass = (status) => {
  switch (status) {
    case "approved":
      return "approved";
    case "pending":
      return "pending";
    case "rejected":
      return "rejected";
    default:
      return "unknown";
  }
};
