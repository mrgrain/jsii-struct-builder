import { join } from 'path';
import { PrimitiveType, Stability } from '@jsii/spec';
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from 'projen/lib/typescript';
import { synthSnapshot } from 'projen/lib/util/synth';
import { Struct, ProjenStruct } from '../../src';

test('can mixin a struct', () => {
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

test('can mixin another projen struct', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const base = new ProjenStruct(project, {
    name: 'MyBaseInterface',
  });
  base.mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions'));

  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  struct.mixin(base);

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

test('can keep only some props', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  struct
    .mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions'))
    .only('projenCodeDir');

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('projenCodeDir');
  expect(renderedFile).not.toContain('filename');
});

test('can ignore deprecated props', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  struct.add(
    {
      name: 'currentProp',
      type: { primitive: PrimitiveType.Boolean },
    },
    {
      name: 'deprecatedProps',
      type: { primitive: PrimitiveType.Boolean },
      docs: { deprecated: 'use `currentProp`' },
    }
  );
  struct.withoutDeprecated();

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).not.toContain('deprecatedProps');
  expect(renderedFile).toContain('currentProp');
});

test('can make all props optional', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, { name: 'MyInterface' });
  struct.add(
    {
      name: 'optionalProp',
      type: { primitive: PrimitiveType.Boolean },
      optional: true,
    },
    {
      name: 'requiredProp',
      type: { primitive: PrimitiveType.Boolean },
      optional: false,
    }
  );
  struct.allOptional();

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('optionalProp?: boolean');
  expect(renderedFile).toContain('requiredProp?: boolean');
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
        custom: {
          pjnew: '"newVal"',
        },
      },
      optional: false,
    });

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('New summary');
  expect(renderedFile).toContain('@stability stable');
  expect(renderedFile).toContain('@default "projenrc"');
  expect(renderedFile).toContain('@pjnew "newVal"');
  expect(renderedFile).toMatchSnapshot();
});

test('can updateAll props', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  struct.mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions')).updateAll({
    docs: {
      stability: Stability.Stable,
    },
  });

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('@stability stable');
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

test('can use struct as type in add', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const base = new ProjenStruct(project, {
    name: 'MyBaseInterface',
  });

  const nestedStruct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  nestedStruct
    .mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions'))
    .update('filename', { docs: { default: '.projenRC.ts' } });

  base.add({
    name: 'projenrcTsOptions',
    type: nestedStruct,
    docs: {
      summary: 'My new Summary',
    },
  });

  // PREPARE
  const synthSnapshotOutput = synthSnapshot(project);
  const renderedNestedFile = synthSnapshotOutput['src/MyInterface.ts'];
  const renderedBaseFile = synthSnapshotOutput['src/MyBaseInterface.ts'];

  // ASSERT
  expect(renderedNestedFile).toMatchSnapshot();
  expect(renderedNestedFile).toContain('@default .projenRC.ts');
  expect(renderedBaseFile).toMatchSnapshot();
  expect(renderedBaseFile).toContain("import { MyInterface } from './'");
  expect(renderedBaseFile).toContain(
    'readonly projenrcTsOptions: MyInterface;'
  );
});

test('can use struct as type in update', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const base = new ProjenStruct(project, {
    name: 'MyBaseInterface',
  });

  const nestedStruct = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  nestedStruct
    .mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions'))
    .update('filename', { docs: { default: '.projenRC.ts' } });

  base
    .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))
    .update('projenrcTsOptions', {
      type: nestedStruct,
      docs: {
        summary: 'My new Summary',
      },
    });

  // PREPARE
  const synthSnapshotOutput = synthSnapshot(project);
  const renderedNestedFile = synthSnapshotOutput['src/MyInterface.ts'];
  const renderedBaseFile = synthSnapshotOutput['src/MyBaseInterface.ts'];

  // ASSERT
  expect(renderedNestedFile).toContain('@default .projenRC.ts');
  expect(renderedBaseFile).toContain("import { MyInterface } from './'");
  expect(renderedBaseFile).toContain(
    'readonly projenrcTsOptions?: MyInterface'
  );
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

test('can create a struct from empty', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const base = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  const addedStruct = Struct.empty();
  addedStruct.add({
    name: 'emptyProp',
    type: { primitive: PrimitiveType.Boolean },
  });
  base.mixin(addedStruct);

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('emptyProp');
});

test('can use an empty struct as type with name', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const nestedStruct = Struct.empty('pkg.sub.MyOtherInterface');
  nestedStruct.add({
    name: 'emptyProp',
    type: { primitive: PrimitiveType.Boolean },
  });

  const base = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  base.add({
    name: 'nestedProp',
    type: nestedStruct,
  });

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import { sub } from 'pkg';");
  expect(renderedFile).toContain('readonly nestedProp: sub.MyOtherInterface');
});
