export default {
  routes: [
    {
      method: 'POST',
      path: '/tasks/generate-today',
      handler: 'task.generateToday',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

