import {
  ActionStep,
  BingSearchUdf,
  DuckduckgoSearchUdf,
  FinalAnswerUdf,
  PlanningStep,
  TerminateUdf,
  ThinkUdf,
} from '@runparse/agent-script';
import { Page } from 'playwright';
import { IWebAgentNavigationHistoryItem } from '../../../types';
import {
  PageClickUdf,
  PageReadUdf,
  PageGoBackUdf,
  PageNavigateUrlUdf,
} from '../../../udf/browser/index';
import { WebAgent, getWebAgentDefaultUdfs } from '../webAgent';

describe('getWebAgentDefaultUdfs', () => {
  beforeAll(() => {
    process.env.BING_API_KEY = 'test-bing-api-key';
  });

  afterAll(() => {
    delete process.env.BING_API_KEY;
  });

  test('should include BingSearchUdf by default', () => {
    const udfs = getWebAgentDefaultUdfs();

    expect(udfs.some((udf) => udf instanceof BingSearchUdf)).toBe(true);
    expect(udfs.some((udf) => udf instanceof DuckduckgoSearchUdf)).toBe(false);
  });

  test('should include DuckduckgoSearchUdf when useBingSearch is false', () => {
    const udfs = getWebAgentDefaultUdfs({
      useBingSearch: false,
    });

    expect(udfs.some((udf) => udf instanceof BingSearchUdf)).toBe(false);
    expect(udfs.some((udf) => udf instanceof DuckduckgoSearchUdf)).toBe(true);
  });

  test('should include all required UDFs', () => {
    const udfs = getWebAgentDefaultUdfs({
      useBingSearch: false,
    });

    expect(udfs.some((udf) => udf instanceof PageClickUdf)).toBe(true);
    expect(udfs.some((udf) => udf instanceof PageReadUdf)).toBe(true);
    expect(udfs.some((udf) => udf instanceof PageNavigateUrlUdf)).toBe(true);
    expect(udfs.some((udf) => udf instanceof PageGoBackUdf)).toBe(true);
    expect(udfs.some((udf) => udf instanceof ThinkUdf)).toBe(true);
  });
});

describe('WebAgent', () => {
  beforeAll(() => {
    process.env.BING_API_KEY = 'test-bing-api-key';
  });

  afterAll(() => {
    delete process.env.BING_API_KEY;
  });

  describe('constructor', () => {
    let mockPage: Page;

    beforeEach(() => {
      mockPage = {
        url: jest.fn().mockReturnValue('https://example.com'),
      } as unknown as Page;
    });

    test('should initialize with provided props', () => {
      const agent = new WebAgent({
        page: mockPage,
        name: 'test-agent',
        maxSteps: 10,
      });

      expect(agent.page).toBe(mockPage);
      expect(agent.navigationHistory).toEqual([]);
      expect(agent.udfs.length).toBeGreaterThan(0);
    });

    test('should throw an error when no search UDF is provided', () => {
      const mockUdfs = [
        new PageClickUdf(),
        new PageReadUdf({}),
        new TerminateUdf(),
      ];

      expect(() => {
        new WebAgent({
          page: mockPage,
          udfs: mockUdfs,
          name: 'test-agent',
          maxSteps: 10,
        });
      }).toThrow('A web search UDF is required');
    });

    test('should use default UDFs when none provided', () => {
      const agent = new WebAgent({
        page: mockPage,
        name: 'test-agent',
        maxSteps: 10,
      });

      expect(agent.udfs.some((udf) => udf instanceof PageReadUdf)).toBe(true);
      expect(agent.udfs.some((udf) => udf instanceof PageNavigateUrlUdf)).toBe(
        true,
      );
      expect(agent.udfs.some((udf) => udf instanceof PageGoBackUdf)).toBe(true);
      expect(agent.udfs.some((udf) => udf instanceof FinalAnswerUdf)).toBe(
        true,
      );
      expect(
        agent.udfs.some(
          (udf) =>
            udf instanceof BingSearchUdf || udf instanceof DuckduckgoSearchUdf,
        ),
      ).toBe(true);
    });

    test('should properly initialize navigationHistory with empty array when not provided', () => {
      const agent = new WebAgent({
        page: mockPage,
        name: 'test-agent',
        maxSteps: 10,
      });

      expect(agent.navigationHistory).toEqual([]);
    });

    test('should use provided navigationHistory when available', () => {
      const mockHistory: IWebAgentNavigationHistoryItem[] = [
        { url: 'https://example.com/page1', timestamp: 1, status: 'success' },
        { url: 'https://example.com/page2', timestamp: 2, status: 'success' },
      ];

      const agent = new WebAgent({
        page: mockPage,
        navigationHistory: mockHistory,
        name: 'test-agent',
        maxSteps: 10,
      });

      expect(agent.navigationHistory).toBe(mockHistory);
    });

    test('should use provided description when available', () => {
      const customDescription = 'Custom agent description';
      const agent = new WebAgent({
        page: mockPage,
        description: customDescription,
        name: 'test-agent',
        maxSteps: 10,
      });

      expect(agent['description']).toBe(customDescription);
    });
  });

  describe('writeMemoryToMessages', () => {
    let mockPage: Page;
    let agent: WebAgent;

    beforeEach(() => {
      mockPage = {
        url: jest.fn().mockReturnValue('https://example.com/current'),
      } as unknown as Page;

      // Mock the super class method
      jest
        .spyOn(WebAgent.prototype, 'writeMemoryToMessages')
        .mockImplementation(function (this: any, summaryMode: boolean) {
          // Don't call the actual implementation to avoid infinite recursion
          // Instead return a mock value
          return [{ role: 'system', content: 'Base message' }];
        });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should include base messages from super class', () => {
      agent = new WebAgent({
        page: mockPage,
        name: 'test-agent',
        maxSteps: 10,
      });

      // Save original implementation
      const originalImplementation = agent.writeMemoryToMessages;

      // Override to avoid infinite recursion from the mock above
      agent.writeMemoryToMessages = function (summaryMode: boolean) {
        // Restore original to avoid issues
        this.writeMemoryToMessages = originalImplementation;
        return originalImplementation.call(this, summaryMode);
      };

      const messages = agent.writeMemoryToMessages(false);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]?.role).toBe('system');
    });

    test('should add current URL info when navigationHistory is not empty', () => {
      const mockHistory: IWebAgentNavigationHistoryItem[] = [
        { url: 'https://example.com/page1', timestamp: 1, status: 'success' },
      ];

      agent = new WebAgent({
        page: mockPage,
        navigationHistory: mockHistory,
        name: 'test-agent',
        maxSteps: 10,
      });

      // Reset the mock
      jest.spyOn(WebAgent.prototype, 'writeMemoryToMessages').mockRestore();
      // Mock parent class method to return empty array
      jest
        .spyOn(
          Object.getPrototypeOf(WebAgent.prototype),
          'writeMemoryToMessages',
        )
        .mockReturnValue([{ role: 'system', content: 'Base message' }]);

      const messages = agent.writeMemoryToMessages(false);
      console.log(messages);

      expect(messages.length).toBe(2);
      expect(messages[1]?.content).toContain('https://example.com/current');
      expect(messages[1]?.content).toContain('https://example.com/page1');
    });

    test('should not add URL info when navigationHistory is empty', () => {
      agent = new WebAgent({
        page: mockPage,
        name: 'test-agent',
        maxSteps: 10,
      });

      // Reset the mock
      jest.spyOn(WebAgent.prototype, 'writeMemoryToMessages').mockRestore();
      // Mock parent class method to return empty array
      jest
        .spyOn(
          Object.getPrototypeOf(WebAgent.prototype),
          'writeMemoryToMessages',
        )
        .mockReturnValue([{ role: 'system', content: 'Base message' }]);

      const messages = agent.writeMemoryToMessages(false);

      expect(messages.length).toBe(1);
      expect(messages[0]?.content).toBe('Base message');
    });

    test('should format navigationHistory correctly in message', () => {
      const mockHistory: IWebAgentNavigationHistoryItem[] = [
        { url: 'https://example.com/page1', timestamp: 1, status: 'success' },
        { url: 'https://example.com/page2', timestamp: 2, status: 'success' },
      ];

      agent = new WebAgent({
        page: mockPage,
        navigationHistory: mockHistory,
        name: 'test-agent',
        maxSteps: 10,
      });

      // Reset the mock
      jest.spyOn(WebAgent.prototype, 'writeMemoryToMessages').mockRestore();
      // Mock parent class method to return empty array
      jest
        .spyOn(
          Object.getPrototypeOf(WebAgent.prototype),
          'writeMemoryToMessages',
        )
        .mockReturnValue([{ role: 'system', content: 'Base message' }]);

      const messages = agent.writeMemoryToMessages(false);

      expect(messages[1]?.content).toContain('- https://example.com/page1');
      expect(messages[1]?.content).toContain('- https://example.com/page2');
    });
  });

  describe('step', () => {
    let mockPage: Page;
    let agent: WebAgent;

    beforeEach(() => {
      mockPage = {
        url: jest.fn().mockReturnValue('https://example.com'),
      } as unknown as Page;

      agent = new WebAgent({
        page: mockPage,
        name: 'test-agent',
        maxSteps: 10,
      });

      // Setup memory steps
      agent.memory = {
        steps: [
          new ActionStep({
            stepNumber: 1,
            observations: [
              {
                type: 'image',
                context: 'screenshot',
                image: 'old-screenshot-1',
              },
              { type: 'text', text: 'observation 1' },
            ],
          }),
          new ActionStep({
            stepNumber: 2,
            observations: [
              {
                type: 'image',
                context: 'screenshot',
                image: 'old-screenshot-2',
              },
              { type: 'text', text: 'observation 2' },
            ],
          }),
          new ActionStep({
            stepNumber: 3,
            observations: [
              {
                type: 'image',
                context: 'screenshot',
                image: 'current-screenshot',
              },
              { type: 'text', text: 'observation 3' },
            ],
          }),
        ],
      } as any;
    });

    test('should clean up old screenshots from memory', async () => {
      const newStep = new ActionStep({
        stepNumber: 4,
      });

      // Mock the super.step call
      jest
        .spyOn(Object.getPrototypeOf(WebAgent.prototype), 'step')
        .mockResolvedValue(undefined);

      await agent.step(newStep);

      // Check that old screenshots are removed (step 1 should have screenshot removed)
      const step1 = agent.memory.steps[0] as ActionStep;
      expect(
        step1.observations?.some(
          (o) => o.type === 'image' && o.context?.includes('screenshot'),
        ),
      ).toBe(false);

      // Step 2 and 3 should still have screenshots
      const step2 = agent.memory.steps[1] as ActionStep;
      expect(
        step2.observations?.some(
          (o) => o.type === 'image' && o.context?.includes('screenshot'),
        ),
      ).toBe(true);

      const step3 = agent.memory.steps[2] as ActionStep;
      expect(
        step3.observations?.some(
          (o) => o.type === 'image' && o.context?.includes('screenshot'),
        ),
      ).toBe(true);
    });

    test('should not remove non-screenshot observations', async () => {
      const newStep = new ActionStep({
        stepNumber: 4,
      });

      // Mock the super.step call
      jest
        .spyOn(Object.getPrototypeOf(WebAgent.prototype), 'step')
        .mockResolvedValue(undefined);

      await agent.step(newStep);

      // Check that text observations are preserved
      const step1 = agent.memory.steps[0] as ActionStep;
      expect(step1.observations?.some((o) => o.type === 'text')).toBe(true);
    });

    test('should call super.step with the provided memoryStep', async () => {
      const newStep = new ActionStep({
        stepNumber: 4,
      });

      const superStepSpy = jest
        .spyOn(Object.getPrototypeOf(WebAgent.prototype), 'step')
        .mockResolvedValue(undefined);

      await agent.step(newStep);

      expect(superStepSpy).toHaveBeenCalledWith(newStep);
    });

    test('should all super.step if last step is not an ActionStep', async () => {
      // Set up a non-ActionStep as the last step
      agent.memory.steps[agent.memory.steps.length - 1] = new PlanningStep({
        modelInputMessages: [],
        modelOutputMessageFacts: { role: 'assistant', content: 'facts' },
        facts: 'facts',
        modelOutputMessagePlan: { role: 'assistant', content: 'plan' },
        plan: 'plan',
      });

      const newStep = new ActionStep({
        stepNumber: 4,
      });

      const superStepSpy = jest.spyOn(
        Object.getPrototypeOf(WebAgent.prototype),
        'step',
      );

      const result = await agent.step(newStep);

      expect(result).toBeUndefined();
      expect(superStepSpy).toHaveBeenCalled();
    });
  });
});
