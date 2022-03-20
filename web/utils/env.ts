export const getEnvironment = () => {
  return process.env.NODE_ENV;
};

export const getBuildId = () => {
  return process.env.NEXT_PUBLIC_BUILD_ID;
};

export const getSiteUrl = () => {
  const url = process.env.NEXT_PUBLIC_VERCEL_URL;

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
};

export const getAbsoluteUrl = (path: string) => {
  const siteUrl = getSiteUrl();

  if (siteUrl) {
    return new URL(path, getSiteUrl()).toString();
  }

  return path;
};

export const getGoogleAnalyticsToken = () => {
  if (getEnvironment() !== 'production') {
    return null;
  }

  return process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_TOKEN;
};
