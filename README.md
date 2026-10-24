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
- ブラウザで `index.html` を開くための静的サーバー（VS Code の Live Server など）

## セットアップ

```sh
npm install
```

## ビルド

```sh
npm run build
```

`src/index.ts` がバンドルされ、`dist/main.js` に出力されます。`dist/main.js` もリポジトリで管理しています。

型チェックだけを行う場合は次のコマンドを使います。

```sh
npm run typecheck
```

## テスト

```sh
npm test
```

`src/collision.ts`（OBB の作成、ワールド座標への変換、球の配置、往復運動）のテストを、Node.js 標準のテストランナー（`node --test`）で実行します。テストは `test/` にあります。

PR と `main` への push のたびに、GitHub Actions で型チェック・テスト・ビルドを実行します（`.github/workflows/ci.yml`）。

## 実行

GLB ファイルを読み込むため、`index.html` をファイルとして直接開くのではなく、静的サーバー経由で開いてください。

VS Code の Live Server を使う場合は、`index.html` を開いて「Go Live」を押すと `http://127.0.0.1:5501/` で表示されます。

## ファイル構成

| パス | 内容 |
|---|---|
| `src/index.ts` | シーンの構築、アニメーション、衝突判定 |
| `src/collision.ts` | OBB や球の配置など、描画に依存しない計算 |
| `test/` | テスト |
| `dist/main.js` | ビルド結果 |
| `index.html` | `dist/main.js` を読み込むページ |
| `ennchuBaoundingBox.glb` | 表示する GLB モデル |
| `webpack.config.js` | webpack の設定（ts-loader を使用） |
| `tsconfig.json` | TypeScript の設定 |
| `tsconfig.test.json` | テストを含めて型チェックするときの設定 |

## 使用ライブラリ

- [three.js](https://threejs.org/) 0.156
  - `GLTFLoader`：GLB モデルの読み込み
  - `OrbitControls`：視点の操作
  - `OBB`：有向バウンディングボックスと衝突判定
