let WGL_OBJECTS = [];

function WGL_animate() {
    WGL_OBJECTS.forEach((wgl) => {
        wgl.animate();
    })

    requestAnimationFrame( WGL_animate );
}

function WGL_addObject(wgl) {
    WGL_OBJECTS.push(wgl);

    if(WGL_OBJECTS.length === 1)
        WGL_animate();
}

class WGL {
    constructor(domElement) {    
        this.font = new THREE.FontLoader().parse(WGL_FONT);

        this.domElement = domElement;

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 50, domElement.clientWidth / domElement.clientHeight, 0.1, 1000 );
        this.camera.position.set(0,6,15);
        this.camera.lookAt(0,0,0);
        this.renderer = new THREE.WebGLRenderer({
            antialias:true,
        });

        this.renderer.setSize( window.innerWidth, window.innerHeight );
        domElement.appendChild( this.renderer.domElement );
        domElement.addEventListener("resize", this.resize);

        this.directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
        this.directionalLight.position.set(100, 120, 150);
        this.scene.add( this.directionalLight );
        
        this.ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
        this.scene.add( this.ambientLight );

        WGL_addObject(this);
    }

    add_text(text, px, py, pz, height, alignment, rotationX) {
        let geometry = new THREE.TextGeometry( text, {
            font: this.font,
            size: height,
            height: .1,
            curveSegments: 2,
            bevelEnabled: false,
            bevelThickness: 10,
            bevelSize: 8,
            bevelOffset: 0,
            bevelSegments: 5,        
        });

        this.alignText(geometry, alignment);

        let material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
        let mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = px;
        mesh.position.y = py;
        mesh.position.z = pz;

        this.scene.add(mesh);
        return mesh;
    }

    alignText(geometry, alignment) {
        geometry.computeBoundingBox();

        let b = geometry.boundingBox;
        if(alignment === "c")
            geometry.translate(
                -b.min.x - (b.max.x-b.min.x)/2,
                0,
                -b.min.z - (b.max.z-b.min.z)/2
            );
        else if (alignment === "l")
            geometry.translate(
                -b.min.x,
                0,
                -b.min.z - (b.max.z-b.min.z)/2
            );
        else if (alignment === "r")
            geometry.translate(
                -b.max.x,
                0,
                -b.min.z - (b.max.z-b.min.z)/2
            );
    }

    create_custom_cube(px, py, pz, w=1, h=1, d=1) {
        let geometry = WGL_GEOMETRY.cube(w, h, d);
        let material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
        let mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = px;
        mesh.position.y = py;
        mesh.position.z = pz;

        return mesh;
    }

    resize() {
        this.camera.aspect = this.domElement.clientWidth / this.domElement.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.domElement.clientWidth, this.domElement.clientHeight)
    }

    animate() {
        this.renderer.render( this.scene, this.camera );
    }

    add_to_scene(element) {
        this.scene.add(element);
    }
}