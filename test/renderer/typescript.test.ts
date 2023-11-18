import { PrimitiveType } from '@jsii/spec';
import { Struct, TypeScriptRenderer } from '../../src';

test('required properties do render @default by default', () => {
  // ARRANGE
  const renderer = new TypeScriptRenderer();
  const struct = Struct.empty('@my-scope/my-pkg.MyFunctionProps');
  struct.add({
    name: 'requiredProp',
    type: { primitive: PrimitiveType.String },
    optional: false,
    docs: {
      default: '"foobar"',
    },
  });

  // ACT
  const renderedFile = renderer.renderStruct(struct);

  // ASSERT
  expect(renderedFile).toMatchSnapshot();
  expect(renderedFile).toContain('@default');
  expect(renderedFile).toContain('foobar');
});
