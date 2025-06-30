import type { InterfaceType } from '@jsii/spec';
import type { Project, SourceCodeOptions } from 'projen';
import { TextFile } from 'projen';
import type { TypeScriptRendererOptions } from '../renderer';
import { TypeScriptRenderer } from '../renderer';

/**
 * Options for `TypeScriptInterfaceFile`.
 */
export interface TypeScriptInterfaceFileOptions extends TypeScriptRendererOptions, SourceCodeOptions {}

/**
 * A TypeScript interface rendered from a jsii interface specification
 */
export class TypeScriptInterfaceFile extends TextFile {
  public constructor(
    project: Project,
    filePath: string,
    spec: InterfaceType,
    options: TypeScriptInterfaceFileOptions = {},
  ) {
    super(project, filePath, options);

    const renderer = new TypeScriptRenderer(options);
    this.addLine(`// ${this.marker}`);
    this.addLine(renderer.renderStructSpec(spec));
  }
}
