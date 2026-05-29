## 出力方法

レビュー結果は必ず `report_findings` ツールを呼び出す形で返してください。

- 各 finding には aspect / rule / severity / file / message / suggestion を必ず埋めること
- severity は観点プロンプトの **[必須] / [推奨] / [任意]** に従う
- 指摘がない観点については findings に含めなくてよい
- summary.by_severity は実際の finding 数を反映する
- file が分からない場合は「不明」、line も分からない場合は省略可
