"use strict";
const axios = require("axios");

module.exports = {
  getWorkflows: async () => {
    const workflows = await strapi
      .query("workflow", "github-actions-workflowid")
      .find({ _sort: "name" }, []);

    return workflows;
  },

  triggerWorkflow: async (id) => {
    const dbWorkflow = await strapi
      .query("workflow", "github-actions-workflowid")
      .findOne({ id });

    const workflow = dbWorkflow;
    const res = await axios.post(`https://api.github.com/repos/${workflow.repo_owner}/${workflow.repo_name}/actions/workflows/${workflow.name}/dispatches`,
      {
        ref: "main",
        inputs: {},
      },
      {
        headers: {
          Accept: 'application/vnd.github+json', Authorization: `token ${workflow.pat}`,
        },
      }
    );

    await strapi
      .query("workflow", "github-actions-workflowid")
      .update({ id }, { started_at: Date.now() });

    return {};
  },
};
