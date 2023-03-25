import { InterfaceType } from '@jsii/spec';
import { Project, SourceCodeOptions, TextFile } from 'projen';
import { TypeScriptRenderer, TypeScriptRendererOptions } from '../renderer';

/**
 * Options for `TypeScriptInterfaceFile`.
 */
export interface TypeScriptInterfaceFileOptions
  extends TypeScriptRendererOptions,
    SourceCodeOptions {}

/**
 * A TypeScript interface rendered from a jsii interface specification
 */
export class TypeScriptInterfaceFile extends TextFile {
  public constructor(
    project: Project,
    filePath: string,
    spec: InterfaceType,
    options: TypeScriptInterfaceFileOptions = {}
  ) {
    super(project, filePath, options);

    const renderer = new TypeScriptRenderer(options);
    this.addLine(`// ${this.marker}`);
    this.addLine(renderer.renderStruct(spec));
  }
}
