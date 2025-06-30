import { dirname, join } from 'node:path';
import type {
  Assembly,
  InterfaceType,
  Method,
  Property,
} from '@jsii/spec';
import {
  loadAssemblyFromPath,
  TypeKind,
} from '@jsii/spec';

const DOT_JSII = '.jsii';

const assemblies: Record<string, Assembly> = {};

function assemblyPath(asm: string): string {
  return dirname(require.resolve(join(asm, DOT_JSII)));
}

function loadAssemblyByName(asm: string): Assembly {
  return loadAssemblyFromDirectory(asm, assemblyPath(asm));
}

function loadAssemblyFromDirectory(asm: string, dir: string): Assembly {
  const assembly = loadAssemblyFromPath(dir, false);
  if (assembly.name !== asm) {
    throw `jsii assembly ${asm} not found in ${join(dir, DOT_JSII)}, got: ${assembly.name}`;
  }

  return assembly;
}

function loadAssembly(asm: string): Assembly {
  if (!assemblies[asm]) {
    try {
      assemblies[asm] = loadAssemblyByName(asm);
    } catch (error) {
      try {
        assemblies[asm] = loadAssemblyFromDirectory(asm, process.cwd());
      } catch (errorLocal) {
        throw new AggregateError([error, errorLocal], `jsii assembly ${asm} not found`);
      }
    }
  }

  return assemblies[asm];
}

function loadInterface(fqn: string) {
  const asm = loadAssembly(fqn.split('.').at(0)!);

  const candidate = asm.types?.[fqn];

  if (!candidate) {
    throw `Type ${fqn} not found in jsii assembly ${asm}`;
  }

  if (candidate?.kind !== TypeKind.Interface) {
    throw `Expected ${fqn} to be an interface, but got: ${candidate?.kind}`;
  }

  return structuredClone(candidate);
}

export function findInterface(
  fqn: string,
  mergeInherited: boolean = true,
): InterfaceType {
  const spec = loadInterface(fqn);

  if (!mergeInherited || !spec.interfaces) {
    return spec;
  }

  const props = new Map<string, Property>();
  const methods = new Map<string, Method>();

  for (const parent of spec.interfaces) {
    const parentSpec = findInterface(parent, true);
    parentSpec.properties?.forEach((p) => {
      props.set(p.name, p);
    });
    parentSpec.methods?.forEach((m) => {
      methods.set(m.name, m);
    });
  }

  spec.properties?.forEach((p) => {
    props.set(p.name, p);
  });
  spec.methods?.forEach((m) => {
    methods.set(m.name, m);
  });

  return {
    ...spec,
    methods: Array.from(methods.values()),
    properties: Array.from(props.values()),
  };
}
