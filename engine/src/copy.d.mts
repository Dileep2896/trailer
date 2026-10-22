export const NOT_COPY: Set<string>;
export function sceneStrings(id: string, node: unknown, path: string, add: (where: string, text: string, quoted: boolean) => void, quoted?: boolean): void;
export function sceneScreenText(scene: unknown, config?: unknown): string[];
export function shownOnScreen(phrase: string, screen: string[]): boolean;
