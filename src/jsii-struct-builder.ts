import { InterfaceType, Property } from '@jsii/spec';

/**
 * Build a jsii struct
 */
export class JsiiStructBuilder {
  private targetSpec: InterfaceType;
  private properties: Map<string, Property>;

  public constructor(base: InterfaceType) {
    this.targetSpec = base;
    this.properties = new Map(base.properties?.map((p) => [p.name, p]));
  }

  /**
   * Omit this prop
   */
  public omit(prop: string): JsiiStructBuilder {
    this.properties.delete(prop);

    return this;
  }

  /**
   * Add a prop
   */
  public add(prop: Property): JsiiStructBuilder {
    this.properties.set(prop.name, prop);

    return this;
  }

  /**
   * Update an existing prop
   */
  public update(name: string, update: Partial<Property>): JsiiStructBuilder {
    const old = this.properties.get(name);

    if (!old) {
      throw `Unable top update property '${name}' in '${this.targetSpec.fqn}: Property does not exists, please use add'`;
    }

    const updated = {
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

    return this.add(updated);
  }

  /**
   * Get the current state of the builder
   */
  public get(): InterfaceType {
    this.targetSpec.properties = Array.from(this.properties.values());

    return this.targetSpec;
  }
}
