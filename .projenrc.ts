import { typescript } from 'projen';
const project = new typescript.TypeScriptProject({
  projenrcTs: true,
  name: '@mrgrain/jsii-extend-interface',
  description: 'Make working with jsii interfaces great again',
  sampleCode: false,
  defaultReleaseBranch: 'main',
  release: false,
});
project.synth();