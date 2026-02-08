export default {
  async beforeUpdate(event: any) {
    const { data } = event.params;
    // Prevent users from manually changing the owner of a task via API
    if (data && 'user' in data) {
      delete data.user;
    }
  },
};