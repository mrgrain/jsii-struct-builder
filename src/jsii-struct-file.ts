import { InterfaceType } from '@jsii/spec';
import { Project, SourceCodeOptions, TextFile } from 'projen';
import {
  TypeScriptRenderer,
  TypeScriptRendererOptions,
} from './typescript-renderer';

/**
 * Options for `JsiiStructFile`.
 */
export interface JsiiStructFileOptions
  extends TypeScriptRendererOptions,
    SourceCodeOptions {}

/**
 * A Jsii Struct rendered as TypeScript interface
 */
export class JsiiStructFile extends TextFile {
  public constructor(
    project: Project,
    filePath: string,
    spec: InterfaceType,
    options: JsiiStructFileOptions = {}
  ) {
    super(project, filePath, options);

    const renderer = new TypeScriptRenderer(options);
    this.addLine(`// ${this.marker}`);
    this.addLine(renderer.renderStruct(spec));
  }
}
