import type { Event } from "../model/Event.ts";
import type { ExternalEventSourceChannel } from "./ExternalEventSourceChannel.ts";

export type StopWatching = () => Promise<void>;

/**
 * 이벤트를 발행하는 외부 소스
 * ex) Slack, Jira, Github, GoogleCalendar ...
 */
export abstract class ExternalEventSource {
    readonly sourceName: string;
    readonly channels: ExternalEventSourceChannel[] = [];

    addEventSourceChannel(channel: ExternalEventSourceChannel): this {
        this.channels.push(channel);
        return this;
    }

    push?(emitEvent: (event: Event) => void): Promise<StopWatching>;
    pull?(cursor: string | null): Promise<{ events: Event[]; cursor: string }>;

    protected get channelNames(): string[] {
        return this.channels.map((channel) => channel.channelName);
    }

    protected async dispatchToChannels(
        rawData: unknown,
    ): Promise<{ channel: ExternalEventSourceChannel; event: Event } | null> {
        for (const channel of this.channels) {
            const event = await channel.toEvent(rawData);

            if (!event) continue;
            return { channel, event };
        }
        return null;
    }
}
