import { ICodeAgent, IUdf } from '../types';
import { Static, TSchema } from '@sinclair/typebox';
import { schemaToTypeString } from '../utils';

export abstract class BaseUdf implements IUdf {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: TSchema;
  abstract outputSchema: TSchema;

  getSignature(): string {
    return `// ${this.description}\nasync function ${
      this.name
    }(params: ${schemaToTypeString(this.inputSchema)}): Promise\<${
      this.outputSchema ? schemaToTypeString(this.outputSchema) : 'any'
    }\>`;
  }

  abstract call(
    input: Static<this['inputSchema']>,
    agent: ICodeAgent,
  ): Promise<Static<this['outputSchema']>> | Static<this['outputSchema']>;

  async onBeforeCall(
    input: Static<this['inputSchema']>,
    agent: ICodeAgent,
  ): Promise<void> {}

  async onAfterCall(
    input: Static<this['inputSchema']>,
    output: Static<this['outputSchema']>,
    agent: ICodeAgent,
  ): Promise<void> {}
}
