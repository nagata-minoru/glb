import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { OBB } from 'three/addons/math/OBB.js';
import { createOBBFromObject, gridPositions, stepPingPong, toWorldOBB } from '../src/collision';

// 原点を中心に、x 方向に長い 10x2x2 の箱
const createLongBox = () => new THREE.Mesh(new THREE.BoxGeometry(10, 2, 2));

describe('createOBBFromObject', () => {
  test('オブジェクトの位置と大きさに合った OBB を作る', () => {
    const mesh = createLongBox();
    mesh.position.set(50, 0, 0);
    mesh.scale.set(2, 2, 2);

    const { obb, box3 } = createOBBFromObject(mesh);

    assert.deepEqual(obb.center.toArray(), [50, 0, 0]);
    assert.deepEqual(obb.halfSize.toArray(), [10, 2, 2]);
    assert.deepEqual(box3.min.toArray(), [40, -2, -2]);
    assert.deepEqual(box3.max.toArray(), [60, 2, 2]);
  });

  test('子オブジェクトも含めて囲む', () => {
    const group = new THREE.Group();
    const child = createLongBox();
    child.position.set(0, 10, 0);
    group.add(createLongBox(), child);

    const { obb } = createOBBFromObject(group);

    assert.deepEqual(obb.center.toArray(), [0, 5, 0]);
    assert.deepEqual(obb.halfSize.toArray(), [5, 6, 1]);
  });
});

describe('toWorldOBB', () => {
  const { obb: local } = createOBBFromObject(createLongBox());
  // z 軸まわりに 90 度回転させ、長い辺を y 方向に向ける
  const rotateZ90 = new THREE.Matrix4().makeRotationZ(Math.PI / 2);

  test('回転を反映し、回転後の向きで点の内外を判定する', () => {
    const world = toWorldOBB(new OBB(), local, rotateZ90);

    assert.ok(world.containsPoint(new THREE.Vector3(0, 4, 0)));
    assert.ok(!world.containsPoint(new THREE.Vector3(4, 0, 0)));
  });

  test('平行移動を反映する', () => {
    const world = toWorldOBB(new OBB(), local, new THREE.Matrix4().makeTranslation(50, 0, 0));

    assert.ok(world.containsPoint(new THREE.Vector3(54, 0, 0)));
    assert.ok(!world.containsPoint(new THREE.Vector3(0, 0, 0)));
  });

  test('結果を target に書き込んで返し、元の OBB は変えない', () => {
    const target = new OBB();

    const world = toWorldOBB(target, local, rotateZ90);

    assert.equal(world, target);
    assert.ok(local.containsPoint(new THREE.Vector3(4, 0, 0)));
    assert.ok(!local.containsPoint(new THREE.Vector3(0, 4, 0)));
  });

  test('回転後の OBB と球の交差を判定する', () => {
    const world = toWorldOBB(new OBB(), local, rotateZ90);

    // 回転後の OBB は y 方向に ±5 まで広がるので、半径 1 の球は中心が 6 未満なら交差する
    assert.ok(world.intersectsSphere(new THREE.Sphere(new THREE.Vector3(0, 5.9, 0), 1)));
    assert.ok(!world.intersectsSphere(new THREE.Sphere(new THREE.Vector3(0, 6.1, 0), 1)));
    // 回転前なら交差する位置でも、回転後は x 方向に ±1 しかないので交差しない
    assert.ok(!world.intersectsSphere(new THREE.Sphere(new THREE.Vector3(4, 0, 0), 1)));
  });
});

describe('gridPositions', () => {
  test('count の3乗個の座標を origin から spacing 間隔で作る', () => {
    const positions = gridPositions(10, 10, new THREE.Vector3(-5, 0, -5));

    assert.equal(positions.length, 1000);
    assert.deepEqual(positions[0].toArray(), [-5, 0, -5]);
    assert.deepEqual(positions[1].toArray(), [-5, 0, 5]);
    assert.deepEqual(positions[999].toArray(), [85, 90, 85]);
  });

  test('origin を書き換えない', () => {
    const origin = new THREE.Vector3(1, 2, 3);

    gridPositions(2, 1, origin);

    assert.deepEqual(origin.toArray(), [1, 2, 3]);
  });
});

describe('stepPingPong', () => {
  test('範囲内では speed だけ進み、向きは変えない', () => {
    assert.deepEqual(stepPingPong(0, 0.5, 150), { position: 0.5, speed: 0.5 });
  });

  test('範囲を超えたら次のステップから向きを反転する', () => {
    assert.deepEqual(stepPingPong(150, 0.5, 150), { position: 150.5, speed: -0.5 });
    assert.deepEqual(stepPingPong(-150, -0.5, 150), { position: -150.5, speed: 0.5 });
  });

  test('ちょうど境界に着いたときは反転しない', () => {
    assert.deepEqual(stepPingPong(149.5, 0.5, 150), { position: 150, speed: 0.5 });
  });

  test('何ステップ進めても範囲から speed 以上はみ出さない', () => {
    let state = { position: 0, speed: 0.5 };
    for (let i = 0; i < 2000; i++) {
      state = stepPingPong(state.position, state.speed, 150);
      assert.ok(Math.abs(state.position) <= 150.5);
    }
  });
});
