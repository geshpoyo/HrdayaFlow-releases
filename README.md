# HrdayaFlow

> **心 (Hrdaya) から智慧が流れ出す、曼荼羅的マインドマップアプリ** — Windows / macOS / Linux 対応の Flutter Desktop アプリ。

## このリポジトリ

このリポジトリは **HrdayaFlow の公式 Web サイトとバイナリ配布** のためのものです。アプリのソースコードは含まれていません (ソースは別の private リポジトリで管理しています)。

- 公式サイト: 本リポジトリの GitHub Pages
- ダウンロード: [Releases](../../releases) (準備中、2026 年 6 月末予定)
- マニュアル: [docs.hrdayaflow.app](https://docs.hrdayaflow.app) (近日公開)

## このアプリについて

HrdayaFlow は、中心から枝が放射状に広がり、智慧が流れ出す曼荼羅の構造を、現代のデスクトップに再構築した思考整理 / マインドマップツールです。

### 主な特徴

- **AI 連携**: PrudeLLM / Ollama 経由でテキストから自動的にマインドマップを生成
- **Claude / Cursor 統合**: 内蔵 MCP server により AI から直接マップを操作可能
- **リッチコンテンツ**: Markdown / Mermaid 図 / LaTeX 数式 / HTML / シンタックスハイライト
- **クロスプラットフォーム**: Windows / macOS / Linux (Flutter Desktop)

### 技術スタック

Flutter Desktop (UI) ↔ Rust core (グラフ演算 + FFI) ↔ Python AI service (FastAPI)

## ステータス

- 現在: v0.0.4 開発中
- 次期リリース: v0.1.0 (Windows MSI、2026 年 6 月末予定)

## ライセンス

- **アプリ本体**: プロプライエタリ (評価利用無料、商用は別途ライセンス)
- **同梱 libmpv / FFmpeg**: LGPL (同梱 NOTICE 参照)
- **このリポジトリの Web サイトコード**: MIT (`LICENSE` 参照)

## お問い合わせ

- バグ報告 / 機能要望: [Issues](../../issues)
- その他: (将来追加)

---

*Made with 🌸 by geshtalt*
