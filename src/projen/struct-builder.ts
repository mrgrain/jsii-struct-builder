import { dirname, join, posix } from 'path';
import { Property, TypeKind } from '@jsii/spec';
import { Component, typescript } from 'projen';
import { StructFile } from './struct-file';
import { JsiiStructBuilder } from '../jsii-struct-builder';
import { findInterface } from '../private/assembly';

export interface StructBuilderOptions {
  /**
   * The name of the interface
   */
  readonly name: string;
  /**
   * Doc string for the interface
   * @default - Interface name
   */
  readonly description?: string;
  /**
   * The fqn of the interface
   *
   * Used to auto-add imports.
   * All referenced types are loaded based on the fqn hierarchy.
   *
   * See `importLocations` for customization options.
   *
   * @default `${project.name}.${options.name}`
   */
  readonly fqn?: string;
  /**
   * Output file path
   * @default - inside `srcdir` or `outdir` with the fqn turned into a path
   */
  readonly filePath?: string;
  /**
   * The module locations assemblies should be imported from
   *
   * All types are imported from the top-level of the module.
   * This map can be used to overwrite the default import locations.
   *
   * For local imports, the import traverse up a number of levels equivalent to the number of fqn parts of the rendered type.
   * E.g. if the the rendered type is `pkg.interface`, it is assumed to be at the top-level and imports from the same assembly would be from `./`.
   * If the rendered type is `pkg.nested.sub.interface` a local import will be from `../../`.
   *
   * @default - uses the assembly name for external packages
   * local imports traverse up a number of levels equivalent to the number of fqn parts
   */
  importLocations?: Record<string, string>;
  /**
   * The properties of this interface
   *
   * When extending, these will replace existing properties.
   *
   * @default []
   */
  readonly props?: {
    [name: string]: Omit<Property, 'name'>;
  };
  /**
   * Extends this jsii interface
   */
  readonly extends?: string;
  /**
   * Omit these properties from the parent interface
   */
  readonly omitProps?: string[];
  /**
   * Update these properties from the parent interface
   *
   * Property definitions are merged non-recursively.
   * I.e. when updating `type` a complete new type must be provided
   */
  readonly updateProps?: {
    [name: string]: Partial<Property>;
  };
}

/**
 * A component generating a jsii-compatible interface
 */
export class StructBuilder extends Component {
  private builder: JsiiStructBuilder;

  public constructor(
    project: typescript.TypeScriptProject,
    options: StructBuilderOptions
  ) {
    super(project);

    const fqn = options.fqn ?? `${project.name}.${options.name}`;
    const assembly = fqn.split('.').at(0) ?? project.name;

    this.builder = new JsiiStructBuilder({
      kind: TypeKind.Interface,
      assembly,
      fqn,
      name: options.name,
      docs: {
        summary: options.description ?? options.name,
      },
    });

    const properties = propsMapToArray(options.props);
    properties.forEach((p) => this.builder.add(p));

    if (options.extends) {
      const sourceSpec = findInterface(options.extends, true);
      const sourceBuilder = new JsiiStructBuilder(sourceSpec);
      const updated = propsMapToArray(options.updateProps);
      updated.forEach((p) => sourceBuilder.update(p.name, p));

      const omit = [
        ...(options.omitProps || []),
        ...properties.map((p) => p.name),
      ];
      omit.forEach((o) => sourceBuilder.omit(o));

      sourceBuilder.get().properties?.forEach((p) => this.builder.add(p));
    }

    const baseDir = project.srcdir ?? project.outdir;
    const outputFile = options.filePath ?? join(baseDir, fqnToPath(fqn));
    new StructFile(project, outputFile, this.builder.get(), {
      importLocations: {
        [assembly]: relativeImport(outputFile, baseDir),
        ...options.importLocations,
      },
    });
  }
}

function relativeImport(from: string, target: string): string {
  const diff = posix.relative(dirname(from), target);
  if (!diff) {
    return '.' + posix.sep;
  }
  return diff + posix.sep;
}

function fqnToPath(fqn: string): string {
  return join(...fqn.split('.').slice(1)) + '.ts';
}

function propsMapToArray<T extends object>(
  props: Record<string, T> = {}
): Array<T & { name: string }> {
  return Object.entries(props).map(([name, p]) => ({
    name,
    ...p,
  }));
}
