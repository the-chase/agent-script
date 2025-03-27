import {
  CodeAgent,
  ICodeAgentProps,
  IChatMessage,
  ActionStep,
  DuckduckgoSearchUdf,
  BingSearchUdf,
  FinalAnswerUdf,
  ThinkUdf,
  PartialBy,
} from '@runparse/agent-script';
import { Page } from 'playwright';
import { IWebAgentNavigationHistoryItem } from '../../types';
import { Static } from '@sinclair/typebox';
import { PageReadUdf } from '../../udf/browser/pageReadUdf';
import { PageClickUdf, PageGoBackUdf, PageNavigateUrlUdf } from '../../udf';

export function getWebAgentDefaultUdfs(
  options: { useBingSearch?: boolean } = { useBingSearch: true },
) {
  return [
    options?.useBingSearch ? new BingSearchUdf() : new DuckduckgoSearchUdf(),
    new PageClickUdf(),
    new PageReadUdf({}),
    new PageNavigateUrlUdf(),
    new PageGoBackUdf(),
    new FinalAnswerUdf(),
    new ThinkUdf(),
  ];
}

export interface IWebAgentProps
  extends PartialBy<ICodeAgentProps, 'description' | 'udfs'> {
  page: Page;
  navigationHistory?: IWebAgentNavigationHistoryItem[];
}

export class WebAgent extends CodeAgent {
  page: Page;
  navigationHistory: IWebAgentNavigationHistoryItem[];

  constructor(props: IWebAgentProps) {
    super({
      ...props,
      description: props.description || '',
      udfs: props.udfs || getWebAgentDefaultUdfs(),
    });

    if (
      !this.udfs.some(
        (udf) =>
          udf instanceof BingSearchUdf || udf instanceof DuckduckgoSearchUdf,
      )
    ) {
      throw new Error('A web search UDF is required');
    }

    this.page = props.page;
    this.navigationHistory = props.navigationHistory || [];
  }

  override writeMemoryToMessages(summaryMode: boolean): IChatMessage[] {
    const messages = super.writeMemoryToMessages(summaryMode);
    if (this.navigationHistory.length > 0) {
      const currentLocationString = `You are currently at this url: ${this.page.url()}\n\n`;
      messages.push({
        role: 'user',
        content: `${currentLocationString}Do not navigate to any of the following urls you have visited:\n${this.navigationHistory
          .map((item) => `- ${item.url}`)
          .join('\n')}`,
      });
    }
    return messages;
  }

  override async step(
    memoryStep: ActionStep,
  ): Promise<Static<this['outputSchema']> | undefined> {
    // Get current memory step
    const currentStep = this.memory.steps[this.memory.steps.length - 1];
    if (currentStep instanceof ActionStep) {
      // Remove old screenshots to keep memory lean
      for (const step of this.memory.steps) {
        if (!(step instanceof ActionStep)) continue;
        if (step.stepNumber <= currentStep.stepNumber - 2) {
          step.observations = step.observations?.filter(
            (o) => !(o.type === 'image' && o.context?.includes('screenshot')),
          );
        }
      }
    }

    return super.step(memoryStep);
  }
}
