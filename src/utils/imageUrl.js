import { API_BASE_URL } from '../api/axiosInstance';

/**
 * Resolves a profile image URL safely.
 * Handles:
 * - Empty / null values -> returns null
 * - Bare filenames like "da1f8ad93c643ddb98ff436cb94bd78a.jpeg" -> prepends live server / uploads/profile/
 * - Relative paths starting with "uploads/" or "assets/" -> prepends API_BASE_URL
 * - Localhost URLs -> replaces with live API_BASE_URL
 * - Full https:// URLs -> returns as is
 */
export const resolveProfileImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  const base = (API_BASE_URL || 'https://billbook.visiontechnolabs.com/').replace(/\/+$/, '');

  // If already pointing to localhost, replace with live server base
  if (trimmed.includes('localhost/kaushik/billbook')) {
    return trimmed.replace(/https?:\/\/localhost\/kaushik\/billbook\/?/i, `${base}/`);
  }

  // If full HTTP/HTTPS URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // If relative path starting with uploads/ or assets/
  if (trimmed.startsWith('uploads/') || trimmed.startsWith('assets/')) {
    return `${base}/${trimmed}`;
  }

  // Bare filename (e.g., "da1f8ad93c643ddb98ff436cb94bd78a.jpeg")
  return `${base}/uploads/profile/${trimmed.replace(/^\/+/, '')}`;
};

export default resolveProfileImageUrl;
