import {
  BingSearchUdf,
  DatasheetWriteUdf,
  DuckduckgoSearchUdf,
  IChatModel,
  TerminateUdf,
  ThinkUdf,
} from '@runparse/agent-script';
import { Static, TSchema } from '@sinclair/typebox';
import { IWebAgent } from '../../types';
import {
  PageClickUdf,
  PageExtractDataUdf,
  PageGoBackUdf,
  PageNavigateUrlUdf,
} from '../../udf/browser/index';
import { generateDefaultJsonSchemaInstance } from '../../utils/schema';
import { webDataAgentPrompt } from './webDataAgent.prompt';
import { IWebAgentProps, WebAgent } from './webAgent';

export const getWebDataAgentDefaultUdfs = ({
  useBingSearch = true,
  extractionModel,
  extractionObjectSchema,
}: {
  useBingSearch?: boolean;
  extractionModel?: IChatModel;
  extractionObjectSchema: TSchema;
}) => [
  new PageClickUdf(),
  new PageNavigateUrlUdf(),
  new PageGoBackUdf(),
  new DatasheetWriteUdf({}),
  useBingSearch ? new BingSearchUdf() : new DuckduckgoSearchUdf(),
  new TerminateUdf(),
  new ThinkUdf(),
  new PageExtractDataUdf({
    model: extractionModel,
    objectSchema: extractionObjectSchema,
  }),
];

export interface IWebDataAgentProps extends IWebAgentProps {
  dataObjectSchema: TSchema;
}

export class WebDataAgent extends WebAgent implements IWebAgent {
  constructor(props: IWebDataAgentProps) {
    super({
      ...props,
      prompts: props.prompts || webDataAgentPrompt,
      udfs:
        props.udfs ||
        getWebDataAgentDefaultUdfs({
          extractionModel: props.model,
          extractionObjectSchema: props.dataObjectSchema,
        }),
      description:
        props.description ||
        `You object is to collect data as JSON objects with the following structure:\n\n${JSON.stringify(
          generateDefaultJsonSchemaInstance(props.dataObjectSchema),
        )} using the 'datasheetWrite' UDF to save any relevant data after extracting data from a webpage or searching the web. Use the provided page UDFs to explore the webpage and extract data following user instructions. Navigate away from the page if you see a captcha.`,
    });

    if (!this.udfs.some((udf) => udf instanceof DatasheetWriteUdf)) {
      throw new Error('The DatasheetWrite UDF is required');
    }
    if (!this.udfs.some((udf) => udf instanceof PageExtractDataUdf)) {
      throw new Error('The PageExtractData UDF is required');
    }
  }

  getDatasheetEntries() {
    return this.udfs
      .find((udf) => udf instanceof DatasheetWriteUdf)!
      .getEntries();
  }

  override async call(
    task: string,
    kwargs: any,
  ): Promise<Static<this['outputSchema']>> {
    await super.call(task, kwargs);
    return this.getDatasheetEntries();
  }
}
