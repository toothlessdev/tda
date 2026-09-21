import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * vitest 의 esbuild 는 데코레이터 메타데이터(design:paramtypes)를 안 남겨서
 * 생성자 주입이 깨진다. swc 로 변환해야 tsc 빌드와 같은 결과가 된다.
 */
export default defineConfig({
    plugins: [
        swc.vite({
            jsc: {
                parser: { syntax: "typescript", decorators: true },
                transform: { legacyDecorator: true, decoratorMetadata: true },
            },
        }),
    ],
    test: {
        include: ["packages/*/src/**/*.test.ts"],
    },
});
