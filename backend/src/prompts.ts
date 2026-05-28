import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// backend/ ディレクトリ基準でプロンプトを置く
const PROMPTS_DIR = join(import.meta.dirname, '..', 'prompts')

// 観点の型定義（リテラル型のユニオン）
export type Aspect =
  | 'readability'
  | 'consistency'
  | 'maintainability'
  | 'safety'
  | 'reusability'
  | 'performance'

export const ALL_ASPECTS: Aspect[] = [
  'readability',
  'consistency',
  'maintainability',
  'safety',
  'reusability',
  'performance',
]

// 観点配列を受け取って、systemプロンプトを動的に組み立てる
export async function buildSystemPrompt(aspects: Aspect[]): Promise<string> {
  const base = await readFile(join(PROMPTS_DIR, 'base', 'system.md'), 'utf-8')
  const aspectPrompts = await Promise.all(
    aspects.map((a) => readFile(join(PROMPTS_DIR, 'aspects', `${a}.md`), 'utf-8'))
  )
  const outputFormat = await readFile(join(PROMPTS_DIR, 'base', 'output_format.md'), 'utf-8')

  return [base, '\n---\n## 指定された観点\n', ...aspectPrompts, '\n---\n', outputFormat].join('\n')
}