import type { Event } from "../model/Event.ts";

/**
 * ExternalEventSource 안에서 rawData => Event 로 번역. 담당이 아니면 null.
 * rawData 하나는 Event 최대 하나 — 여러 Event 가 될 덩어리는 Source 가 미리 쪼갠다.
 * ex) Slack 메시지, Slack 저장, Jira 변경 이력 ...
 */
export interface EventTranslator {
    readonly translatorName: string;

    translate(rawData: unknown): Promise<Event | null>;
}
