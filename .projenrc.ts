import {
  github,
  javascript,
  ReleasableCommits,
  TextFile,
  typescript,
} from 'projen';
const project = new typescript.TypeScriptProject({
  projenrcTs: true,

  // Project info
  name: '@mrgrain/jsii-struct-builder',
  description: 'Build jsii structs with ease',
  authorName: 'Momo Kornher',
  authorEmail: 'mail@moritzkornher.de',
  authorUrl: 'https://moritzkornher.de',
  repository: 'https://github.com/mrgrain/jsii-struct-builder',
  homepage: 'https://github.com/mrgrain/jsii-struct-builder',
  sampleCode: false,

  // Node & TypeScript config
  tsconfig: {
    compilerOptions: {
      lib: ['es2022'],
    },
  },

  // Formatting
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
    },
  },

  // Automation
  githubOptions: {
    projenCredentials: github.GithubCredentials.fromApp(),
    pullRequestLintOptions: {
      semanticTitleOptions: {
        types: ['feat', 'fix', 'chore', 'docs', 'ci', 'revert'],
      },
    },
  },
  depsUpgradeOptions: {
    workflowOptions: {
      schedule: javascript.UpgradeDependenciesSchedule.WEEKLY,
    },
  },
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: [
      'projen-builder[bot]', // Bot account for upgrade PRs
      'mrgrain', // Auto-approve PRs of main maintainer
    ],
  },

  // Release
  release: true,
  releaseToNpm: true,
  npmAccess: javascript.NpmAccess.PUBLIC,
  defaultReleaseBranch: 'main',
  releasableCommits: ReleasableCommits.ofType([
    'feat',
    'fix',
    'chore',
    'revert',
    'docs',
  ]),

  // Dependencies
  deps: ['@jsii/spec', '@ungap/structured-clone@~1.0.0'],
  devDeps: ['projen', '@types/ungap__structured-clone'],
  peerDeps: ['projen'],
  peerDependencyOptions: {
    pinnedDevDependency: false,
  },
});
project
  .tryFindObjectFile('package.json')
  ?.addOverride('peerDependencies', { projen: 'x.x.x' });

project.npmignore?.addPatterns(
  '.gitattributes',
  '.prettierignore',
  '.prettierrc.json',
  '.projenrc.ts'
);

new TextFile(project, '.nvmrc', { lines: ['v18'] });
new TextFile(project, '.node-version', { lines: ['v18'] });

project.synth();
