import { dirname, join, posix } from 'path';
import type { Docs, Property } from '@jsii/spec';
import { TypeKind } from '@jsii/spec';
import type { typescript } from 'projen';
import { Component } from 'projen';
import type { TypeScriptInterfaceFileOptions } from './ts-interface';
import { TypeScriptInterfaceFile } from './ts-interface';
import type {
  HasProperties,
  IStructBuilder,
  HasFullyQualifiedName,
  HasStructSpec,
} from '../builder';
import {
  Struct,
} from '../builder';

export interface ProjenStructOptions {
  /**
   * The name of the new struct
   */
  readonly name: string;
  /**
   * Doc string for the struct
   *
   * Just does the summary
   * If you want to add a full description, use `docs` instead.
   * This will not be used if `docs` is provided.
   *
   * @default - struct name
   */
  readonly description?: string;
  /**
   * Docs for the struct
   *
   * Use this to add a full description.
   * If you only want to add a summary, use `description` instead.
   *
   * @default - none, use `description` if provided
   */
  readonly docs?: Docs;
  /**
   * The fqn of the struct
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
  readonly importLocations?: Record<string, string>;
  /**
   * Options for the created output `TypeScriptInterfaceFile`
   */
  readonly outputFileOptions?: Omit<TypeScriptInterfaceFileOptions, 'importLocations'>;
}

/**
 * A component generating a jsii-compatible struct
 */
export class ProjenStruct extends Component implements IStructBuilder, HasProperties, HasFullyQualifiedName, HasStructSpec {
  private builder: Struct;

  public constructor(
    private tsProject: typescript.TypeScriptProject,
    private options: ProjenStructOptions,
  ) {
    super(tsProject);

    const fqn = options.fqn ?? `${tsProject.name}.${options.name}`;
    this.builder = Struct.fromSpec({
      kind: TypeKind.Interface,
      assembly: fqn.split('.').at(0) ?? tsProject.name,
      fqn,
      name: options.name,
      docs: options.docs ?? {
        summary: options.description ?? options.name,
      },
    });
  }

  preSynthesize(): void {
    const baseDir = this.tsProject.srcdir ?? this.tsProject.outdir;
    const outputFile =
      this.options.filePath ?? join(baseDir, fqnToPath(this.builder.spec.fqn));
    new TypeScriptInterfaceFile(this.tsProject, outputFile, this.builder.spec, {
      ...this.options.outputFileOptions,
      importLocations: {
        [this.builder.spec.assembly]: relativeImport(outputFile, baseDir),
        ...this.options.importLocations,
      },
    });
  }

  public get spec() {
    return this.builder.spec;
  }
  add(...props: Property[]): this {
    this.builder.add(...props);
    return this;
  }
  mixin(...sources: HasProperties[]): this {
    this.builder.mixin(...sources);
    return this;
  }
  replace(name: string, replacement: Property): IStructBuilder {
    this.builder.replace(name, replacement);
    return this;
  }
  map(callbackfn: (prop: Property) => Property): this {
    this.builder.map(callbackfn);
    return this;
  }
  update(name: string, update: Partial<Property>): this {
    this.builder.update(name, update);
    return this;
  }
  updateEvery(callbackfn: (prop: Property) => Partial<Property>): this {
    this.builder.updateEvery(callbackfn);
    return this;
  }
  updateAll(update: Partial<Property>): this {
    this.builder.updateAll(update);
    return this;
  }
  rename(from: string, to: string): this {
    this.builder.rename(from, to);
    return this;
  }
  allOptional(): this {
    this.builder.allOptional();
    return this;
  }
  filter(predicate: (prop: Property) => boolean): this {
    this.builder.filter(predicate);
    return this;
  }
  only(...keep: string[]): this {
    this.builder.only(...keep);
    return this;
  }
  omit(...remove: string[]): this {
    this.builder.omit(...remove);
    return this;
  }
  withoutDeprecated(): this {
    this.builder.withoutDeprecated();
    return this;
  }
  public get properties(): Property[] {
    return this.builder.properties;
  }
  public get fqn(): string {
    return this.builder.fqn;
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
