import { github, release, typescript } from 'projen';
const project = new typescript.TypeScriptProject({
  projenrcTs: true,

  // Project info
  name: '@mrgrain/jsii-extend-interface',
  description: 'Make working with jsii interfaces great again',
  authorName: 'Momo Kornher',
  authorEmail: 'mail@moritzkornher.de',
  authorUrl: 'https://moritzkornher.de',
  sampleCode: false,

  // TypeScript
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
  autoApproveUpgrades: true,
  autoApproveOptions: {
    allowedUsernames: [
      'projen-builder[bot]', // Bot account for upgrade PRs
      'mrgrain', // Auto-approve PRs of main maintainer
    ],
  },

  // Release
  defaultReleaseBranch: 'main',
  release: false,
  releaseTrigger: release.ReleaseTrigger.scheduled({
    schedule: '0 5 1 * *',
  }),

  // Dependencies
  deps: ['@jsii/spec'],
  devDeps: ['projen'],
  peerDeps: ['projen'],
  peerDependencyOptions: {
    pinnedDevDependency: false,
  },
});
project
  .tryFindObjectFile('package.json')
  ?.addOverride('peerDependencies', { projen: 'x.x.x' });

project.synth();
