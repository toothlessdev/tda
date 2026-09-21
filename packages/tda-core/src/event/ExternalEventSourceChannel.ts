import type { Event } from "../model/Event.ts";

/**
 * ExternalEventSource 안에서 rawData => Event 로 변환
 * ex) Slack 메시지, Slack 저장, Jira 변경 이력 ...
 */
export interface ExternalEventSourceChannel {
    readonly channelName: string;

    toEvent(rawData: unknown): Promise<Event | null>;
}
