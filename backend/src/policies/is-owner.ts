module.exports = async (policyContext: any) => {
  const user = policyContext.state?.user;

  if (!user || !user.id) return false;

  // If there is no ID in the URL (like a list GET or a POST), allow it
  // The Controller handles filtering the list.
  if (!policyContext.params.id) return true;

  const documentId = policyContext.params.id;

  try {
    // Strapi v5 uses the Document Service
    const task = await strapi.documents('api::task.task').findOne({
      documentId: documentId,
      populate: ['user'], // Specifically populate the user relation
    });

    if (!task) return false;

    // Check if the related user's ID matches the authenticated user ID
    return task.user?.id === user.id;
  } catch (err) {
    console.error('[Policy Error]', err);
    return false;
  }
};