const { inspect } = require("util");
const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");

async function run() {
  try {
    const inputs = {
      token: core.getInput("token"),
      path: core.getInput("path"),
      title: core.getInput("title"),
    };

    const {
      payload: { pull_request: pullRequest, repository },
    } = github.context;

    if (!pullRequest) {
      core.error("This action only works on pull_request events");
      return;
    }

    const { number: issueNumber } = pullRequest;
    const { full_name: repoFullName } = repository;
    const [owner, repo] = repoFullName.split("/");

    const octokit = new github.getOctokit(inputs.token);

    const data = fs.readFileSync(
      `${process.env.GITHUB_WORKSPACE}/${inputs.path}`,
      "utf8"
    );
    const json = JSON.parse(data);

    const totalStatementsPct = json.total.statements.pct;
    const totalStatementsCovered = json.total.statements.covered;
    const totalStatementsTotal = json.total.statements.total;

    const totalBranchesPct = json.total.branches.pct;
    const totalBranchesCovered = json.total.branches.covered;
    const totalBranchesTotal = json.total.branches.total;
    const coverage = [
      `#### ${inputs.title}`,
      `| Statements | Branches | Functions | Lines |`,
      `|---|---|---|---|`,
      `| ${totalStatementsPct}% (${totalStatementsCovered} / ${totalStatementsTotal}) | ${totalBranchesPct}% (${totalBranchesCovered} / ${totalBranchesTotal}) | ${json.total.functions.pct}%  (${json.total.functions.covered} / ${json.total.functions.total}) | ${json.total.lines.pct}% (${json.total.lines.covered} / ${json.total.lines.total}) |`,
    ].join("\n");

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: eval("`" + coverage + "`"),
    });
  } catch (error) {
    core.debug(inspect(error));
    core.setFailed(error.message);
  }
}

run();
