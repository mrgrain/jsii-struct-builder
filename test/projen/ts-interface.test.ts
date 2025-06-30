import type { InterfaceType } from '@jsii/spec';
import { TypeKind } from '@jsii/spec';
import { Project } from 'projen';
import { synthSnapshot } from 'projen/lib/util/synth';
import { TypeScriptInterfaceFile } from '../../src';
import { findInterface } from '../../src/private';

test('can render a struct', () => {
  // Arrange
  const project = new TestProject();
  const spec = findInterface('projen.typescript.TypeScriptProjectOptions');

  // ACT
  new TypeScriptInterfaceFile(project, 'interface.ts', spec);
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toMatchSnapshot();
});

test('will include properties from all parents', () => {
  // Arrange
  const project = new TestProject();
  const spec = findInterface('projen.typescript.TypeScriptProjectOptions');

  // ACT
  new TypeScriptInterfaceFile(project, 'interface.ts', spec);
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toContain('readonly parent?: Project;');
});

test('can import from an external package', () => {
  // Arrange
  const project = new TestProject();
  const spec = findInterface(
    'projen.typescript.TypeScriptProjectOptions',
    false,
  );

  // ACT
  spec.fqn = 'mypackage.Interface';
  new TypeScriptInterfaceFile(project, 'interface.ts', spec);
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toContain(
    "import type { javascript, typescript } from 'projen';",
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
  new TypeScriptInterfaceFile(project, 'interface.ts', spec);
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import type { more, OtherInterface } from '../';");
});

test('can override package imports', () => {
  // Arrange
  const project = new TestProject();
  const spec = findInterface(
    'projen.typescript.TypeScriptProjectOptions',
    false,
  );

  // ACT
  new TypeScriptInterfaceFile(project, 'interface.ts', spec, {
    importLocations: {
      projen: 'banana',
    },
  });
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toContain(
    "import type { javascript, typescript } from 'banana';",
  );
});

test('can use explicit type imports', () => {
  // Arrange
  const project = new TestProject();
  const spec = findInterface(
    'projen.typescript.TypeScriptProjectOptions',
    false,
  );

  // ACT
  new TypeScriptInterfaceFile(project, 'interface.ts', spec, {
    useTypeImports: true,
  });
  const renderedFile = synthSnapshot(project)['interface.ts'];

  // ASSERT
  expect(renderedFile).toContain(
    "import type { javascript, typescript } from '../';",
  );
});

class TestProject extends Project {
  public constructor() {
    super({
      name: 'test',
    });
  }
}
