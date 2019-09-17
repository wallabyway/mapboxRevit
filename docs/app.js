'use strict';

mapboxgl.accessToken = 'pk.eyJ1Ijoid2FsbGFieXdheSIsImEiOiJjazBuaDQ5OGgxaHFwM2NvMm8wN2Ewb2xpIn0.1XKDCgUA5YKI_U9NGh4fqg';

// parameters to ensure the model is georeferenced correctly on the map
let modelAltitude = 0;
let modelRotate = [0, 0, -Math.PI / 10];
let modelOrigin = [-71.059505, 42.349448];  //use gltf/output.metadata.json -> metadata.georeference.positionLL84[lat,long]
const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude);


// Class to load a glTF file into mapBox
// https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/
// ----------------------------------------------------------

class glTFLayer {
    constructor(modelAsMercatorCoordinate) {
        this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		this.toast = document.getElementById('toast')

        this.id = '3d-model';
        this.type = 'custom';
        this.renderingMode = '3d';

        // transformation parameters to position, rotate and scale the 3D model onto the map
        this.modelTransform = {
            translateX: modelAsMercatorCoordinate.x,
            translateY: modelAsMercatorCoordinate.y,
            translateZ: modelAsMercatorCoordinate.z,
            rotateX: modelRotate[0],
            rotateY: modelRotate[1],
            rotateZ: modelRotate[2],
            // Since our 3D model is in real world meters, a scale transform needs to be applied since the CustomLayerInterface expects units in MercatorCoordinates.
            // 0.2 is a scale factor that should come from LMV
            scale: 0.2 * modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
        };
    }

    showPropertiesFromForge(id) {
    	const forgeURL = 'https://developer.api.autodesk.com';
    	const urn = "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6dnJwYXJ0eTEvcmFjX2FsbHZpZXdzMy5ydnQ";
    	const guid = "6c9aa7c5-0799-1c3c-a715-3ed2aafa21ab";
    	const token = _adsk.token.access_token;
    	fetch(`${forgeURL}/modelderivative/v2/designdata/${urn}/metadata/${guid}/properties`,
    		{ mode: 'cors', headers: { Accept: 'application/json', Authorization:`Bearer ${token}` }})
    		.then( res => res.json())
    		.then( res => {
    			//let prop = (res.data.collection.filter(i=>{return i.objectid==id}))[0];
                // Choose a random DBId, since the raycaster is broken :-(
    			let prop = res.data.collection[Math.round(Math.random()*100)];
        		toast.innerHTML = `properties:[ ${prop.name} ]`;
			    toast.classList.add('show');
    			clearTimeout(this.tmout) 
	        	this.tmout = setTimeout(function(){ toast.classList.remove('show') }, 3000);
    		});
    }

    onClick(e) {
		if (!this.camera) return;
    	this.mouse.x = ( e.originalEvent.clientX / window.innerWidth ) * 2 - 1;
		this.mouse.y = - ( e.originalEvent.clientY / window.innerHeight ) * 2 + 1;
		this.raycaster.setFromCamera( this.mouse, this.camera );
	    let id = this.raycaster.intersectObjects(this.scene.children);
	    this.showPropertiesFromForge(2891);

        // set bbox as 5px reactangle area around clicked point
        //var bbox = [[e.point.x - 5, e.point.y - 5], [e.point.x + 5, e.point.y + 5]];
    }

    onAdd(map, gl) {
        this.camera = new THREE.PerspectiveCamera();
        this.scene = new THREE.Scene();

        // create two three.js lights to illuminate the model
        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        var directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);

        // use the three.js GLTF loader to add the 3D model to the three.js scene
        var loader = new THREE.GLTFLoader();
        loader.load('gltf/output.gltf', (function(gltf) {
            this.scene.add(gltf.scene);
        }).bind(this));
        this.map = map;

        // use the Mapbox GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });

        this.renderer.autoClear = false;
    }

    render(gl, matrix) {
        var rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), this.modelTransform.rotateX);
        var rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), this.modelTransform.rotateY);
        var rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), this.modelTransform.rotateZ);
        var m = new THREE.Matrix4().fromArray(matrix);
        var l = new THREE.Matrix4().makeTranslation(this.modelTransform.translateX, this.modelTransform.translateY, this.modelTransform.translateZ)
            .scale(new THREE.Vector3(this.modelTransform.scale, -this.modelTransform.scale, this.modelTransform.scale))
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

        this.camera.projectionMatrix.elements = matrix;
        this.camera.projectionMatrix = m.multiply(l);
        this.renderer.state.reset();
        this.renderer.render(this.scene, this.camera);
    }
}


// Class to display 3D extruded buildings and fly to position
// https://docs.mapbox.com/mapbox-gl-js/example/3d-buildings/
// https://docs.mapbox.com/mapbox-gl-js/example/flyto-options/
// ----------------------------------------------------------

class buildingsLayer {
    constructor() {
        this.id = '3d-buildings';
        this.source = 'composite';
        this['source-layer'] = 'building';
        this.filter = ['==', 'extrude', 'true'];
        this.type = 'fill-extrusion',
        this.minzoom = 15,
        this.paint = {
            'fill-extrusion-color': '#aaa',

            // use an 'interpolate' expression to add a smooth transition effect to the
            // buildings as the user zooms in
            'fill-extrusion-height': [
                "interpolate", ["linear"],
                ["zoom"],
                15, 0,
                15.05, ["get", "height"]
            ],
            'fill-extrusion-base': [
                "interpolate", ["linear"],
                ["zoom"],
                15, 0,
                15.05, ["get", "min_height"]
            ],
            'fill-extrusion-opacity': .6
        };
	}

	flyToHome() {
		map.flyTo({ center: modelOrigin, zoom: 21, speed: 0.7 });
	}

    onAdd(map, gl) {	
	    // Insert the layer beneath any symbol layer.
	    var layers = map.getStyle().layers;

	    var labelLayerId;
	    for (var i = 0; i < layers.length; i++) {
	        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
	            labelLayerId = layers[i].id;
	            break;
	        }
	    }        
    }
}



// create our mapbox with our 3d model as center
// ----------------------------------------------------------

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    zoom: 18,
    center: modelOrigin,
    pitch: 60,
    antialias: true // create the gl context with MSAA antialiasing, so custom layers are antialiased
});


// Load 3D glTF model
const gltf = new glTFLayer( modelAsMercatorCoordinate );
map.on('load', function() { map.addLayer(gltf) });
map.on('click', function(e) { gltf.onClick(e) });


// Load 3D extruded buildings as layer
const buildings = new buildingsLayer();
map.on('load', function() { map.addLayer(buildings) });
