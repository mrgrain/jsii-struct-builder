import { typescript } from 'projen';
const project = new typescript.TypeScriptProject({
  projenrcTs: true,
  name: '@mrgrain/jsii-extend-interface',
  description: 'Make working with jsii interfaces great again',
  sampleCode: false,

  defaultReleaseBranch: 'main',
  release: false,

  deps: ['@jsii/spec'],
  devDeps: ['projen'],
  peerDeps: ['projen'],

  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
    },
  },
  tsconfig: {
    compilerOptions: {
      lib: ['es2022'],
    },
  },
});
project.synth();
