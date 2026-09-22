function menuContextForUrl(url) {
  let pathname = '';
  try {
    pathname = new URL(url).pathname;
  } catch {
    return { inProject: false, hasActiveTab: false };
  }
  const inProject = /^\/projects\/[^/]+(?:\/|$)/.test(pathname);
  const hasActiveTab =
    inProject && /^\/projects\/[^/]+\/(?:sessions\/[^/]+|customize)(?:\/|$)/.test(pathname);
  return { inProject, hasActiveTab };
}

module.exports = { menuContextForUrl };
