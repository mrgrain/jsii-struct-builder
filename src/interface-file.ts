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
import { Project, SourceCode, SourceCodeOptions } from 'projen';

/**
 * Options for `InterfaceFile`.
 */
export interface InterfaceFileOptions extends SourceCodeOptions {
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
}

/**
 * A TypeScript interface
 */
export class InterfaceFile extends SourceCode {
  public constructor(
    project: Project,
    filePath: string,
    private readonly spec: InterfaceType,
    options: InterfaceFileOptions = {}
  ) {
    super(project, filePath, options);

    this.line(`// ${this.marker}`);
    this.renderImports(extractImports(spec, options.importLocations));
    this.line();
    this.renderDocBlock(docsToLines(spec.docs));
    this.open(`export interface ${spec.name} {`);
    spec.properties?.forEach((p) => this.renderProperty(p));
    this.close('}');
    this.line();
  }

  protected renderImports(modules: Map<string, Set<string>>) {
    Array.from(modules.keys())
      .sort((a, b) => {
        if (a[0] < b[0]) {
          return 1;
        }
        return a.localeCompare(b);
      })
      .forEach((mod) => {
        const imports = Array.from(modules.get(mod)?.values() || []);
        this.line(`import { ${imports.join(', ')} } from '${mod}';`);
      });
  }

  protected renderProperty(p: Property) {
    if (p.docs) {
      this.renderDocBlock(docsToLines(p.docs));
    }
    this.line(
      `readonly ${p.name}${p.optional ? '?' : ''}: ${typeRefToType(
        p.type,
        this.spec.fqn
      )};`
    );
  }

  protected renderDocBlock(lines: string[]) {
    if (!lines.length) {
      return;
    }

    this.line('/**');
    lines.forEach((line) => this.line(` * ${line}`));
    this.line(' */');
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
          containingFqn
        )}>`;
      case CollectionKind.Map:
        return `Record<string, ${typeRefToType(
          t.collection.elementtype,
          containingFqn
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
  importLocations: Record<string, string> = {}
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
  importLocations: Record<string, string>
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
