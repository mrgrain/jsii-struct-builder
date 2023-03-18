import { github, javascript, release, typescript } from 'projen';
const project = new typescript.TypeScriptProject({
  projenrcTs: true,

  // Project info
  name: '@mrgrain/jsii-extend-interface',
  description:
    'A projen component to easily extend and adapt existing jsii interfaces',
  authorName: 'Momo Kornher',
  authorEmail: 'mail@moritzkornher.de',
  authorUrl: 'https://moritzkornher.de',
  repository: 'https://github.com/mrgrain/jsii-extend-interface',
  homepage: 'https://github.com/mrgrain/jsii-extend-interface',
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
  release: true,
  releaseToNpm: true,
  npmAccess: javascript.NpmAccess.PUBLIC,
  defaultReleaseBranch: 'main',
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

project.npmignore?.addPatterns(
  '.gitattributes',
  '.prettierignore',
  '.prettierrc.json',
  '.projenrc.ts'
);

project.synth();
