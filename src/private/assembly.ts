import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  Assembly,
  InterfaceType,
  loadAssemblyFromPath,
  Method,
  Property,
  TypeKind,
} from '@jsii/spec';
import structuredClone from '@ungap/structured-clone';

const DOT_JSII = '.jsii';

const assemblies: Record<string, Assembly> = {};

function assemblyPath(asm: string): string {
  return dirname(require.resolve(join(asm, DOT_JSII)));
}

function loadAssemblyByName(asm: string): Assembly {
  return loadAssemblyFromPath(assemblyPath(asm), false);
}

function loadLocalAssembly(asm: string): Assembly {
  const localAssemblyPath = join(process.cwd(), DOT_JSII);
  if (!existsSync(localAssemblyPath)) {
    throw `jsii assembly ${localAssemblyPath} does not exist`;
  }

  const assembly = loadAssemblyFromPath(localAssemblyPath, false);
  if (assembly.name !== asm) {
    throw `jsii assembly ${asm} not found in ${localAssemblyPath}, got: ${assembly.name}`;
  }

  return assembly;
}

function loadAssembly(asm: string): Assembly {
  if (!assemblies[asm]) {
    try {
      assemblies[asm] = loadAssemblyByName(asm);
    } catch (error) {
      try {
        assemblies[asm] = loadLocalAssembly(asm);
      } catch (errorLocal) {
        throw new AggregateError([error, errorLocal], `jsii assembly ${asm} not found.`);
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
