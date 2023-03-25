import { InterfaceType, TypeKind } from '@jsii/spec';
import { Project } from 'projen';
import { synthSnapshot } from 'projen/lib/util/synth';
import { findInterface } from '../../src/private/assembly';
import { StructFile } from '../../src/projen';

test('can render a struct', () => {
  // Arrange
  const project = new TestProject();
  const spec = findInterface('projen.typescript.TypeScriptProjectOptions');

  // ACT
  new StructFile(project, 'interface.ts', spec);
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toMatchSnapshot();
});

test('will include properties from all parents', () => {
  // Arrange
  const project = new TestProject();
  const spec = findInterface('projen.typescript.TypeScriptProjectOptions');

  // ACT
  new StructFile(project, 'interface.ts', spec);
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toContain('readonly parent?: Project;');
});

test('can import from an external package', () => {
  // Arrange
  const project = new TestProject();
  const spec = findInterface(
    'projen.typescript.TypeScriptProjectOptions',
    false
  );

  // ACT
  spec.fqn = 'mypackage.Interface';
  new StructFile(project, 'interface.ts', spec);
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toContain(
    "import { javascript, typescript } from 'projen';"
  );
});

test('can import from the same package', () => {
  // Arrange
  const project = new TestProject();
  const spec: InterfaceType = {
    kind: TypeKind.Interface,
    assembly: 'test',
    fqn: 'test.sub.MyInterface',
    name: 'MyInterface',
    docs: { summary: 'MyInterface' },
    properties: [
      { name: 'localNestedProp', type: { fqn: 'test.more.OtherInterface' } },
      { name: 'localProp', type: { fqn: 'test.OtherInterface' } },
    ],
  };

  // ACT
  new StructFile(project, 'interface.ts', spec);
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import { more, OtherInterface } from '../';");
});

test('can override package imports', () => {
  // Arrange
  const project = new TestProject();
  const spec = findInterface(
    'projen.typescript.TypeScriptProjectOptions',
    false
  );

  // ACT
  new StructFile(project, 'interface.ts', spec, {
    importLocations: {
      projen: 'banana',
    },
  });
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toContain(
    "import { javascript, typescript } from 'banana';"
  );
});

class TestProject extends Project {
  public constructor() {
    super({
      name: 'test',
    });
  }
}
