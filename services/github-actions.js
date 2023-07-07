"use strict";
const axios = require("axios");
const createError = require("http-errors");

const pluginPkg = require("../package.json");
const utils = require("../utils");

function populateWorkflowWithEnvPat(workflow) {
  try {
    const config = utils.getConfig();
    const hasEnvPat = config.hasEnvPat;

    if (!hasEnvPat) {
      return workflow;
    }

    const wfConfigPat = config.pats[workflow.name];

    if (wfConfigPat) {
      return {
        ...workflow,
        pat: wfConfigPat,
      };
    }

    strapi.log.debug(
      `${pluginPkg.name}: hasEnvPat is set to true but no token was found with name ${workflow.name}`
    );
    return workflow;
  } catch (e) {
    strapi.log.debug(`${pluginPkg.name}: ${e}`);
    throw createError(500, "Invalid config");
  }
}

module.exports = {
  populateWorkflowWithEnvPat,

  getWorkflows: async () => {
    const workflows = await strapi
      .query("workflow", "github-actions")
      .find({ _sort: "name" }, []);

    return workflows;
  },

  triggerWorkflow: async (id) => {
    const dbWorkflow = await strapi
      .query("workflow", "github-actions")
      .findOne({ id });

    const workflow = populateWorkflowWithEnvPat(dbWorkflow);
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

    console.log(res)

    await strapi
      .query("workflow", "github-actions")
      .update({ id }, { started_at: Date.now() });

    return {};
  },
};
