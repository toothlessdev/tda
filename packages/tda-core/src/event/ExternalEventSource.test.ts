import { beforeEach, describe, expect, test } from "vitest";
import { ExternalEventSource } from "./ExternalEventSource";
import { Event } from "../model/Event.ts";
import type { EventTranslator } from "./EventTranslator.ts";

class TestEventSource extends ExternalEventSource {
    readonly sourceName = "test";

    override normalize(rawData: unknown) {
        return super.normalize(rawData);
    }
}

class PrimaryAcceptingEventTranslator implements EventTranslator {
    translatorName = "accepting-00";

    async translate(_rawData: unknown): Promise<Event | null> {
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

class SecondaryAcceptingEventTranslator implements EventTranslator {
    translatorName = "accepting-01";

    async translate(_rawData: unknown): Promise<Event | null> {
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

class RejectingEventTranslator implements EventTranslator {
    translatorName = "rejecting";

    async translate(_rawData: unknown): Promise<Event | null> {
        return null;
    }
}

describe("normalize", () => {
    beforeEach(() => {});

    test("Incoming Event 를 translate 로 번역하는 최초 translator 에 대해 { translator, event } 를 반환한다", async () => {
        const testEventSource = new TestEventSource();

        testEventSource
            .addTranslator(new PrimaryAcceptingEventTranslator())
            .addTranslator(new SecondaryAcceptingEventTranslator())
            .addTranslator(new RejectingEventTranslator());

        const result = await testEventSource.normalize({});

        expect(result?.event.id).toBe("event-00");
        expect(result?.event).toBeInstanceOf(Event);

        expect(result?.translator.translatorName).toBe("accepting-00");
        expect(result?.translator).toBeInstanceOf(
            PrimaryAcceptingEventTranslator,
        );

        // Incoming Event 를 translate 로 번역하는
        // '첫번째가 아닌 translator' 는 반환하지 않는다
        expect(result?.event).not.toBeInstanceOf(
            SecondaryAcceptingEventTranslator,
        );
    });

    test("Incoming Event 를 translate 로 번역하지 못하는 translator 만 있을 때 null 을 반환한다", async () => {
        const testEventSource = new TestEventSource();

        testEventSource
            .addTranslator(new RejectingEventTranslator())
            .addTranslator(new RejectingEventTranslator())
            .addTranslator(new RejectingEventTranslator());

        const result = await testEventSource.normalize({});

        expect(result).toBeNull();
    });
});
