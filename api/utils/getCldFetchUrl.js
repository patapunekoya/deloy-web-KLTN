// utils/getCldFetchUrl.js
export function getCldFetchUrl(googleUrl, cloudName) {
    if (!googleUrl) return '';
    const encoded = encodeURIComponent(googleUrl);
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto/${encoded}`;
  }
  