## 性能効率性 (Performance Efficiency)

以下の観点でレビューしてください:
- **[必須]** N+1 問題: JPA は @EntityGraph / JOIN FETCH / @BatchSize、MyBatis は結合SQL設計
- **[必須]** 不要な FetchType.EAGER（@OneToMany のデフォルトは LAZY を意識）
- [推奨] 不要なトランザクション境界（読み取り専用に @Transactional(readOnly=true)）
- [推奨] 大量データのストリーミング（Stream / Iterable の妥当な使用）
- [推奨] 文字列結合: ループ内 += は StringBuilder へ