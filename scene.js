import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
let previouslySelected = null;
let prevTime = 0;

let rightArrowPressed = false;
let leftArrowPressed = false;
let upArrowPressed = false;
let downArrowPressed = false;

camera.position.z = 5;

const gltfLoader = new GLTFLoader();
let arm;
gltfLoader.load("arm.glb", (glb) => {
	arm = glb.scene;
	arm.scale.set(4, 4, 4);
	arm.position.set(0, 0, 0);
	arm.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	scene.add(arm);
	console.log(arm);

	animate();
});

const ambientLight = new THREE.AmbientLight(0x606060, 2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x404040, 2, 50);
pointLight.position.setZ(3);
scene.add(pointLight);

function animate(time) {
	requestAnimationFrame(animate);

	let deltaTime = time - prevTime;

	if (rightArrowPressed && previouslySelected.name != "Alpha_Joints") {
		previouslySelected.rotation.z -= deltaTime * 0.005;

	} else if (leftArrowPressed && previouslySelected.name != "Alpha_Joints") {
		previouslySelected.rotation.z += deltaTime * 0.005;
	}
	else if (upArrowPressed && previouslySelected.name != "Alpha_Joints") {
		previouslySelected.rotation.x += deltaTime * 0.005;
	}
	else if (downArrowPressed && previouslySelected.name != "Alpha_Joints") {
		previouslySelected.rotation.x -= deltaTime * 0.005;
	}

	controls.update();

	renderer.render(scene, camera);

	prevTime = time;
}


window.addEventListener('click', onPointerDown);



function onPointerDown(event) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(pointer, camera);

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects(scene.children);


	if (intersects.length != 0) {
		let selected = intersects[0].object;
		if (!selected.name.includes("Joint")) {
			selected = intersects[0].object.parent;
		}
		console.log(selected);
		selected.material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });


		if (previouslySelected != null) {
			previouslySelected.material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
		}

		previouslySelected = selected;
	}
}
window.addEventListener('keydown', function (event) {

	switch (event.key) {
		case 'ArrowRight':
			rightArrowPressed = true;
			break;
		case 'ArrowLeft':
			leftArrowPressed = true;
			break;
		case 'ArrowUp':
			upArrowPressed = true;
			break;
		case 'ArrowDown':
			downArrowPressed = true;
			break;
	}
});

window.addEventListener('keyup', function (event) {

	switch (event.key) {
		case 'ArrowRight':
			rightArrowPressed = false;
			break;
		case 'ArrowLeft':
			leftArrowPressed = false;
			break;
        case 'ArrowUp':
			upArrowPressed = false;
			break;
		case 'ArrowDown':
			downArrowPressed = false;
			break;
	}
});


//window.requestAnimationFrame(render);