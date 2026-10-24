import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBB } from 'three/addons/math/OBB.js';
import { createOBBFromObject, gridPositions, stepPingPong, toWorldOBB } from './collision';

(async () => {
  let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
  let loadedModel: GLTF, plane: THREE.Mesh;
  let modelGroup: THREE.Group, controls: OrbitControls;
  let gridHelper: THREE.GridHelper, axesHelper: THREE.AxesHelper;
  let light: THREE.DirectionalLight, ambient: THREE.AmbientLight;
  let obb_: OBB;
  let obbHelper: THREE.Mesh;
  let sphere: THREE.Mesh;
  const smallSpheres: { mesh: THREE.Mesh, boundingSphere: THREE.Sphere }[] = [];
  const worldOBB = new OBB();

  let testBox: THREE.Mesh;

  /**
   * シーンを初期化します。
   * シーン、カメラ、レンダラー、テクスチャ付きキューブ、モデル、バウンディングボックスヘルパーを作成し、シーンに追加します。
   */
  const initializeScene = async () => {
    scene = new THREE.Scene();
    camera = createCamera();
    renderer = createRenderer();
    renderer.setClearColor(0xcfcfcf);
    document.body.appendChild(renderer.domElement);

    plane = createPlane();
    scene.add(plane);

    loadedModel = await loadModel();

    // モデルがロードされた後にOBBを作成
    [obb_, obbHelper] = createOBB(loadedModel);

    modelGroup = new THREE.Group();
    modelGroup.add(loadedModel.scene, obbHelper);

    scene.add(modelGroup);

    camera.position.z = 7;

    camera.position.set(200, 100, 300);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    controls = new OrbitControls(camera, renderer.domElement);

    gridHelper = new THREE.GridHelper(450, 20);
    scene.add(gridHelper);
    axesHelper = new THREE.AxesHelper(1000);
    scene.add(axesHelper);

    light = createLight();
    scene.add(light);

    const shadowHelper = createShadowHelper();
    scene.add(shadowHelper);

    ambient = new THREE.AmbientLight(0x404040, 0.9);
    scene.add(ambient);

    plane.receiveShadow = true;

    // 球体を作成
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    geometry.computeBoundingSphere();

    sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;

    sphere.position.y = 10;
    scene.add(sphere);

    // キューブに沿って小さい球を10x10x10個追加
    // 小球は静止しているので、ワールド座標のバウンディングスフィアをここで一度だけ計算しておく
    const smallSphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    smallSphereGeometry.computeBoundingSphere();
    gridPositions(10, 10, new THREE.Vector3(-5, 0, -5)).forEach((position) => {
      const smallSphere = createSmallSphere(smallSphereGeometry, position);
      scene.add(smallSphere);
      smallSphere.updateMatrixWorld();
      smallSpheres.push({
        mesh: smallSphere,
        boundingSphere: smallSphereGeometry.boundingSphere!.clone().applyMatrix4(smallSphere.matrixWorld),
      });
    });

    // 毎フレーム modelGroup のワールド行列をそのまま使うので自動更新は止めておく
    testBox = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshLambertMaterial({color: 0xff0000}));
    testBox.matrixAutoUpdate = false;

    scene.add(testBox);
  };

  /**
   * カメラを作成します。
   * @returns {THREE.PerspectiveCamera} 作成されたカメラ。
   */
  const createCamera = (): THREE.PerspectiveCamera => {
    return new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  };

  /**
   * レンダラーを作成します。
   * @returns {THREE.WebGLRenderer} 作成されたレンダラー。
   */
  const createRenderer = (): THREE.WebGLRenderer => {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    return renderer;
  };

  const createLight = () => {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 120, 80);
    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.left = -512;
    light.shadow.camera.right = 512;
    light.shadow.camera.top = 512;
    light.shadow.camera.bottom = -512;
    return light
  };

  const createShadowHelper = (): THREE.CameraHelper => {
    const shadowHelper = new THREE.CameraHelper(light.shadow.camera);
    return shadowHelper;
  };

  /**
   * 平面を作成します。
   * @returns {THREE.Mesh} 作成された平面。
   */
  const createPlane = (): THREE.Mesh => {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshLambertMaterial({ color: 0x0096d6, side: THREE.DoubleSide })
    );
    plane.position.y = -2;
    plane.rotateX(Math.PI / 2);
    plane.receiveShadow = true;
    return plane;
  };

  /**
   * モデルをロードします。
   * @returns {Promise<THREE.Group>} ロードされたモデル。
   */
  const loadModel = async (): Promise<GLTF> => {
    const loader = new GLTFLoader();
    const model = await new Promise<GLTF>((resolve) =>
      loader.load(
        "./ennchuBaoundingBox.glb",
        // "./BlackCho.glb",
        (object) => resolve(object),
        undefined,
        (error) => console.log(error)
      )
    );

    model.scene.position.x = 50;

    const material = new THREE.MeshBasicMaterial({wireframe: true, color: 0xff00ff});

    model.scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.castShadow = true;
      }
    });

    model.scene.scale.set(50, 50, 50);

    return model;
  };

  const createBoxFromBox3 = (box3: THREE.Box3): THREE.Mesh => {
    // Box3 のサイズと中心を計算
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box3.getSize(size);
    box3.getCenter(center);

    // Box の Geometry を作成
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z, 100);

    // Box の Material を作成（任意の色やテクスチャを設定できる）
    const material = new THREE.MeshLambertMaterial({ color: 0xffff00, wireframe: true });

    // Box の Mesh を作成
    const boxMesh = new THREE.Mesh(geometry, material);

    // Mesh の位置を Box3 の中心に設定
    boxMesh.position.copy(center);

    return boxMesh;
  };

  const createOBB = (model: GLTF): [OBB, THREE.Mesh] => {
    const { obb, box3 } = createOBBFromObject(model.scene);
    const helper = createBoxFromBox3(box3);

    return [obb, helper];
  };

  /**
   * ウィンドウがリサイズされたときに実行されます。
   * カメラとレンダラーのサイズを調整します。
   */
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  /**
   * アニメーションを実行します。
   * レンダリングループを開始し、オブジェクトをアニメーションさせ、シーンをレンダリングします。
   */
  const animate = () => {
    requestAnimationFrame(animate);
    animateObjects();
    renderer.render(scene, camera);
  };

  // 球体の初期位置
  let xPosition = 0;
  // 球体の移動速度
  let speed = 0.5;

  // 小さい球を作成する関数
  // 色を個別に変えるのでマテリアルは球ごとに作り、ジオメトリは共有する
  const createSmallSphere = (geometry: THREE.SphereGeometry, position: THREE.Vector3): THREE.Mesh => {
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: "blue" });
    const sphere = new THREE.Mesh(geometry, sphereMaterial);
    sphere.position.copy(position);
    sphere.castShadow = true;
    return sphere;
  };

  /**
   * オブジェクトをアニメーションさせます。
   * キューブとモデルを回転させ、バウンディングボックスヘルパーを更新します。
   */
  const animateObjects = () => {
    // 球体を左右に動かす
    ({ position: xPosition, speed } = stepPingPong(xPosition, speed, 150));
    sphere.position.x = xPosition;

    modelGroup.rotation.x += 0.001;
    modelGroup.rotation.y += 0.001;
    modelGroup.rotation.z += 0.001;
    // 描画前なので、回転を反映したワールド行列をここで計算しておく
    modelGroup.updateMatrixWorld();

    testBox.matrix.copy(modelGroup.matrixWorld);

    toWorldOBB(worldOBB, obb_, modelGroup.matrixWorld);

    if (worldOBB.containsPoint(sphere.position)) {
      (sphere.material as THREE.MeshBasicMaterial).color.set(0xff0000);
    } else {
      (sphere.material as THREE.MeshBasicMaterial).color.set(0x00ff00);
    }

    smallSpheres.forEach(({ mesh, boundingSphere }) => {
      if (worldOBB.intersectsSphere(boundingSphere)) {
        (mesh.material as THREE.MeshPhongMaterial).color.set(0xff0000); // 衝突した場合、球の色を赤に変更
      } else {
        (mesh.material as THREE.MeshPhongMaterial).color.set(0x0000ff); // 衝突していない場合、球の色を青に戻す
      }
    });
  };

  window.onresize = handleResize;

  await initializeScene();
  animate();
})();
