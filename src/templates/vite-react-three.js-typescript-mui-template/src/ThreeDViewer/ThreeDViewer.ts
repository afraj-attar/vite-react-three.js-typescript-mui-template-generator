import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class ThreeDViewer {

    private scene: THREE.Scene;
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private sizes: { width: number, height: number };
    private controls: OrbitControls;

    constructor(canvasId: string) {

        /**
         * Initialize Scene
         */
        this.scene = new THREE.Scene();

        /**
         * Initialize Renderer
         */
        let canvas = document.getElementById(canvasId);
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = canvasId;
        }

        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        this.renderer = new THREE.WebGLRenderer({ canvas: canvas });
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(2);
        this.renderer.setClearColor(0x000000, 0);
        document.body.appendChild(this.renderer.domElement);

        /**
         * Initialize Camera
         */
        this.camera = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000);

        /**
         * Add Orbit Controls
         */
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.04;

        /**
         * Lights
         */
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xFFFFFF, 0.5);
        pointLight.position.set(2, 3, 4);
        this.scene.add(pointLight);


        window.addEventListener('resize', () => {
            this.resize();
        });

        this.animate();

        /**
         * For Debugging Purposes
         */
        this.addToGlobalVariables();

    }

    addToGlobalVariables(): void {

        //@ts-ignore
        window.THREE = THREE;

        //@ts-ignore
        window.scene = this.scene;

        //@ts-ignore
        window.camera = this.camera;

    }

    fitToView(): void {

        const bBox = new THREE.Box3();
        bBox.setFromObject(this.scene);

        const center = new THREE.Vector3();
        bBox.getCenter(center);

        const size = new THREE.Vector3();
        bBox.getSize(size);

        const directionVector = new THREE.Vector3(1, 1, 1);

        const distance = bBox.min.distanceTo(bBox.max);

        this.controls.reset();
        this.controls.target.copy(center);

        this.camera.position.copy(center.clone().addScaledVector(directionVector.normalize(), distance));
        this.camera.lookAt(center);
        this.camera.updateProjectionMatrix();

    }

    resize(): void {

        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;

        // Update camera
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(2);

    }

    // As an Example
    addCube(): void {

        const geometry = new THREE.BoxGeometry(1, 1, 1, 16, 16, 16);
        const material = new THREE.MeshNormalMaterial();
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = 2;
        cube.castShadow = true;
        this.scene.add(cube);

        this.fitToView();
    }

    animate(): void {

        this.controls.update();

        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(this.animate.bind(this));

    }

}

export { ThreeDViewer };