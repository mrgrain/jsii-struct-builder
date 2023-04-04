import { FQN, InterfaceType, Property, TypeKind } from '@jsii/spec';
import structuredClone from '@ungap/structured-clone';
import { findInterface } from '../private';

/**
 * Something that has jsii properties
 */
export interface HasProperties {
  properties?: Property[];
}

/**
 * Something that has FQN
 */
export interface NamedTypeReference {
  /**
   * The fully-qualified-name of the type (can be located in the
   */
  fqn: FQN;
}

export interface IStructBuilder {
  /**
   * Only keep these properties
   */
  only(...keep: string[]): IStructBuilder;

  /**
   * Omit these properties
   */
  omit(...remove: string[]): IStructBuilder;

  /**
   * Add properties
   *
   * In the same call, the first defined properties take priority.
   * However later calls will overwrite existing properties.
   */
  add(...props: Property[]): IStructBuilder;

  /**
   * Update all existing properties
   */
  updateAll(update: Partial<Property>): IStructBuilder;

  /**
   * Update an existing property
   */
  update(name: string, update: Partial<Property>): IStructBuilder;

  /**
   * Mix the properties of these sources in
   *
   * In the same call, the first defined sources and properties take priority.
   * However later calls will overwrite existing properties.
   */
  mixin(...sources: HasProperties[]): IStructBuilder;
}

/**
 * Build a jsii struct
 */
export class Struct
  implements IStructBuilder, HasProperties, NamedTypeReference
{
  /**
   * Create a builder from an jsii spec
   */
  public static fromSpec(spec: InterfaceType) {
    return new Struct(spec);
  }

  /**
   * Create a builder from a jsii FQN
   *
   * @param fqn The jsii fqn of the source spec.
   * @param mergeParents Merge parent interfaces into the spec. Defaults to `true`.
   */
  public static fromFqn(fqn: string, mergeParents: boolean = true) {
    const source = findInterface(fqn, mergeParents);
    return new Struct(source);
  }

  /**
   * Create an empty builder
   *
   * Note that the behavior of `builder.spec` is undefined when using this method.
   */
  public static empty() {
    return new Struct({
      assembly: '<<empty>>',
      fqn: '<<empty>>.<<empty>>',
      name: '<<empty>>',
      kind: TypeKind.Interface,
    });
  }

  private _base: InterfaceType;
  private _properties: Map<string, Property>;

  private constructor(base: InterfaceType) {
    this._base = structuredClone(base);
    this._properties = new Map(
      base.properties?.map((p) => [p.name, structuredClone(p)])
    );
  }

  /**
   * Only keep these properties
   */
  public only(...keep: string[]) {
    const current = this._properties.keys();
    for (const key of current) {
      if (!keep.includes(key)) {
        this._properties.delete(key);
      }
    }

    return this;
  }

  /**
   * Omit these properties
   */
  public omit(...remove: string[]) {
    for (const prop of remove) {
      this._properties.delete(prop);
    }

    return this;
  }

  /**
   * Add properties
   *
   * In the same call, the first defined properties take priority.
   * However later calls will overwrite existing properties.
   */
  public add(...props: Property[]) {
    for (const prop of props.reverse()) {
      this._properties.set(prop.name, prop);
    }

    return this;
  }

  /**
   * Update an existing property
   *
   * This can be used to rename a property.
   * Simply set the the new name in the `update` struct.
   */
  public update(name: string, update: Partial<Property>) {
    const old = this._properties.get(name);

    if (!old) {
      throw `Unable top update property '${name}' in '${this._base.fqn}: Property does not exists, please use \`add\`.'`;
    }

    const updatedProp = {
      ...old,
      ...update,
      docs: {
        ...old?.docs,
        ...update?.docs,
        custom: {
          ...old?.docs?.custom,
          ...update?.docs?.custom,
        },
      },
    };

    return this.add(updatedProp);
  }

  /**
   * Update all existing properties
   */
  public updateAll(update: Partial<Property>) {
    for (const propertyKey of this._properties.keys()) {
      this.update(propertyKey, update);
    }
    return this;
  }

  /**
   * Mix the properties of these sources in
   *
   * In the same call, the first defined sources and properties take priority.
   * However later calls will overwrite existing properties.
   */
  public mixin(...sources: HasProperties[]) {
    for (const source of sources.reverse()) {
      this.add(...(source.properties || []));
    }

    return this;
  }

  /**
   * Get the current state of the builder
   */
  public get spec(): InterfaceType {
    const properties = Array.from(this._properties.values());

    return {
      ...structuredClone(this._base),
      properties,
    };
  }

  /**
   * Get the current properties of the builder
   */
  public get properties(): Property[] {
    return this.spec.properties ?? [];
  }

  /**
   * Get the FQN for the builder
   */
  public get fqn(): FQN {
    return this._base.fqn;
  }
}
