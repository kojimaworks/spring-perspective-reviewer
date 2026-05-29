## 一貫性 (Consistency)

以下の観点でレビューしてください:

- **[必須]** 層責務分離: Controllerに業務ロジックを書かない / Serviceが@Transactional境界 / Repositoryは永続化のみ
- **[必須]** DI方式の統一: コンストラクタインジェクションで統一（フィールド/setter混在禁止）
- [推奨] 例外ハンドリング統一: @ControllerAdvice で集約
- [推奨] DTO/Entity/Form の命名・階層の一貫性
