import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

(async () => {
  let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
  let texturedCube: THREE.Mesh, loadedModel: THREE.Group, plane: THREE.Mesh;
  let modelGroup: THREE.Group, controls: OrbitControls;
  let gridHelper: THREE.GridHelper, axesHelper: THREE.AxesHelper;
  let light: THREE.DirectionalLight, ambient: THREE.AmbientLight;

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

    modelGroup = new THREE.Group();
    modelGroup.add(loadedModel);

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
  const loadModel = async (): Promise<THREE.Group> => {
    const loader = new GLTFLoader();
    const model = await new Promise<THREE.Group>((resolve) =>
      loader.load(
        "./ennchuBaoundingBox.glb",
        (object) => resolve(object.scene),
        undefined,
        (error) => console.log(error)
      )
    );

    model.traverse((child) => {
      child.castShadow = true;
    });

    model.scale.set(50, 50, 50);

    return model;
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

  /**
   * オブジェクトをアニメーションさせます。
   * キューブとモデルを回転させ、バウンディングボックスヘルパーを更新します。
   */
  const animateObjects = () => {
    modelGroup.rotation.x += 0.001;
    modelGroup.rotation.y += 0.001;
    modelGroup.rotation.z += 0.001;
  };

  window.onresize = handleResize;

  await initializeScene();
  animate();
})();
