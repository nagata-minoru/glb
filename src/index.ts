import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OBB } from 'three/examples/jsm/math/OBB';

(async () => {
  let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
  let texturedCube: THREE.Mesh, loadedModel: GLTF, plane: THREE.Mesh;
  let modelGroup: THREE.Group, controls: OrbitControls;
  let gridHelper: THREE.GridHelper, axesHelper: THREE.AxesHelper;
  let light: THREE.DirectionalLight, ambient: THREE.AmbientLight;
  let obb: OBB;
  let obbHelper: THREE.Box3Helper;
  let sphere: THREE.Mesh;

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
    [obb, obbHelper] = createOBB(loadedModel);

    modelGroup = new THREE.Group();
    modelGroup.add(loadedModel.scene, obbHelper);
    modelGroup.userData.obb = obb;

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

    sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;

    sphere.userData.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1);

    sphere.position.y = 30;
    scene.add(sphere);
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
        (object) => resolve(object),
        undefined,
        (error) => console.log(error)
      )
    );

    model.scene.traverse((child: THREE.Object3D) => {
      child.castShadow = true;
    });

    model.scene.scale.set(50, 50, 50);

    return model;
  };

  const createOBB = (model: GLTF): [OBB, THREE.Box3Helper] => {
    const box = new THREE.Box3();
    const group = model.scene;
    box.setFromObject(group);
    const obb = new OBB();
    obb.fromBox3(box);
    const helper = new THREE.Box3Helper(box, new THREE.Color(0xffff00)); // 0xffff00 は黄色

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

  // Matrix4 を作成
  const rotationMatrix4 = new THREE.Matrix4();

  // X軸を中心に0.001回転
  rotationMatrix4.makeRotationAxis(new THREE.Vector3(1, 0, 0), 0.001);

  // Y軸を中心に0.001回転
  rotationMatrix4.makeRotationAxis(new THREE.Vector3(0, 1, 0), 0.001);

  // Z軸を中心に0.001回転
  rotationMatrix4.makeRotationAxis(new THREE.Vector3(0, 0, 1), 0.001);

  // Matrix4 を Matrix3 に変換
  const rotationMatrix3 = new THREE.Matrix3().setFromMatrix4(rotationMatrix4);

  /**
   * オブジェクトをアニメーションさせます。
   * キューブとモデルを回転させ、バウンディングボックスヘルパーを更新します。
   */
  const animateObjects = () => {
    // 球体を左右に動かす
    xPosition += speed;
    if (xPosition > 150 || xPosition < -150) {
      // 範囲外に出たら速度を反転
      speed *= -1;
    }
    sphere.position.x = xPosition;

    modelGroup.rotation.x += 0.001;
    modelGroup.rotation.y += 0.001;
    modelGroup.rotation.z += 0.001;

    modelGroup.userData.obb.applyMatrix4(modelGroup.matrixWorld);

    sphere.userData.boundingSphere.center.copy(sphere.position);

    if (modelGroup.userData.obb.intersectsSphere(sphere.userData.boundingSphere)) {
      (sphere.material as THREE.MeshBasicMaterial).color.set(0xff0000);
    } else {
      (sphere.material as THREE.MeshBasicMaterial).color.set(0x00ff00);
    }
  };

  window.onresize = handleResize;

  await initializeScene();
  animate();
})();
