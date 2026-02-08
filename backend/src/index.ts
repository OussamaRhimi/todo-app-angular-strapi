// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi } /*: { strapi: Core.Strapi } */) {
    // Ensure the "Authenticated" role can access the Task content-api routes.
    // Without this, Strapi returns 403 even if JWT auth + policies are correct.
    const authenticatedRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' }, select: ['id'] });

    if (!authenticatedRole?.id) return;

    const requiredActions = [
      'api::task.task.find',
      'api::task.task.findOne',
      'api::task.task.create',
      'api::task.task.update',
      'api::task.task.delete',
      'api::task.task.generateToday',
    ];

    const existing = await strapi.db.query('plugin::users-permissions.permission').findMany({
      where: { role: authenticatedRole.id },
      select: ['action'],
    });

    const existingActions = new Set<string>(existing.map((p: any) => p.action).filter(Boolean));
    const toCreate = requiredActions.filter((action) => !existingActions.has(action));

    if (toCreate.length === 0) return;

    await Promise.all(
      toCreate.map((action) =>
        strapi.db.query('plugin::users-permissions.permission').create({
          data: { action, role: authenticatedRole.id },
        })
      )
    );

    strapi.log.info(
      `Enabled task permissions for authenticated role: ${toCreate.join(', ')}`
    );
  },
};
