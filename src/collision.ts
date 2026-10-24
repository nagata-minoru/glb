import * as THREE from "three";
import { OBB } from 'three/addons/math/OBB.js';

/**
 * オブジェクト全体を囲む OBB を作成します。
 * @param {THREE.Object3D} object 囲む対象のオブジェクト。
 * @returns {{ obb: OBB, box3: THREE.Box3 }} 作成した OBB と、その元になった軸平行バウンディングボックス。
 */
export const createOBBFromObject = (object: THREE.Object3D): { obb: OBB, box3: THREE.Box3 } => {
  const box3 = new THREE.Box3().setFromObject(object);
  const obb = new OBB().fromBox3(box3);
  return { obb, box3 };
};

/**
 * ローカル座標の OBB にワールド行列を適用し、結果を target に書き込みます。
 * 毎フレーム呼ぶので、新しい OBB は作らず target を使い回します。
 * @param {OBB} target 結果を書き込む OBB。
 * @param {OBB} local ローカル座標の OBB。変更しません。
 * @param {THREE.Matrix4} matrixWorld 適用するワールド行列。
 * @returns {OBB} target。
 */
export const toWorldOBB = (target: OBB, local: OBB, matrixWorld: THREE.Matrix4): OBB => {
  return target.copy(local).applyMatrix4(matrixWorld);
};

/**
 * 立方体状に並べる点の座標を作ります。
 * @param {number} count 1辺に並べる個数。
 * @param {number} spacing 点と点の間隔。
 * @param {THREE.Vector3} origin 最初の点の座標。
 * @returns {THREE.Vector3[]} count の3乗個の座標。
 */
export const gridPositions = (count: number, spacing: number, origin: THREE.Vector3): THREE.Vector3[] => {
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      for (let k = 0; k < count; k++) {
        positions.push(new THREE.Vector3(i * spacing, j * spacing, k * spacing).add(origin));
      }
    }
  }
  return positions;
};

/**
 * 往復運動を1ステップ進めます。範囲外に出たら、次のステップから向きを反転します。
 * @param {number} position 現在の位置。
 * @param {number} speed 1ステップの移動量。
 * @param {number} limit 往復する範囲（-limit から limit）。
 * @returns {{ position: number, speed: number }} 進めた後の位置と、次のステップの移動量。
 */
export const stepPingPong = (position: number, speed: number, limit: number): { position: number, speed: number } => {
  const next = position + speed;
  if (next > limit || next < -limit) {
    return { position: next, speed: -speed };
  }
  return { position: next, speed };
};
