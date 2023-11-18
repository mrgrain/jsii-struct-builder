import {
  CollectionKind,
  Docs,
  InterfaceType,
  isCollectionTypeReference,
  isNamedTypeReference,
  isPrimitiveTypeReference,
  isUnionTypeReference,
  Property,
  TypeReference,
} from '@jsii/spec';
import { HasStructSpec } from '../builder';
import { compareLowerCase, comparePath } from '../private';

/**
 * Options for `TypeScriptRenderer`.
 */
export interface TypeScriptRendererOptions {
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
   * Indentation size
   *
   * @default 2
   */
  readonly indent?: number;

  /**
   * Use explicit `type` imports when importing referenced modules.
   *
   * @see https://www.typescriptlang.org/docs/handbook/modules.html#importing-types
   * @default true
   */
  readonly useTypeImports?: boolean;
}

/**
 * Jsii to TypeScript renderer
 */
export class TypeScriptRenderer {
  private buffer: CodeBuffer;
  private options: Required<TypeScriptRendererOptions>;

  public constructor(options: TypeScriptRendererOptions = {}) {
    this.options = {
      importLocations: options.importLocations ?? {},
      indent: options.indent ?? 2,
      useTypeImports: options.useTypeImports ?? true,
    };
    this.buffer = new CodeBuffer(' '.repeat(this.options.indent));
  }

  /**
   * Render something that has a struct spec
   */
  public renderStruct(struct: HasStructSpec): string {
    return this.renderStructSpec(struct.spec);
  }

  /**
   * Render a jsii InterfaceType spec
   */
  public renderStructSpec(spec: InterfaceType): string {
    this.buffer.flush();

    this.renderImports(extractImports(spec, this.options.importLocations));
    this.buffer.line();
    this.renderDocBlock(docsToLines(spec.docs));
    this.buffer.open(`export interface ${spec.name} {`);
    spec.properties?.forEach((p) => this.renderProperty(p, spec.fqn));
    this.buffer.close('}');
    this.buffer.line();

    return this.buffer.flush().join('\n');
  }

  protected renderImports(modules: Map<string, Set<string>>) {
    Array.from(modules.keys())
      .sort(comparePath)
      .forEach((mod) => {
        const imports = Array.from(modules.get(mod)?.values() || []);
        const importStmt = this.options.useTypeImports
          ? 'import type'
          : 'import';
        this.buffer.line(
          `${importStmt} { ${imports
            .sort(compareLowerCase)
            .join(', ')} } from '${mod}';`,
        );
      });
  }

  protected renderProperty(p: Property, containingFqn: string) {
    const docs = structuredClone(p.docs);
    if (docs) {
      this.renderDocBlock(docsToLines(docs));
    }

    this.buffer.line(
      `readonly ${p.name}${p.optional ? '?' : ''}: ${typeRefToType(
        p.type,
        containingFqn,
      )};`,
    );
  }

  protected renderDocBlock(lines: string[]) {
    if (!lines.length) {
      return;
    }

    this.buffer.line('/**');
    lines.forEach((line) => this.buffer.line(` * ${line}`));
    this.buffer.line(' */');
  }
}

class CodeBuffer {
  private lines = new Array<string>();
  private indentLevel = 0;

  public constructor(private readonly indent = ' ') {}

  public flush(): string[] {
    const current = this.lines;
    this.reset();

    return current;
  }

  public line(code?: string) {
    const prefix = this.indent.repeat(this.indentLevel);
    this.lines.push((prefix + (code ?? '')).trimEnd());
  }

  public open(code?: string) {
    if (code) {
      this.line(code);
    }

    this.indentLevel++;
  }

  public close(code?: string) {
    if (this.indentLevel === 0) {
      throw new Error('Cannot decrease indent level below zero');
    }
    this.indentLevel--;

    if (code) {
      this.line(code);
    }
  }

  private reset(): void {
    this.lines = new Array<string>();
    this.indentLevel = 0;
  }
}

function docsToLines(docs?: Docs): string[] {
  if (!docs) {
    return [];
  }

  const lines = new Array<string>();

  if (docs.summary) {
    lines.push(docs.summary);
  }
  if (docs.remarks) {
    lines.push(...docs.remarks.split('\n'));
  }
  if (docs.default) {
    lines.push(`@default ${docs.default}`);
  }
  if (docs.deprecated) {
    lines.push(`@deprecated ${docs.deprecated}`);
  }
  if (docs.stability) {
    lines.push(`@stability ${docs.stability}`);
  }
  if (docs.custom) {
    Object.entries(docs.custom).forEach((entry) => {
      const [tag, value] = entry;
      lines.push(`@${tag} ${value}`);
    });
  }

  return lines;
}

function typeRefToType(t: TypeReference, containingFqn: string): string {
  if (isPrimitiveTypeReference(t)) {
    return t.primitive;
  }

  if (isNamedTypeReference(t)) {
    return t.fqn.split('.').slice(1).join('.');
  }

  if (isCollectionTypeReference(t)) {
    switch (t.collection.kind) {
      case CollectionKind.Array:
        return `Array<${typeRefToType(
          t.collection.elementtype,
          containingFqn,
        )}>`;
      case CollectionKind.Map:
        return `Record<string, ${typeRefToType(
          t.collection.elementtype,
          containingFqn,
        )}>`;
      default:
        return 'any';
    }
  }
  if (isUnionTypeReference(t)) {
    return t.union.types
      .map((ut) => typeRefToType(ut, containingFqn))
      .join(' | ');
  }

  return 'any';
}

function extractImports(
  spec: InterfaceType,
  importLocations: Record<string, string>,
): Map<string, Set<string>> {
  const refs = spec.properties?.flatMap((p) => collectFQNs(p.type)) || [];
  return refs.reduce((mods, ref) => {
    const packageName = fqnToImportName(ref, spec.fqn, importLocations);
    const imports = mods.get(packageName) || new Set();
    const importName = ref.split('.').slice(1)[0] || ref;
    return mods.set(packageName, imports.add(importName));
  }, new Map<string, Set<string>>());
}

function fqnToImportName(
  fqn: string,
  importingFqn: string,
  importLocations: Record<string, string>,
): string {
  const localAssembly = importingFqn.split('.', 1)[0];
  const importAssembly = fqn.split('.', 1)[0];

  // we have a custom import path
  if (importLocations[importAssembly]) {
    return importLocations[importAssembly];
  }

  // this is the same assembly, try to guess the path to the root
  if (importAssembly === localAssembly) {
    const fqnParts = importingFqn.split('.').length;
    if (fqnParts <= 2) {
      return './';
    }
    return '../'.repeat(fqnParts - 2);
  }

  // regular third party module
  return importAssembly;
}

function collectFQNs(t: TypeReference): string[] {
  if (isNamedTypeReference(t)) {
    return [t.fqn];
  }

  if (isUnionTypeReference(t)) {
    return t.union.types.flatMap(collectFQNs);
  }

  if (isCollectionTypeReference(t)) {
    return collectFQNs(t.collection.elementtype);
  }

  return [];
}
