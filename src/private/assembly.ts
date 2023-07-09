import path from 'path';
import {
  Assembly,
  InterfaceType,
  loadAssemblyFromPath,
  Method,
  Property,
  TypeKind,
} from '@jsii/spec';
import structuredClone from '@ungap/structured-clone';

const assemblies: Record<string, Assembly> = {};

function assemblyPath(asm: string): string {
  return path.dirname(require.resolve(`${asm}/.jsii`));
}

function loadAssembly(asm: string): Assembly {
  if (!assemblies[asm]) {
    assemblies[asm] = loadAssemblyFromPath(assemblyPath(asm), false);
  }

  return assemblies[asm];
}

function loadInterface(fqn: string) {
  const asm = loadAssembly(fqn.split('.').at(0)!);

  const candidate = asm.types?.[fqn];

  if (!candidate) {
    throw `Type ${fqn} not found`;
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
