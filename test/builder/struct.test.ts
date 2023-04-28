import { Struct, TypeScriptRenderer } from '../../src';

test('can render a struct directly', () => {
  // ARRANGE
  const renderer = new TypeScriptRenderer();

  // ACT
  const struct = Struct.empty('@my-scope/my-pkg.MyFunctionProps');
  struct.mixin(Struct.fromFqn('projen.typescript.ProjenrcOptions'));

  // PREPARE
  const renderedFile = renderer.renderStruct(struct);

  // ASSERT
  expect(renderedFile).toMatchSnapshot();
  expect(renderedFile).toContain('projenCodeDir');
  expect(renderedFile).toContain('filename');
});
