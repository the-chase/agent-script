import {
  BingSearchUdf,
  DuckduckgoSearchUdf,
  FinalAnswerUdf,
  ThinkUdf,
} from '@runparse/agent-script';
import { IWebAgent } from '../../types';
import {
  PageClickUdf,
  PageGoBackUdf,
  PageNavigateUrlUdf,
} from '../../udf/browser/index';
import { deepResearchAgentPrompt } from './deepResearchAgent.prompt';
import { PageReadUdf } from '../../udf/browser/pageReadUdf';
import { IWebAgentProps, WebAgent } from './webAgent';
export const getDeepResearchAgentDefaultUdfs = (
  options: { useBingSearch?: boolean } = { useBingSearch: true },
) => [
  options.useBingSearch ? new BingSearchUdf() : new DuckduckgoSearchUdf(),
  new PageClickUdf(),
  new PageNavigateUrlUdf(),
  new PageGoBackUdf(),
  new PageReadUdf({}),
  new FinalAnswerUdf(),
  new ThinkUdf(),
];

export class DeepResearchAgent extends WebAgent implements IWebAgent {
  constructor(props: IWebAgentProps) {
    super({
      ...props,
      prompts: props.prompts || deepResearchAgentPrompt,
      udfs: props.udfs || getDeepResearchAgentDefaultUdfs(),
      description:
        props.description ||
        `You object is to generate a report for a research task. Use the provided UDFs to explore the internet and read information from web pages. Navigate away from the page if you see a captcha.`,
    });
  }
}
