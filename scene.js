import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


let scene, camera, renderer, controls;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
let previouslySelected = null;
let prevTime = 0;
let selectedMat = new THREE.MeshBasicMaterial();

let rightArrowPressed = false;
let leftArrowPressed = false;
let upArrowPressed = false;
let downArrowPressed = false;

const rotationSpeed = 0.005;
const waveSpeed = 0.003;

const gltfLoader = new GLTFLoader();
let arm;

let waveNext = false;
const STATE = Object.freeze({
    MANUAL:   	Symbol("manual"),
    RESETTING:  Symbol("resetting"),
    WAVING: 	Symbol("waving")
});

let state = STATE.MANUAL;
const resetSpeed = 0.005;
let joints = [];


function initialize() {
	//Scene
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.z = 5;

	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	//Light
	const ambientLight = new THREE.AmbientLight(0x606060, 2);
	scene.add(ambientLight);

	const pointLight = new THREE.PointLight(0x404040, 2, 50);
	pointLight.position.setZ(3);
	scene.add(pointLight);

	//Orbit controls
	controls = new OrbitControls(camera, renderer.domElement);

	//Load arm
	gltfLoader.load("arm.glb", (glb) => {
		arm = glb.scene;
		arm.scale.set(7, 7, 7);
		arm.position.set(0, 0, 0);
		scene.add(arm);
		onInitialized();
	});

}

function onInitialized() {
	//Add events
	window.addEventListener('click', onPointerDown);
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);

	//Get joints
	joints.push(scene.getObjectByName("Alpha_Joints001"));
	joints.push(scene.getObjectByName("Alpha_Joints002"));
	joints.push(scene.getObjectByName("Alpha_Joints003"));

	//Start update
	requestAnimationFrame(animate);
}


function animate(time) {
	requestAnimationFrame(animate);
	let deltaTime = time - prevTime;

	update(time, deltaTime);

	controls.update();
	renderer.render(scene, camera);
	prevTime = time;
}

function update(time, deltaTime) {
	switch(state) {
		case STATE.MANUAL:
			updateManualControls(deltaTime);
			break;
		case STATE.RESETTING:
			reset(deltaTime);
			break;
		case STATE.WAVING:
			wave(time);
			break;
	}
}

//Rotate selected joint based on input
function updateManualControls(deltaTime) {
	if (previouslySelected == null) { return; }
	const rotationAmount = deltaTime * rotationSpeed;
	if (rightArrowPressed) {
		previouslySelected.rotation.z -= rotationAmount;

	} else if (leftArrowPressed) {
		previouslySelected.rotation.z += rotationAmount;
	}
	else if (upArrowPressed) {
		previouslySelected.rotation.x += rotationAmount;
	}
	else if (downArrowPressed) {
		previouslySelected.rotation.x -= rotationAmount;
	}
}

//Reset rotation of all joints to 0
function reset(deltaTime) {
	const rotationAmount = resetSpeed * deltaTime;
	let allReset = true;
	joints.forEach((joint) => {
		joint.rotation.x = Math.max((joint.rotation.x -rotationAmount), 0);
		joint.rotation.z = Math.max((joint.rotation.z -rotationAmount), 0);

		if (joint.rotation.x != 0 || joint.rotation.z != 0) {
			allReset = false;
		}
	});
	
	if (allReset) {
		if (waveNext) {
			state = STATE.WAVING;
			waveNext = false;
		} else {
			state = state.MANUAL;
		}
	}
}

//Rotate elbow and hand
function wave(time) {
	joints[1].rotation.z = 0.8 * Math.sin(waveSpeed * time) + Math.PI * 0.5;
	joints[2].rotation.z = 0.4 * Math.sin(waveSpeed * time);
	
}

function toggleWave() {
	state = state == STATE.WAVING ? STATE.MANUAL : STATE.WAVING;
}

//Setup for reseting the rotation of the joints
function startReset() {
	joints.forEach((joint) => {
		joint.rotation.x = joint.rotation.x % (Math.PI * 2);
		joint.rotation.z = joint.rotation.z % (Math.PI * 2);

		if(joint.rotation.x < 0) {
			joint.rotation.x = (Math.PI * 2) + joint.rotation.x;
		}

		if(joint.rotation.z < 0) {
			joint.rotation.z = (Math.PI * 2) + joint.rotation.z;
		}
	});

	state = STATE.RESETTING;
}

//Selects joint if clicked
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
		//Ignore fingers
		if (selected.name == "Alpha_Joints" || selected.name == "Alpha_Surface") { return; }
		if (!selected.name.includes("Joint")) {
			selected = intersects[0].object.parent;
		}

		selectedMat = selected.material;
		selected.material = new THREE.MeshBasicMaterial({ color: 0xFF0000 });


		if (previouslySelected != null) {
			previouslySelected.material = selectedMat;
		}

		previouslySelected = selected;
	}
}

function onKeyDown(event) {
	switch (event.code) {
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
		case 'Backspace':
			startReset();
			break;
		case 'Enter':
			toggleWave();
			break;
	}
}

function onKeyUp(event) {
	switch (event.code) {
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
}

initialize();