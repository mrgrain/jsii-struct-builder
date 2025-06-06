# ![jsii-struct-builder](./images/wordmark-dynamic.svg)

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

Or add `@mrgrain/jsii-struct-builder` to the `devDeps` in your project in your `.projenrc.ts` file, and run `npx projen` to install it.

Then add a `new ProjenStruct` in your `.projenrc.ts` file, passing a [TypeScript project](https://projen.io/typescript.html) as the first parameter.
See the sections below for more usage details.

If you're not using [`projen`](https://projen.io/), see [Use without `projen`](#use-without-projen).

### Requirements

```txt
Node.js >= 18
projen >= 0.65.0
```

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
      type: { fqn: 'my_project.SomeEnum' }, // my_project is the "name" in your projen project
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

### Updating multiple properties

A callback function can be passed to `updateEvery()` to update multiple properties at a time.

Use `updateAll()` to uniformly update all properties.
A convenience `allOptional()` method is provided to make all properties optional.

```js
new ProjenStruct(project, { name: 'MyProjectOptions'})
  .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))

  // Use a callback to make conditional updates
  .updateEvery((property) => {
    if (!property.optional) {
      return {
        docs: {
          remarks: 'This property is required.',
        },
      };
    }
    return {};
  })

  // Apply an update to all properties
  .updateAll({
    immutable: true,
  })

  // Mark all properties as optional
  .allOptional();
```

### Replacing properties

Existing properties can be replaced with a new `@jsii/spec` definition.
If a different `name` is provided, the property is also renamed.

A callback function can be passed to `map()` to map every property to a new `@jsii/spec` definition.

```ts
new ProjenStruct(project, { name: 'MyProjectOptions' })
  .mixin(Struct.fromFqn('projen.typescript.TypeScriptProjectOptions'))

  // Replace a property with an entirely new definition
  .replace('autoApproveOptions', {
    name: 'autoApproveOptions',
    type: { fqn: 'my_project.AutoApproveOptions' }, // my_project is the "name" in your projen project
    docs: {
      summary: 'Configure the auto-approval workflow.'
    }
  })

  // Passing a new name, will also rename the property
  .replace('autoMergeOptions', {
    name: 'mergeFlowOptions',
    type: { fqn: 'my_project.MergeFlowOptions' }, // my_project is the "name" in your projen project
  })

  // Use a callback to map every property to a new definition
  .map((property) => {
    if (property.protected) {
      return {
        ...property,
        protected: false,
        docs: {
          custom: {
            'internal': 'true',
          }
        }
      }
    }
    return property;
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

new ProjenStruct(project, { name: 'MyFunctionProps' })
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
import { MyFunctionProps } from './MyFunctionProps';

export class MyFunction extends Construct {
  constructor(scope: Construct, id: string, props: MyFunctionProps = {}) {
    super(scope, id);

    new Function(this, 'Function', {
      // sensible defaults
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      // user provided props
      ...props,
      // always force `code` from our construct
      code: Code.fromAsset(join(__dirname, 'lambda-handler')),
    });
  }
}
```

### Complex types

More complex jsii types can be used as well. They can be expressed like this:

```ts
import { PrimitiveType, CollectionKind } from '@jsii/spec';
import { ProjenStruct, Struct } from '@mrgrain/jsii-struct-builder';
import { awscdk } from 'projen';

const project = new awscdk.AwsCdkConstructLibrary({
  // your config - see https://projen.io/awscdk-construct.html
});

new ProjenStruct(project, {
  name: 'CustomFargateServiceProps',
  docs: {
    summary: 'ecs.FargateServiceProps without taskDefinition and desiredCount',
    remarks: `We do not want to allow the user to specify a task definition or desired count,
as this construct is meant to deploy a single service with a single task definition and
desired count of 1. So we narrow the ecs.FargateServiceProps type to exclude these properties.
Then we add some custom properties that are specific to our use case.`,
    custom: {
      'internal': 'true', // use this if you want to hide the struct from the public API
    },
  },
})
  .mixin(Struct.fromFqn('aws-cdk-lib.aws_ecs.FargateServiceProps'))
  .omit('taskDefinition', 'desiredCount')
  .add({
    name: 'logMappings',
    type: {
      collection: {
        elementtype: { fqn: 'my_project.LogMapping' }, // my_project is the "name" in your projen project
        kind: CollectionKind.Array,
      },
    },
    docs: {
      summary: 'An array of a locally-defined type. The fqn comes from the jsii module name.',
      remarks: 'This can be looked in the .jsii file like this: `jq -r \'.types[] | select (.name == "LogMapping") | .fqn\' .jsii`',
    },
  })
.add({
    name: 'agentCpu',
    type: { primitive: PrimitiveType.Number },
    optional: true, // an optional property
    docs: {
      summary: 'The amount of CPU units to allocate to the agent.', // here is how you format a long description
      remarks: `1024 CPU units = 1 vCPU.
This is passed to the Fargate task definition.
You might need to increase this if you have a lot of logs to process.
Only some combinations of memory and CPU are valid.`,
      see: 'https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs.TaskDefinition.html#memorymib',
      default: '512',
    },
  })
.add({
    name: 'mapToArray',
    type: {
      collection: {
        elementtype: {
          collection: {
            elementtype: { fqn: 'aws-cdk-lib.aws_logs.LogGroup' },
            kind: CollectionKind.Array,
          }
        },
        kind: CollectionKind.Map,
      },
    },
    docs: {
      summary: 'A map of string to an array of LogGroup objects.'
    },
  })
.add({
    name: 'mysteryObject',
    type: { primitive: PrimitiveType.Any },
    docs: {
      summary: 'An "any" type object.'
    },
})
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

Or you can mix in a `ProjenStruct` with another:

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
  fqn: 'my_project.nested.location.MyProjectOptions', // my_project is the "name" in your projen project
  filePath: 'src/nested/my-project-options.ts',
  importLocations: {
    my_project: '../enums',
  },
}).add({
  name: 'complexSetting',
  type: { fqn: 'my_project.SomeEnum' }, // my_project is the "name" in your projen project
});
```
