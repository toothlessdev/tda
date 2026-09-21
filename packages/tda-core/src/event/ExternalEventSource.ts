import type { Event } from "../model/Event.ts";
import type { EventTranslator } from "./EventTranslator.ts";

export type StopWatching = () => Promise<void>;

/**
 * 이벤트를 발행하는 외부 소스
 * ex) Slack, Jira, Github, GoogleCalendar ...
 */
export abstract class ExternalEventSource {
    readonly sourceName: string;
    readonly translators: EventTranslator[] = [];

    addTranslator(translator: EventTranslator): this {
        this.translators.push(translator);
        return this;
    }

    push?(emitEvent: (event: Event) => void): Promise<StopWatching>;
    pull?(cursor: string | null): Promise<{ events: Event[]; cursor: string }>;

    protected get translatorNames(): string[] {
        return this.translators.map((translator) => translator.translatorName);
    }

    protected async normalize(
        rawData: unknown,
    ): Promise<{ translator: EventTranslator; event: Event } | null> {
        for (const translator of this.translators) {
            const event = await translator.translate(rawData);

            if (!event) continue;
            return { translator, event };
        }
        return null;
    }
}
