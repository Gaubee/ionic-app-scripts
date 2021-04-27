//@ts-check
const path = require("path");
const execSync = require("child_process").execSync;

const { Octokit } = require("@octokit/rest");

const changelogCommand = "conventional-changelog -p angular";

const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = require(packageJsonPath);

const github = new Octokit({
  version: "3.0.0",
  auth: require("./github-token.json").auth,
});

const env = { ...process.env };
env.PATH += ";" + path.join(__dirname, "../node_modules/.bin/");

const changelogContent = execSync(changelogCommand, {
  env,
}).toString();

(async () => {
  const result = await github.rest.repos.createRelease({
    owner: "gaubee",
    repo: "ionic-app-scripts",
    target_commitish: "bnqkl",
    tag_name: "v" + packageJson.version,
    name: packageJson.version,
    body: changelogContent,
    prerelease: false,
  });
  console.log("[create-github-release]: Process succeeded");
})().catch((err) => {
  if (err) {
    console.log("[create-github-release] An error occurred: " + err.message);
    process.exit(1);
  }
});
