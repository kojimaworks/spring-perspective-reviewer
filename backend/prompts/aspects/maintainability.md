## 保守性 (Maintainability)

以下の観点でレビューしてください:

- **[必須]** DI方式: コンストラクタインジェクション（@Autowired フィールド注入は警告）
- **[必須]** @Transactional の伝播・rollbackFor 妥当性、private メソッドへの付与禁止
- **[必須]** ハードコード設定値（URL・閾値・マジックナンバー）
- [推奨] Lombok 濫用（@Data の安易な使用）
- [推奨] @ConfigurationProperties の活用（@Value 散らかしの是正）
- [推奨] メソッド・クラスの責務単一性 (SRP)
- [推奨] デッドコード・未使用 import
