## 安全性 (Safety)

以下の観点でレビューしてください:

- **[必須]** @Override の付与漏れ
- **[必須]** 例外握りつぶし（catch して何もしない / ログのみで再throwなし）
- **[必須]** 認可漏れ: @PreAuthorize / @Secured の必要箇所への付与
- **[必須]** SQL Injection: @Query のパラメタ化、JPQL/MyBatis での文字列結合禁止
- **[必須]** CSRF設定（disable しっぱなしの検出）
- **[必須]** シークレット・認証情報のハードコード
- **[必須]** パスワードのハッシュ化（PasswordEncoder 利用）
- **[必須]** Controller 入力バリデーション漏れ (@Valid 漏れ)
- [推奨] null 安全性: Optional の妥当な利用
- [推奨] equals / hashCode のペア整合性
