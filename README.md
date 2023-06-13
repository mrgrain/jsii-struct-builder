# jsii-struct-builder

Build jsii structs with ease.

Jsii doesn't support TypeScript [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) like `Partial` or `Omit`, making it difficult to re-use existing [struct interfaces](https://aws.github.io/jsii/specification/2-type-system/#structs).
With this package, you can work around that limitation and create brand new struct interfaces based on the jsii specification of any existing structs, their parents, and your custom specification.

From jsii's perspective, these structs are completely new types.
From a maintainer's perspective, they require the same minimal effort as utility types do.
Everybody wins!

## Usage

Install with:

```console
npm install --save-dev @mrgrain/jsii-struct-builder
```

Then add a `new ProjenStruct` in your `.projenrc.ts` file, passing a [TypeScript project](https://projen.io/typescript.html) as the first parameter.
See the sections below for more usage details.

If you're not using [`projen`](https://projen.io/), see [Use without `projen`](#use-without-projen).

### Create from an existing Struct

Use the jsii FQN to mix in an existing struct.
Use `omit()` to remove any properties you are not interested in.

```ts
new ProjenStruct(project, { name: 'MyProjectOptions' })
  .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))
  .omit('sampleCode', 'projenrcTs', 'projenrcTsOptions');
```

### Adding new Properties

New properties can be added with a `@jsii/spec` definition.
Complex types can be used and will be imported using their FQN.
Any existing properties of the same name will be replaced.

```ts
new ProjenStruct(project, { name: 'MyProjectOptions' })
  .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))
  .add(
    {
      name: 'booleanSetting',
      type: { primitive: jsii.PrimitiveType.Boolean },
    },
    {
      name: 'complexSetting',
      type: { fqn: 'my_project.SomeEnum' },
    }
  );
```

### Updating existing Properties

Existing properties can be updated.
The provided partial `@jsii/spec` definition will be deep merged with the existing spec.

A convenience `rename()` method is provided.
An `update()` of the `name` field has the same effect and can be combined with other updates.

```ts
new ProjenStruct(project, { name: 'MyProjectOptions'})
  .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))

  // Update a property
  .update('typescriptVersion', { optional: false })
  // Nested values can be updated
  .update('sampleCode', {
    docs: {
        summary: 'New summary',
        default: 'false',
      }
    }
  )

  // Rename a property
  .rename('homepage', 'website'})
  // ...this also does a rename
  .update('eslint', {
    name: 'lint',
    optional: false,
  });
```

### Filter properties

Arbitrary predicate functions can be used to filter properties.
Only properties that meet the condition are kept.

Use `omit()` and `only()` for easy name based filtering.
A convenience `withoutDeprecated()` method is also provided.

```ts
new ProjenStruct(project, { name: 'MyProjectOptions' })
  .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))

  // Keep properties using arbitrary filters
  .filter((prop) => !prop.optional)

  // Keep or omit properties by name
  .only('projenrcTs', 'projenrcTsOptions')
  .omit('sampleCode')

  // Remove all deprecated properties
  .withoutDeprecated();
```

### AWS CDK properties

A common use-case of this project is to expose arbitrary overrides in CDK constructs.
For example, you may want to provide common AWS Lambda configuration, but allow a consuming user to override any arbitrary property.

To accomplish this, first create the new struct in your `.projenrc.ts` file.

```ts
import { ProjenStruct, Struct } from '@mrgrain/jsii-struct-builder';
import { awscdk } from 'projen';

const project = new awscdk.AwsCdkConstructLibrary({
  // your config - see https://projen.io/awscdk-construct.html
});

new ProjenStruct(project, { name: 'FunctionOverrides' })
  .mixin(Struct.fromFqn('aws-cdk-lib.aws_lambda.FunctionProps'))
  .withoutDeprecated()
  .allOptional()
  .omit('code'); // our construct always provides the code
```

Then use the new struct in your CDK construct.

```ts
// lib/MyFunction.ts
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { join } from 'path';
import { FunctionOverrides } from './FunctionOverrides';

export interface MyFunctionProps {
  // ... other props here
  readonly functionOverrides?: FunctionOverrides;
}

export class MyFunction extends Construct {
  constructor(scope: Construct, id: string, props: MyFunctionProps = {}) {
    super(scope, id);

    const { functionOverrides = {} } = props;

    new Function(this, 'Function', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromAsset(join(__dirname, 'lambda-handler')),
      ...functionOverrides,
    });
  }
}
```

### Use without projen

It is not required to use _projen_ with this package.
You can use a renderer directly to create files:

```ts
const myProps = Struct.empty('@my-scope/my-pkg.MyFunctionProps')
  .mixin(Struct.fromFqn('aws-cdk-lib.aws_lambda.FunctionProps'))
  .withoutDeprecated();

const renderer = new TypeScriptRenderer();
fs.writeFileSync('my-props.ts', renderer.renderStruct(myProps));
```

### Advanced usage

`Struct` and `ProjenStruct` both share the same interface.
This allows some advanced applications.

For example you can manipulate the source for re-use:

```ts
const base = Struct.fromFqn('projen.typescript.TypeScriptProjectOptions');
base.omit('sampleCode', 'projenrcTs', 'projenrcTsOptions');
```

Or you can mix on `ProjenStruct` with another:

```ts
const foo = new ProjenStruct(project, { name: 'Foo' });
const bar = new ProjenStruct(project, { name: 'Bar' });

bar.mixin(foo);
```

You can also use `Struct` and `ProjenStruct` as type of a property:

```ts
const foo = new ProjenStruct(project, { name: 'Foo' });
const bar = new ProjenStruct(project, { name: 'Bar' });

foo.add({
  name: 'barSettings',
  type: bar,
});
```

The default configuration makes assumptions about the new interface that are usually okay.
For more complex scenarios `fqn`, `filePath` and `importLocations` can be used to influence the rendered output.

```ts
new JsiiInterface(project, {
  name: 'MyProjectOptions',
  fqn: 'my_project.nested.location.MyProjectOptions',
  filePath: 'src/nested/my-project-options.ts',
  importLocations: {
    my_project: '../enums',
  },
}).add({
  name: 'complexSetting',
  type: { fqn: 'my_project.SomeEnum' },
});
```
