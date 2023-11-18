import { writeFileSync } from 'fs';
import { join } from 'path';
import { PrimitiveType, Stability } from '@jsii/spec';
import { JsiiProject } from 'projen/lib/cdk';
import { NodePackageManager } from 'projen/lib/javascript';
import {
  TypeScriptProject,
  TypeScriptProjectOptions,
} from 'projen/lib/typescript';
import { synthSnapshot } from 'projen/lib/util/synth';
import { Struct, ProjenStruct } from '../../src';

class TestProject extends TypeScriptProject {
  public constructor(options: Partial<TypeScriptProjectOptions> = {}) {
    super({
      name: 'test',
      defaultReleaseBranch: 'main',
      ...options,
    });
  }
}

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

test('can load structs from an assembly in the current working directory', () => {
  // ARRANGE
  const cwd = process.cwd();
  const project = new JsiiProject({
    name: '@mrgrain/local-assembly-test',
    author: 'Test',
    authorAddress: 'me@example.com',
    defaultReleaseBranch: 'main',
    repositoryUrl: 'https://example.com',
    jsiiVersion: '5.1.x',
    packageManager: NodePackageManager.NPM,
  });

  // Create a new interface at src/index.ts, synth the project and run jsii to build the local assembly
  writeFileSync(join(project.outdir, '.jsii'), JSON.stringify({
    author: {
      email: 'me@example.com',
      name: 'Test',
      roles: [
        'author',
      ],
    },
    description: '@mrgrain/local-assembly-test',
    docs: {
      stability: 'stable',
    },
    homepage: 'https://example.com',
    jsiiVersion: '5.1.12 (build 0675712)',
    license: 'Apache-2.0',
    metadata: {
      jsii: {
        pacmak: {
          hasDefaultInterfaces: true,
        },
      },
      tscRootDir: 'src',
    },
    name: '@mrgrain/local-assembly-test',
    readme: {
      markdown: '# replace this',
    },
    repository: {
      type: 'git',
      url: 'https://example.com',
    },
    schema: 'jsii/0.10.0',
    targets: {
      js: {
        npm: '@mrgrain/local-assembly-test',
      },
    },
    types: {
      '@mrgrain/local-assembly-test.MyInterface': {
        assembly: '@mrgrain/local-assembly-test',
        datatype: true,
        docs: {
          stability: 'stable',
          summary: 'MyInterface.',
        },
        fqn: '@mrgrain/local-assembly-test.MyInterface',
        kind: 'interface',
        locationInModule: {
          filename: 'src/index.ts',
          line: 6,
        },
        name: 'MyInterface',
        properties: [
          {
            abstract: true,
            docs: {
              default: '".projenrc.ts"',
              stability: 'experimental',
              summary: 'The name of the projenrc file.',
            },
            immutable: true,
            locationInModule: {
              filename: 'src/index.ts',
              line: 24,
            },
            name: 'filename',
            optional: true,
            type: {
              primitive: 'string',
            },
          },
          {
            abstract: true,
            docs: {
              default: '"projenrc"',
              stability: 'experimental',
              summary: 'A directory tree that may contain *.ts files that can be referenced from your projenrc typescript file.',
            },
            immutable: true,
            locationInModule: {
              filename: 'src/index.ts',
              line: 18,
            },
            name: 'projenCodeDir',
            optional: true,
            type: {
              primitive: 'string',
            },
          },
          {
            abstract: true,
            docs: {
              default: 'false',
              stability: 'experimental',
              summary: 'Whether to use `SWC` for ts-node.',
            },
            immutable: true,
            locationInModule: {
              filename: 'src/index.ts',
              line: 12,
            },
            name: 'swc',
            optional: true,
            type: {
              primitive: 'boolean',
            },
          },
        ],
        symbolId: 'src/index:MyInterface',
      },
    },
    version: '0.0.0',
    fingerprint: 'dWWza3Loc/4ffyckw0hxDDzZ2NAxtYLy55aT+FdHwBU=',
  }));

  // ACT
  process.chdir(project.outdir);
  new ProjenStruct(project, { name: 'MyExtendedInterface' })
    .mixin(Struct.fromFqn('@mrgrain/local-assembly-test.MyInterface'));

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyExtendedInterface.ts'];

  // ASSERT
  expect(renderedFile).toMatchSnapshot();
  expect(renderedFile).toContain('projenCodeDir');
  expect(renderedFile).toContain('filename');

  // CLEANUP
  process.chdir(cwd);
});

test('can use the result of a chain', () => {
  // ARRANGE
  const project = new TestProject();
  const base = new ProjenStruct(project, {
    name: 'MyInterface',
  });
  const other = new ProjenStruct(project, {
    name: 'MyOtherInterface',
  }).mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions'));

  // ACT
  base.mixin(other);

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
    },
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
    },
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

test('can rename a prop', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, { name: 'MyInterface' });
  struct.add(
    {
      name: 'oldProp',
      type: { primitive: PrimitiveType.Boolean },
      optional: true,
    },
  );
  struct.rename('oldProp', 'newProp');

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).not.toContain('oldProp');
  expect(renderedFile).toContain('newProp?: boolean');
  expect(renderedFile).toMatchSnapshot();
});

test('can updateEvery property', () => {
  // ARRANGE
  const project = new TestProject();
  const spec = {
    type: { primitive: PrimitiveType.Boolean },
    optional: false,
    docs: {
      summary: 'This property is required',
      default: 'true',
    },
  };

  // ACT
  const struct = new ProjenStruct(project, { name: 'MyInterface' });
  struct.add(
    { name: 'propOne', ...spec },
    { name: 'propTwo', ...spec },
    { name: 'propThree', ...spec },
  ).updateEvery((property) => {
    if (!property.optional) {
      return {
        docs: {
          default: undefined,
        },
      };
    }
    return {};
  });

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).not.toContain('@default true');
  expect(renderedFile).toMatchSnapshot();
});

test('can replace a prop', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, { name: 'MyInterface' });
  struct.add(
    {
      name: 'oldProp',
      type: { primitive: PrimitiveType.Boolean },
      optional: true,
    },
  );
  struct.replace('oldProp', {
    name: 'newProp',
    type: { primitive: PrimitiveType.Number },
    optional: false,
  });

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).not.toContain('oldProp');
  expect(renderedFile).toContain('newProp: number');
  expect(renderedFile).toMatchSnapshot();
});

test('can map properties', () => {
  // ARRANGE
  const project = new TestProject();
  const spec = {
    type: { primitive: PrimitiveType.Boolean },
    optional: false,
    docs: {
      summary: 'This property is required',
      default: 'true',
    },
  };

  // ACT
  const struct = new ProjenStruct(project, { name: 'MyInterface' });
  struct.add(
    { name: 'propOne', ...spec },
    { name: 'propTwo', ...spec },
    { name: 'propThree', ...spec },
    { name: 'propFour', ...spec },
  ).map((property) => {
    switch (property.name) {
      case 'propOne':
        return {
          name: 'aDate',
          type: { primitive: PrimitiveType.Date },
        };
      case 'propTwo':
        return {
          name: 'aString',
          type: { primitive: PrimitiveType.String },
        };
      case 'propThree':
        return {
          name: 'aNumber',
          type: { primitive: PrimitiveType.Number },
        };
      default:
        return property;
    }
  });

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).not.toContain('propOne');
  expect(renderedFile).toContain('aDate');
  expect(renderedFile).not.toContain('propTwo');
  expect(renderedFile).toContain('aString');
  expect(renderedFile).not.toContain('propThree');
  expect(renderedFile).toContain('aNumber');
  expect(renderedFile).toContain('propFour');
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
    },
  );

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import type { more, OtherInterface } from './';");
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
    },
  );

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/a/b/c/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain(
    "import type { more, OtherInterface } from '../../../';",
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
    },
  );

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/sub/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import type { more, OtherInterface } from '../';");
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
  expect(renderedFile).toContain("import type { typescript } from 'projen';");
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
    },
  );

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain("import type { more, OtherInterface } from 'bar';");
  expect(renderedFile).toContain("import type { typescript } from 'banana';");
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
  expect(renderedBaseFile).toContain("import type { MyInterface } from './'");
  expect(renderedBaseFile).toContain(
    'readonly projenrcTsOptions: MyInterface;',
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
  expect(renderedBaseFile).toContain("import type { MyInterface } from './'");
  expect(renderedBaseFile).toContain(
    'readonly projenrcTsOptions?: MyInterface',
  );
});

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
  expect(renderedFile).toContain("import type { sub } from 'pkg';");
  expect(renderedFile).toContain('readonly nestedProp: sub.MyOtherInterface');
});

test('can set renderer options', () => {
  // ARRANGE
  const project = new TestProject();

  // ACT
  const struct = new ProjenStruct(project, {
    name: 'MyInterface',
    outputFileOptions: {
      useTypeImports: true,
      indent: 10,
    },
  });
  struct.mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'));

  // PREPARE
  const renderedFile = synthSnapshot(project)['src/MyInterface.ts'];

  // ASSERT
  expect(renderedFile).toContain('import type');
  expect(renderedFile).toContain(' '.repeat(10));
});
