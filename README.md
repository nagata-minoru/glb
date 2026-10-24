# glb

three.js で GLB モデルを読み込み、そのモデルを囲む OBB（Oriented Bounding Box）と球の衝突判定を試す実験用プロジェクトです。

## 何が表示されるか

- **GLB モデル**（`ennchuBaoundingBox.glb`）：マゼンタのワイヤーフレームで描画し、少しずつ回転させています。
- **OBB**：モデルから作ったバウンディングボックスです。黄色のワイヤーフレームで表示し、モデルと一緒に回転します。
- **移動する球**：x 軸方向に往復します。中心点が OBB の中に入ると赤、外にあるときは緑になります（`OBB.containsPoint`）。
- **格子状の球**：10×10×10 個を静止させて並べています。球全体が OBB と交差すると赤、交差していなければ青になります（`OBB.intersectsSphere`）。どれも移動する球と同じ半径 1 です。
- **赤い箱**：モデルグループのワールド行列を適用した確認用の箱です。

マウスで視点を操作できます（`OrbitControls`）。

## 必要な環境

- Node.js 26.12.1（`.nvmrc` と `.tool-versions` で指定しています）

## セットアップ

```sh
npm install
```

## 開発サーバー

```sh
npm run dev
```

Vite の開発サーバーが起動します（`http://localhost:5173/`）。ソースを保存すると、ブラウザに自動で反映されます。

## ビルド

```sh
npm run build
```

`dist/` にビルド結果が出力されます。ビルド結果を手元で確認するときは `npm run preview` を使います。

型チェックだけを行う場合は次のコマンドを使います。

```sh
npm run typecheck
```

## テスト

```sh
npm test
```

`src/collision.ts`（OBB の作成、ワールド座標への変換、球の配置、往復運動）のテストを Vitest で実行します。テストは `test/` にあります。

## CI と公開

- **CI**（`.github/workflows/ci.yml`）：PR と `main` への push のたびに、型チェック・テスト・ビルドを実行します。
- **公開**（`.github/workflows/deploy.yml`）：`main` に push されると、ビルドした `dist/` を GitHub Pages（https://nagata-minoru.github.io/glb/）に公開します。

## ファイル構成

| パス | 内容 |
|---|---|
| `index.html` | ページ本体。`src/index.ts` を読み込む |
| `src/index.ts` | シーンの構築、アニメーション、衝突判定 |
| `src/collision.ts` | OBB や球の配置など、描画に依存しない計算 |
| `test/` | テスト |
| `public/` | そのまま配信するファイル（GLB モデル） |
| `vite.config.ts` | Vite と Vitest の設定 |
| `tsconfig.json` | TypeScript の設定 |

## 使用ライブラリ

- [three.js](https://threejs.org/) 0.186
  - `GLTFLoader`：GLB モデルの読み込み
  - `OrbitControls`：視点の操作
  - `OBB`：有向バウンディングボックスと衝突判定
- [Vite](https://vite.dev/)：開発サーバーとビルド
- [Vitest](https://vitest.dev/)：テスト
