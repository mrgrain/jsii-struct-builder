import { join } from 'path';
import { PrimitiveType, Stability } from '@jsii/spec';
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from 'projen/lib/typescript';
import { synthSnapshot } from 'projen/lib/util/synth';
import { JsiiInterface } from '../src/jsii-interface';

test('can extend an interface', () => {
  // Arrange
  const project = new TestProject();

  // ACT
  new JsiiInterface(project, {
    name: 'MyInterface',
    extends: 'projen.typescript.ProjenrcOptions',
  });
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toMatchSnapshot();
});

test('can omit props', () => {
  // Arrange
  const project = new TestProject();

  // ACT
  new JsiiInterface(project, {
    name: 'MyInterface',
    extends: 'projen.typescript.ProjenrcOptions',
    omitProps: ['projenCodeDir', 'filename'],
  });
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).not.toContain('projenCodeDir');
  expect(renderedFile).not.toContain('filename');
});

test('can overwrite props', () => {
  // Arrange
  const project = new TestProject();

  // ACT
  new JsiiInterface(project, {
    name: 'MyInterface',
    extends: 'projen.typescript.ProjenrcOptions',
    props: {
      projenCodeDir: {
        type: {
          primitive: PrimitiveType.Number,
        },
      },
    },
  });
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('projenCodeDir: number');
});

test('can update props', () => {
  // Arrange
  const project = new TestProject();

  // ACT
  new JsiiInterface(project, {
    name: 'MyInterface',
    extends: 'projen.typescript.ProjenrcOptions',
    updateProps: {
      projenCodeDir: {
        docs: {
          summary: 'New summary',
          stability: Stability.Stable,
        },
        optional: false,
      },
    },
  });
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('New summary');
  expect(renderedFile).toContain('@stability stable');
  expect(renderedFile).toContain('@default "projenrc"');
  expect(renderedFile).toMatchSnapshot();
});

test('can import type from the same package at the top level', () => {
  // Arrange
  const project = new TestProject({
    name: 'test',
  });

  // ACT
  new JsiiInterface(project, {
    name: 'MyInterface',
    fqn: 'test.MyInterface',
    props: {
      localProp: {
        type: {
          fqn: 'test.OtherInterface',
        },
      },
      localNestedProp: {
        type: {
          fqn: 'test.more.OtherInterface',
        },
      },
    },
  });
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import { more, OtherInterface } from './';");
});

test('can import type from the same package when nested', () => {
  // Arrange
  const project = new TestProject({
    name: 'test',
  });

  // ACT
  new JsiiInterface(project, {
    name: 'MyInterface',
    fqn: 'test.one.two.three.MyInterface',
    props: {
      localProp: {
        type: {
          fqn: 'test.OtherInterface',
        },
      },
      localNestedProp: {
        type: {
          fqn: 'test.more.OtherInterface',
        },
      },
    },
  });
  const renderedFile =
    synthSnapshot(project)['src/one/two/three/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain(
    "import { more, OtherInterface } from '../../../';"
  );
});

test("can import type from the same package when in a location that's not matching fqn levels", () => {
  // Arrange
  const project = new TestProject({
    name: 'test',
  });

  // ACT
  new JsiiInterface(project, {
    name: 'MyInterface',
    fqn: 'test.one.two.three.MyInterface',
    filePath: join(project.srcdir, 'sub', 'MyInterface.ts'),
    props: {
      localProp: {
        type: {
          fqn: 'test.OtherInterface',
        },
      },
      localNestedProp: {
        type: {
          fqn: 'test.more.OtherInterface',
        },
      },
    },
  });
  const renderedFile = synthSnapshot(project)['src/sub/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import { more, OtherInterface } from '../';");
});

test('can import type from an other package', () => {
  // Arrange
  const project = new TestProject({
    name: 'test',
  });

  // ACT
  new JsiiInterface(project, {
    name: 'MyInterface',
    fqn: 'test.MyInterface',
    extends: 'projen.typescript.ProjenrcOptions',
    props: {
      testProp: {
        type: {
          fqn: 'projen.typescript.TypeScriptProjectOptions',
        },
      },
    },
  });
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import { typescript } from 'projen';");
});

test('can override import locations', () => {
  // Arrange
  const project = new TestProject({
    name: 'test',
  });

  // ACT
  new JsiiInterface(project, {
    name: 'MyInterface',
    fqn: 'test.MyInterface',
    extends: 'projen.typescript.ProjenrcOptions',
    importLocations: {
      test: 'foobar',
      projen: 'banana',
    },
    props: {
      localProp: {
        type: {
          fqn: 'test.OtherInterface',
        },
      },
      localNestedProp: {
        type: {
          fqn: 'test.more.OtherInterface',
        },
      },
      externalProp: {
        type: {
          fqn: 'projen.typescript.TypeScriptProjectOptions',
        },
      },
    },
  });
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain(
    "import { more, OtherInterface } from 'foobar';"
  );
  expect(renderedFile).toContain("import { typescript } from 'banana';");
});

class TestProject extends TypeScriptProject {
  public constructor(options: Partial<TypeScriptProjectOptions> = {}) {
    super({
      name: 'test',
      defaultReleaseBranch: 'main',
      ...options,
    });
  }
}
