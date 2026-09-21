import { beforeEach, describe, expect, test } from "vitest";
import { ExternalEventSource } from "./ExternalEventSource";
import { Event } from "../model/Event.ts";
import type { ExternalEventSourceChannel } from "./ExternalEventSourceChannel.ts";

class TestEventSource extends ExternalEventSource {
    readonly sourceName = "test";

    override dispatchToChannels(rawData: unknown) {
        return super.dispatchToChannels(rawData);
    }
}

class PrimaryAcceptingEventSourceChannel implements ExternalEventSourceChannel {
    channelName = "accepting-00";

    async toEvent(_rawData: unknown): Promise<Event | null> {
        return new Event({
            id: "event-00",
            kind: "event-00",
            sourceName: "source-00",
            occurredAt: new Date(),
            topics: [],
            payload: {},
        });
    }
}

class SecondaryAcceptingEventSourceChannel implements ExternalEventSourceChannel {
    channelName = "accepting-01";

    async toEvent(_rawData: unknown): Promise<Event | null> {
        return new Event({
            id: "event-01",
            kind: "event-01",
            sourceName: "source-01",
            occurredAt: new Date(),
            topics: [],
            payload: {},
        });
    }
}

class RejectingEventSourceChannel implements ExternalEventSourceChannel {
    channelName = "rejecting";

    async toEvent(_rawData: unknown): Promise<Event | null> {
        return null;
    }
}

describe("dispatchToChannels", () => {
    beforeEach(() => {});

    test("Incoming Event 를 toEvent 로 변환하는 최초 채널에 대해 { channel, event } 를 반환한다", async () => {
        const testEventSource = new TestEventSource();

        testEventSource
            .addEventSourceChannel(new PrimaryAcceptingEventSourceChannel())
            .addEventSourceChannel(new SecondaryAcceptingEventSourceChannel())
            .addEventSourceChannel(new RejectingEventSourceChannel());

        const result = await testEventSource.dispatchToChannels({});

        expect(result?.event.id).toBe("event-00");
        expect(result?.event).toBeInstanceOf(Event);

        expect(result?.channel.channelName).toBe("accepting-00");
        expect(result?.channel).toBeInstanceOf(
            PrimaryAcceptingEventSourceChannel,
        );

        // Incoming Event 를 toEvent 로 변환하는
        // '첫번째가 아닌 채널' 은 반환하지 않는다
        expect(result?.event).not.toBeInstanceOf(
            SecondaryAcceptingEventSourceChannel,
        );
    });

    test("Incoming Event 를 toEvent 로 변환하지 못하는 채널만 있을 때 null 을 반환한다", async () => {
        const testEventSource = new TestEventSource();

        testEventSource
            .addEventSourceChannel(new RejectingEventSourceChannel())
            .addEventSourceChannel(new RejectingEventSourceChannel())
            .addEventSourceChannel(new RejectingEventSourceChannel());

        const result = await testEventSource.dispatchToChannels({});

        expect(result).toBeNull();
    });
});
