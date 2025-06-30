import type { InterfaceType, Property } from '@jsii/spec';
import { TypeKind } from '@jsii/spec';
import { findInterface } from '../private';

/**
 * Something that has jsii properties.
 */
export interface HasProperties {
  /**
   * The list of properties of the thing.
   */
  readonly properties?: Property[];
}

/**
 * Something that has a fully-qualified-name.
 */
export interface HasFullyQualifiedName {
  /**
   * The fully-qualified-name of the thing.
   */
  readonly fqn: string;
}

/**
 * Something that has a fully-qualified-name.
 */
export interface HasStructSpec {
  /**
   * Get the current spec of the builder.
   */
  readonly spec: InterfaceType;
}

export interface IStructBuilder {
  /**
   * Add properties.
   *
   * In the same call, the first defined properties take priority.
   * However later calls will overwrite existing properties.
   */
  add(...props: Property[]): IStructBuilder;

  /**
   * Mix the properties of these sources into the struct.
   *
   * In the same call, the first defined sources and properties take priority.
   * However later calls will overwrite existing properties.
   */
  mixin(...sources: HasProperties[]): IStructBuilder;

  /**
   * Replaces an existing property with a new spec.
   */
  replace(name: string, replacement: Property): IStructBuilder;

  /**
   * Calls a defined callback function on each property, and replaces the property with the returned property.
   *
   * @param callbackfn — A function that accepts a property spec as an argument. The map method calls the callbackfn function one time for each property.
   */
  map(callbackfn: (prop: Property) => Property): IStructBuilder;

  /**
   * Update an existing property.
   */
  update(name: string, update: Partial<Property>): IStructBuilder;

  /**
   * Calls a defined callback function on each property, and merges the property with the returned property partial.
   *
   * @param callbackfn — A function that accepts a property spec as an argument. The map method calls the callbackfn function one time for each property.
   */
  updateEvery(callbackfn: (prop: Property) => Partial<Property>): IStructBuilder;

  /**
   * Update all existing properties.
   */
  updateAll(update: Partial<Property>): IStructBuilder;

  /**
   * Rename a property.
   *
   * If another property with the new name exists, it will be overridden.
   */
  rename(from: string, to: string): IStructBuilder;

  /**
   * Mark all properties as optional.
   */
  allOptional(): IStructBuilder;

  /**
   * Keep only the properties that meet the condition specified in the callback function.
   */
  filter(predicate: (prop: Property) => boolean): IStructBuilder;

  /**
   * Only keep these properties.
   */
  only(...keep: string[]): IStructBuilder;

  /**
   * Omit these properties.
   */
  omit(...remove: string[]): IStructBuilder;

  /**
   * Remove all deprecated properties.
   */
  withoutDeprecated(): IStructBuilder;
}

/**
 * Build a jsii struct
 */
export class Struct implements IStructBuilder, HasProperties, HasFullyQualifiedName, HasStructSpec {
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
  public static empty(fqn = '<<empty>>.<<empty>>') {
    return new Struct({
      assembly: fqn.split('.').at(0) ?? '<<empty>>',
      fqn,
      name: fqn.split('.').at(-1) ?? '<<empty>>',
      kind: TypeKind.Interface,
    });
  }

  private _base: InterfaceType;
  private _properties: Map<string, Property>;

  private constructor(base: InterfaceType) {
    this._base = structuredClone(base);
    this._properties = new Map(
      base.properties?.map((p) => [p.name, structuredClone(p)]),
    );
  }

  public add(...props: Property[]): this {
    for (const prop of props.reverse()) {
      this._properties.set(prop.name, prop);
    }

    return this;
  }

  public mixin(...sources: HasProperties[]): this {
    for (const source of sources.reverse()) {
      this.add(...(source.properties || []));
    }

    return this;
  }

  public replace(name: string, replacement: Property): this {
    const current = this._properties.get(name);

    if (!current) {
      throw `Unable to replace property '${name}' in '${this._base.fqn}: Property does not exists, please use \`add\`.'`;
    }

    if (replacement.name !== name) {
      this.omit(name);
    }

    return this.add(replacement);
  }

  public map(callbackfn: (prop: Property) => Property): this {
    const keys = this._properties.keys();
    for (const propertyKey of keys) {
      const current = structuredClone(this._properties.get(propertyKey)!);
      this.replace(propertyKey, callbackfn(current));
    }

    return this;
  }

  public update(name: string, update: Partial<Property>): this {
    const old = this._properties.get(name);

    if (!old) {
      throw `Unable to update property '${name}' in '${this._base.fqn}: Property does not exists, please use \`add\`.'`;
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

    if (updatedProp.name !== name) {
      this.omit(name);
    }

    return this.add(updatedProp);
  }

  public updateEvery(callbackfn: (prop: Property) => Partial<Property>): this {
    const keys = this._properties.keys();
    for (const propertyKey of keys) {
      const current = structuredClone(this._properties.get(propertyKey)!);
      this.update(current.name, callbackfn(current) ?? {});
    }

    return this;
  }

  public updateAll(update: Partial<Property>): this {
    for (const propertyKey of this._properties.keys()) {
      this.update(propertyKey, update);
    }
    return this;
  }

  public rename(from: string, to: string): this {
    return this.update(from, { name: to });
  }

  public allOptional(): this {
    this.map((property) => {
      property.optional = true;
      return property;
    });

    return this;
  }

  public filter(predicate: (prop: Property) => boolean): this {
    for (const propertyKey of this._properties.keys()) {
      if (!predicate(this._properties.get(propertyKey)!)) {
        this._properties.delete(propertyKey);
      }
    }

    return this;
  }

  public only(...keep: string[]): this {
    return this.filter((prop) => keep.includes(prop.name));
  }

  public omit(...remove: string[]): this {
    for (const prop of remove) {
      this._properties.delete(prop);
    }

    return this;
  }

  public withoutDeprecated(): this {
    return this.filter((prop) => null == prop.docs?.deprecated);
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
  public get fqn(): string {
    return this._base.fqn;
  }
}
