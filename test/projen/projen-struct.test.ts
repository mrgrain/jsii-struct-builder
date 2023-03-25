import { join } from 'path';
import { PrimitiveType, Stability } from '@jsii/spec';
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from 'projen/lib/typescript';
import { synthSnapshot } from 'projen/lib/util/synth';
import { Struct, ProjenStruct } from '../../src';

test('can extend an interface', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  struct.mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions'));

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toMatchSnapshot();
  expect(renderedFile).toContain('projenCodeDir');
  expect(renderedFile).toContain('filename');
});

test('can omit props', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  struct
    .mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions'))
    .omit('projenCodeDir', 'filename');

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).not.toContain('projenCodeDir');
  expect(renderedFile).not.toContain('filename');
});

test('can overwrite props', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  struct.mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions')).add({
    name: 'projenCodeDir',
    type: {
      primitive: PrimitiveType.Number,
    },
  });

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('projenCodeDir: number');
});

test('can update props', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  struct
    .mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions'))
    .update('projenCodeDir', {
      docs: {
        summary: 'New summary',
        stability: Stability.Stable,
      },
      optional: false,
    });

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('New summary');
  expect(renderedFile).toContain('@stability stable');
  expect(renderedFile).toContain('@default "projenrc"');
  expect(renderedFile).toMatchSnapshot();
});

test('can import type from the same package at the top level', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
    fqn: 'test.MyInterface',
  });
  struct.add(
    {
      name: 'localProp',
      type: {
        fqn: 'test.OtherInterface',
      },
    },
    {
      name: 'localNestedProp',
      type: {
        fqn: 'test.more.OtherInterface',
      },
    }
  );

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import { more, OtherInterface } from './';");
});

test('can import type from the same package when nested', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
    fqn: 'test.a.b.c.MyInterface',
  });
  struct.add(
    {
      name: 'localProp',
      type: {
        fqn: 'test.OtherInterface',
      },
    },
    {
      name: 'localNestedProp',
      type: {
        fqn: 'test.more.OtherInterface',
      },
    }
  );

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/a/b/c/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain(
    "import { more, OtherInterface } from '../../../';"
  );
});

test("can import type from the same package when in a location that's not matching fqn levels", () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
    fqn: 'test.one.two.three.MyInterface',
    filePath: join(project.srcdir, 'sub', 'MyInterface.ts'),
  });
  struct.add(
    {
      name: 'localProp',
      type: {
        fqn: 'test.OtherInterface',
      },
    },
    {
      name: 'localNestedProp',
      type: {
        fqn: 'test.more.OtherInterface',
      },
    }
  );

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/sub/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import { more, OtherInterface } from '../';");
});

test('can import type from an other package', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
    fqn: 'test.MyInterface',
  });

  struct.mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions')).add({
    name: 'testProp',
    type: {
      fqn: 'projen.typescript.TypeScriptProjectOptions',
    },
  });

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import { typescript } from 'projen';");
});

test('can override import locations', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
    fqn: 'test.MyInterface',
    importLocations: {
      foo: 'bar',
      projen: 'banana',
    },
  });

  struct.mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions')).add(
    {
      name: 'localProp',
      type: {
        fqn: 'foo.OtherInterface',
      },
    },
    {
      name: 'localNestedProp',
      type: {
        fqn: 'foo.more.OtherInterface',
      },
    },
    {
      name: 'externalProp',
      type: {
        fqn: 'projen.typescript.TypeScriptProjectOptions',
      },
    }
  );

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import { more, OtherInterface } from 'bar';");
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
