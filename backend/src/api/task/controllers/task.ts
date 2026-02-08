import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::task.task', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const tasks = await strapi.documents('api::task.task').findMany({
      filters: {
        user: {
          id: user.id,
        },
      },
    });

    return { data: tasks, meta: { pagination: {} } };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const task = await strapi.documents('api::task.task').create({
      data: {
        ...(ctx.request.body?.data ?? {}),
        user: user.id,
      },
    });

    return { data: task };
  }
}));
